import type { ProjectData } from '../types/models';

const STORAGE_KEY = 'family-tree:project';
const FILE_NAME = 'family-tree.json';

// Cache the project directory handle and file handle after user grants permission
let projectDirectoryHandle: FileSystemDirectoryHandle | null = null;
let fileHandle: FileSystemFileHandle | null = null;
let loadedFileName: string | null = null;

export function createNewProject(): ProjectData {
  return { people: [], relationships: [] };
}

// Reset the cached file handle (useful for switching files)
export function resetFileHandle(): void {
  fileHandle = null;
  projectDirectoryHandle = null;
  loadedFileName = null;
}

// Get the currently loaded file name
export function getLoadedFileName(): string | null {
  return loadedFileName;
}

// Check if a file is currently loaded
export function isFileLoaded(): boolean {
  return (
    fileHandle !== null &&
    loadedFileName !== null &&
    projectDirectoryHandle !== null
  );
}

// Initialize by asking user to select the family tree data folder
export async function initializeProject(): Promise<ProjectData> {
  if (!('showDirectoryPicker' in window)) {
    console.warn(
      'File System Access API not supported, using localStorage fallback'
    );
    return loadProject(); // Fall back to localStorage
  }

  try {
    // Ask user to select the family tree data folder
    projectDirectoryHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    }); // Try to get the family-tree.json file
    let projectExists = false;
    try {
      fileHandle = await projectDirectoryHandle!.getFileHandle(FILE_NAME);
      loadedFileName = FILE_NAME;
      projectExists = true;
    } catch (fileError) {
      // File doesn't exist, we'll create it
      projectExists = false;
    }

    // Ensure that the photos directory exists
    try {
      await projectDirectoryHandle!.getDirectoryHandle('photos', {
        create: true,
      });
    } catch (dirError) {
      console.warn(
        'Could not access/create photos directory, but continuing...',
        dirError
      );
    }

    if (projectExists) {
      // Load the existing family tree data
      const file = await fileHandle!.getFile();
      const text = await file.text();
      const data = JSON.parse(text) as ProjectData;

      console.log(
        `Existing family tree data loaded from folder: ${
          projectDirectoryHandle!.name
        }`
      );

      return data;
    } else {
      // Create a new family tree file
      try {
        fileHandle = await projectDirectoryHandle!.getFileHandle(FILE_NAME, {
          create: true,
        });
        loadedFileName = FILE_NAME;

        const newProject = createNewProject();

        // Save the new project to the file
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(newProject, null, 2));
        await writable.close();

        console.log(
          `New family tree created in folder: ${projectDirectoryHandle!.name}`
        );
        return newProject;
      } catch (createError) {
        console.error('Failed to create new family tree:', createError);
        throw new Error(
          `Failed to create new family tree in the selected folder. Please ensure you have write permissions.`
        );
      }
    }
  } catch (error) {
    // Reset handles on error
    projectDirectoryHandle = null;
    fileHandle = null;
    loadedFileName = null;
    throw error;
  }
}

async function getFileHandle(): Promise<FileSystemFileHandle> {
  if (fileHandle && projectDirectoryHandle) {
    return fileHandle;
  }

  if (!('showDirectoryPicker' in window)) {
    console.warn(
      'File System Access API not supported, using localStorage fallback'
    );
    throw new Error('File System Access API not supported in this browser');
  }

  // If no file handle cached, initialize the family tree data
  await initializeProject();

  if (!fileHandle) {
    throw new Error('Failed to initialize family tree data');
  }

  return fileHandle;
}

export async function loadProject(): Promise<ProjectData> {
  // First try localStorage for immediate loading
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as ProjectData;
      return data;
    }
  } catch (err) {
    console.warn('Failed to load from localStorage:', err);
  }

  return createNewProject();
}

// Separate function that requires user gesture
export async function loadProjectFromFile(): Promise<ProjectData> {
  try {
    const fileHandle = await getFileHandle();
    const file = await fileHandle.getFile();
    const text = await file.text();

    if (text.trim()) {
      const data = JSON.parse(text) as ProjectData;
      // Also save to localStorage as backup
      await saveProject(data);
      return data;
    } else {
      // File exists but is empty, initialize it
      const newProject = createNewProject();
      await saveProject(newProject);
      return newProject;
    }
  } catch (err) {
    console.error('Failed to load from file:', err);
    throw err;
  }
}

export async function saveProject(data: ProjectData): Promise<void> {
  // Always save to localStorage as backup
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }

  // Save to file
  try {
    const fileHandle = await getFileHandle();
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  } catch (err) {
    console.error('Failed to save to file:', err);
    throw err;
  }
}

// Export current family tree data to downloads as family-tree.json
export async function exportProjectToFile(
  data: ProjectData,
  filename = 'family-tree.json'
): Promise<void> {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Import project data from a file
export async function importProjectFromFile(file: File): Promise<ProjectData> {
  const text = await file.text();
  const data = JSON.parse(text) as ProjectData;
  await saveProject(data); // Save to localStorage
  return data;
}

// Helper function to generate unique IDs
export function generateId(): string {
  return window.crypto && (window.crypto as any).randomUUID
    ? (window.crypto as any).randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Save photo file to the photos directory relative to the project folder
export async function savePhotoFile(
  blob: Blob,
  filename: string
): Promise<string> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('File System Access API not supported in this browser');
  }

  try {
    // Get or prompt for project directory
    projectDirectoryHandle ??= await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });

    // Create or get the photos directory
    const photosDir = await projectDirectoryHandle!.getDirectoryHandle(
      'photos',
      {
        create: true,
      }
    );

    // Create the file in the photos directory
    const fileHandle = await photosDir.getFileHandle(filename, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    const relativePath = `photos/${filename}`;
    return relativePath;
  } catch (error) {
    console.error('Failed to save photo:', error);
    throw error;
  }
}

// Load photo file from the photos directory
export async function loadPhotoFile(filename: string): Promise<string> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('File System Access API not supported in this browser');
  }

  try {
    // Get or prompt for project directory
    projectDirectoryHandle ??= await (window as any).showDirectoryPicker({
      mode: 'read',
      startIn: 'documents',
    });

    // Get the photos directory
    const photosDir = await projectDirectoryHandle!.getDirectoryHandle(
      'photos'
    );

    // Get the file from the photos directory
    const fileHandle = await photosDir.getFileHandle(filename);

    const file = await fileHandle.getFile();

    // Create blob URL for display
    const blobUrl = URL.createObjectURL(file);
    return blobUrl;
  } catch (error) {
    console.error('Failed to load photo:', error);
    // Return empty string if photo can't be loaded
    return '';
  }
}

// Delete photo file from the photos directory
export async function deletePhotoFile(filename: string): Promise<void> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('File System Access API not supported in this browser');
  }

  try {
    // Ensure we have the project directory handle
    if (!projectDirectoryHandle) {
      throw new Error(
        'No project directory selected. Please initialize project first.'
      );
    }

    // Get the photos directory
    const photosDir = await projectDirectoryHandle.getDirectoryHandle('photos');

    // Remove the file from the photos directory
    await photosDir.removeEntry(filename);
  } catch (error) {
    console.error('Failed to delete photo:', error);
    throw new Error(`Failed to delete photo file: ${filename}`);
  }
}

// Reset the cached directory handle
export function resetProjectDirectory(): void {
  projectDirectoryHandle = null;
}

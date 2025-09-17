import {
  AppShell,
  Button,
  Container,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import {
  IconBinaryTree2,
  IconHierarchy3,
  IconUsers,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import InteractiveGraphTab from './components/network/InteractiveNetworkTab';
import PeopleTab from './components/people/PeopleTab';
import FocusViewTab from './components/tree/TreeViewTab';
import {
  createNewProject,
  generateId,
  getLoadedFileName,
  initializeProject,
  resetFileHandle,
  saveProject,
} from './db/storage';
import { PhotoProvider } from './hooks/usePhotoContext';
import type { Person, ProjectData, Relationship } from './types/models';
import { preloadAllPhotos } from './utils/photo-loader';

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // For multi-selection
  const [project, setProject] = useState<ProjectData | null>(null);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('people');

  useEffect(() => {
    (async () => {
      // Always start with a new family tree and require explicit folder selection
      setProject(createNewProject());
      setFileLoaded(false);
      setFileName(null);
    })();
  }, []);

  async function addPerson(person: Person) {
    const current = project ?? createNewProject();
    const updated: ProjectData = {
      ...current,
      people: [...current.people, person],
    };
    setProject(updated);
    await saveProject(updated);
  }

  async function addRelationship(relationshipData: Omit<Relationship, 'id'>) {
    if (!project) return;

    const relationship: Relationship = {
      ...relationshipData,
      id: generateId(),
    };

    const updated: ProjectData = {
      ...project,
      relationships: [...project.relationships, relationship],
    };
    setProject(updated);
    await saveProject(updated);
  }

  async function addRelationships(
    relationshipDataList: Omit<Relationship, 'id'>[]
  ) {
    if (!project) return;

    const relationships: Relationship[] = relationshipDataList.map((data) => ({
      ...data,
      id: generateId(),
    }));

    const updated: ProjectData = {
      ...project,
      relationships: [...project.relationships, ...relationships],
    };
    setProject(updated);
    await saveProject(updated);
  }

  function updatePerson(updatedPerson: Person) {
    if (!project) return;

    const updatedProject = {
      ...project,
      people: project.people.map((p) =>
        p.id === updatedPerson.id ? updatedPerson : p
      ),
    };
    setProject(updatedProject);
    saveProject(updatedProject);
  }

  function deletePerson(personId: string) {
    if (!project) return;

    const updatedProject = {
      ...project,
      people: project.people.filter((p) => p.id !== personId),
      relationships: project.relationships.filter(
        (r) => r.fromId !== personId && r.toId !== personId
      ),
    };
    setProject(updatedProject);
    saveProject(updatedProject);
  }

  function deleteRelationship(relationshipId: string) {
    if (!project) return;

    const updatedProject = {
      ...project,
      relationships: project.relationships.filter(
        (r) => r.id !== relationshipId
      ),
    };
    setProject(updatedProject);
    saveProject(updatedProject);
  }

  function selectPerson(personId: string) {
    setSelectedId(personId);
    setActiveTab('focus'); // Switch to tree view when selecting a person
  }

  function selectPersonWithoutTabChange(personId: string) {
    // Handle unselect (empty string) or regular selection
    setSelectedId(personId || null); // Only set selection, don't change tabs
  }

  function selectPersonInGraph(personId: string) {
    // Handle unselect (empty string) or regular selection
    setSelectedId(personId || null); // Only set selection, don't change tabs
  }

  function togglePersonSelection(personId: string) {
    setSelectedIds((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function selectAllPeople() {
    if (project) {
      setSelectedIds(project.people.map((p) => p.id));
    }
  }

  // Helper function for displaying folder name
  const getDisplayFileName = () => {
    if (!fileName) return '';
    const truncated = fileName.slice(0, 15);
    return fileName.length > 15 ? `${truncated}...` : truncated;
  };

  return (
    <PhotoProvider>
      <AppShell header={{ height: 60 }} style={{ height: '100vh' }}>
        <AppShell.Header>
          <Container
            fluid
            className='app-header'
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Title order={3} className='app-title'>
                Family Tree
              </Title>

              {/* Move tabs to header for more space */}
              {fileLoaded && (
                <Tabs value={activeTab} onChange={setActiveTab} variant='pills'>
                  <Tabs.List>
                    <Tabs.Tab
                      value='people'
                      leftSection={<IconUsers size={14} />}
                    >
                      People
                    </Tabs.Tab>
                    <Tabs.Tab
                      value='graph'
                      leftSection={<IconBinaryTree2 size={14} />}
                    >
                      Network
                    </Tabs.Tab>
                    <Tabs.Tab
                      value='focus'
                      leftSection={<IconHierarchy3 size={14} />}
                    >
                      Tree View
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs>
              )}
            </div>

            <div className='app-search'>
              {fileLoaded ? (
                <>
                  <Button
                    onClick={async () => {
                      try {
                        // Reset current project and allow user to select new folder
                        resetFileHandle();
                        const fileProject = await initializeProject();
                        setProject(fileProject);
                        setFileLoaded(true);
                        setFileName(getLoadedFileName());

                        // Preload all photos from the new project
                        await preloadAllPhotos(fileProject.people);
                      } catch (err) {
                        alert(
                          'Failed to change project: ' + (err as any).message
                        );
                      }
                    }}
                    size='sm'
                    variant='light'
                    color='green'
                  >
                    📁 {getDisplayFileName()}
                  </Button>
                  <Button
                    onClick={() => {
                      resetFileHandle();
                      setFileLoaded(false);
                      setFileName(null);
                    }}
                    size='sm'
                    variant='outline'
                    color='gray'
                  >
                    Switch Folder
                  </Button>
                </>
              ) : (
                <Text size='sm' c='gray.6'>
                  No data loaded
                </Text>
              )}
            </div>
          </Container>
        </AppShell.Header>

        <AppShell.Main
          style={{
            paddingTop: '68px', // Header height (60px) + gap (8px)
            padding: '68px 8px 8px 8px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            height: '100vh',
          }}
        >
          {fileLoaded ? (
            <>
              {/* People Tab Content */}
              {activeTab === 'people' && project && (
                <div
                  style={{
                    height: 'calc(100vh - 76px)', // Full height minus header + padding
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                  }}
                >
                  <PeopleTab
                    project={project}
                    onUpdatePerson={updatePerson}
                    onDeletePerson={deletePerson}
                    onAddPerson={addPerson}
                    onAddRelationship={addRelationship}
                    onAddRelationships={addRelationships}
                    onDeleteRelationship={deleteRelationship}
                    onSelectPerson={selectPersonWithoutTabChange}
                    onFocusPerson={selectPerson}
                    selectedIds={selectedIds}
                    onToggleSelection={togglePersonSelection}
                    onClearSelection={clearSelection}
                    onSelectAll={selectAllPeople}
                    selectedPersonId={selectedId}
                  />
                </div>
              )}

              {/* Network Tab Content - Full space for interactive graph */}
              {activeTab === 'graph' && project && (
                <div
                  style={{
                    height: 'calc(100vh - 76px)', // Full height minus header + padding
                    overflow: 'hidden',
                  }}
                >
                  <InteractiveGraphTab
                    project={project}
                    selectedPersonId={selectedId || undefined}
                    onSelectPerson={selectPersonInGraph}
                  />
                </div>
              )}

              {/* Tree View Tab Content */}
              {activeTab === 'focus' && project && (
                <div
                  style={{
                    height: 'calc(100vh - 76px)', // Full height minus header + padding
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  <FocusViewTab
                    project={project}
                    selectedPersonId={selectedId || undefined}
                    onSelectPerson={selectPerson}
                  />
                </div>
              )}
            </>
          ) : (
            <Stack align='center' gap='xl' style={{ marginTop: '80px' }}>
              <Title order={2} ta='center' c='gray.6'>
                Welcome to Family Tree
              </Title>
              <Text size='lg' ta='center' c='gray.7' maw={600}>
                To get started, please select a folder for your family tree
                data.
              </Text>
              <Stack gap='sm' align='center'>
                <Text size='sm' ta='center' c='gray.6' maw={500}>
                  • If the folder contains an existing{' '}
                  <code>family-tree.json</code>, we'll load your data
                </Text>
                <Text size='sm' ta='center' c='gray.6' maw={500}>
                  • If it's an empty folder, we'll create a new family tree with
                  the necessary files
                </Text>
              </Stack>
              <Button
                onClick={async () => {
                  try {
                    const fileProject = await initializeProject();
                    setProject(fileProject);
                    setFileLoaded(true);
                    setFileName(getLoadedFileName());

                    // Preload all photos from the new project
                    await preloadAllPhotos(fileProject.people);
                  } catch (err) {
                    alert(
                      'Failed to load family tree data: ' + (err as any).message
                    );
                  }
                }}
                size='lg'
                variant='filled'
              >
                📁 Select Family Tree Folder
              </Button>
            </Stack>
          )}
        </AppShell.Main>
      </AppShell>
    </PhotoProvider>
  );
}

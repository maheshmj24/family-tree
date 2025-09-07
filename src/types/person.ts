export type Person = {
  id: string;
  displayName: string;
  fullName?: string;
  nickname?: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string; // ISO date string
  deathDate?: string; // ISO date string
  alive?: boolean;
  avatar?: string; // Filename or path to photo (e.g., "photos/person-id.jpg")
  createdAt?: string;
  updatedAt?: string;
};

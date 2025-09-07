// Re-export utilities
export {
  calculateAge,
  calculateAgeAtDeath,
  getAgeDisplay,
} from './age-helpers';
export {
  getRelationshipLabel,
  isBidirectionalRelationship,
  isParentChildRelationship,
} from './relationship-helpers';
export { RelationshipResolver } from './relationship-resolver';

/**
 * Extract the first name from a full display name
 * @param displayName - The full name of the person
 * @returns The first name only
 */
export function getFirstName(displayName: string): string {
  if (!displayName || displayName.trim() === '') {
    return displayName;
  }

  // Split by space and take the first part
  const parts = displayName.trim().split(/\s+/);
  return parts[0];
}

/**
 * Format gender for display in the people table
 * @param gender - The gender value from the person record
 * @returns Short gender display: M/F/O or '-' if not specified
 */
export function formatGenderDisplay(
  gender?: 'male' | 'female' | 'other'
): string {
  if (!gender) return '-';

  switch (gender) {
    case 'male':
      return 'M';
    case 'female':
      return 'F';
    case 'other':
      return 'O';
    default:
      return '-';
  }
}

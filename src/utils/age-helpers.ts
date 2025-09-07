/**
 * Age calculation utilities for the Family Tree app
 */

/**
 * Calculate a person's current age from their birth date
 * Uses floor rounding (5 years 11 months = 5 years)
 */
export function calculateAge(
  birthDate?: string,
  referenceDate?: Date
): number | undefined {
  if (!birthDate) return undefined;

  const today = referenceDate || new Date();
  const birth = new Date(birthDate);

  // Check if birth date is valid
  if (isNaN(birth.getTime())) return undefined;

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  // If birthday hasn't occurred this year yet, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 0 ? age : undefined;
}

/**
 * Calculate age at death from birth and death dates
 */
export function calculateAgeAtDeath(
  birthDate?: string,
  deathDate?: string
): number | undefined {
  if (!birthDate || !deathDate) return undefined;

  return calculateAge(birthDate, new Date(deathDate));
}

/**
 * Get display text for a person's age
 */
export function getAgeDisplay(person: {
  birthDate?: string;
  deathDate?: string;
  alive?: boolean;
}): string {
  if (!person.birthDate) return '';

  if (person.alive === false && person.deathDate) {
    const ageAtDeath = calculateAgeAtDeath(person.birthDate, person.deathDate);
    return ageAtDeath !== undefined ? `${ageAtDeath} (at death)` : '';
  }

  const currentAge = calculateAge(person.birthDate);
  return currentAge !== undefined ? `${currentAge}` : '';
}

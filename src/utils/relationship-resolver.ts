import type { AllRelationshipTypes, Person, Relationship } from '../types';
import { DerivedRelationshipType, RelationshipType } from '../types';

/**
 * Utility class for resolving and deriving family relationships
 */
export class RelationshipResolver {
  private readonly people: Person[];
  private readonly relationships: Relationship[];

  constructor(people: Person[], relationships: Relationship[]) {
    this.people = people;
    this.relationships = relationships;
  }

  /**
   * Get all relationships for a person (both explicit and derived)
   */
  getRelationshipsForPerson(personId: string): Array<{
    person: Person;
    relationship: AllRelationshipTypes;
    isDerived: boolean;
  }> {
    const results: Array<{
      person: Person;
      relationship: AllRelationshipTypes;
      isDerived: boolean;
    }> = [];

    // Add explicit relationships
    this.relationships.forEach((rel) => {
      if (rel.fromId === personId) {
        // Person is the "from" in the relationship
        const person = this.people.find((p) => p.id === rel.toId);
        if (person) {
          let relationshipToShow: AllRelationshipTypes;

          // For parent relationships, if you're the "from" person, you're the parent
          // So show the "to" person as your child
          switch (rel.type) {
            case RelationshipType.Parent:
            case RelationshipType.AdoptiveParent:
            case RelationshipType.StepParent:
              relationshipToShow = DerivedRelationshipType.Child;
              break;
            case RelationshipType.Spouse:
            case RelationshipType.Partner:
            case RelationshipType.Other:
              // These are bidirectional - same relationship type
              relationshipToShow = rel.type;
              break;
            default:
              relationshipToShow = rel.type;
          }

          results.push({
            person,
            relationship: relationshipToShow,
            isDerived: false,
          });
        }
      } else if (rel.toId === personId) {
        // Person is the "to" in the relationship - show the appropriate relationship
        const person = this.people.find((p) => p.id === rel.fromId);
        if (person) {
          let relationshipToShow: AllRelationshipTypes;

          // Map relationships based on being the "to" person
          switch (rel.type) {
            case RelationshipType.Parent:
            case RelationshipType.AdoptiveParent:
            case RelationshipType.StepParent:
              // If you're the "to" person in a parent relationship, they are your parent
              relationshipToShow = rel.type;
              break;
            case RelationshipType.Spouse:
            case RelationshipType.Partner:
            case RelationshipType.Other: {
              // For bidirectional relationships, only add if we haven't already added this pair
              // Check if this pair was already added from the "fromId" direction
              const alreadyAdded = results.some(
                (r) => r.person.id === person.id && r.relationship === rel.type
              );
              if (alreadyAdded) return;

              relationshipToShow = rel.type;
              break;
            }
            case RelationshipType.Guardian:
            case RelationshipType.Godparent:
              // These are unidirectional - show the relationship
              relationshipToShow = rel.type;
              break;
            default:
              relationshipToShow = rel.type;
          }

          results.push({
            person,
            relationship: relationshipToShow,
            isDerived: false,
          });
        }
      }
    });

    // Add derived relationships
    const derived = this.getDerivedRelationships(personId);
    results.push(...derived);

    return results;
  }

  /**
   * Get siblings (people with common parents)
   */
  getSiblings(personId: string): Person[] {
    const parents = this.getParents(personId);
    if (parents.length === 0) return [];

    const siblings: Person[] = [];

    // Find all people who share at least one parent
    this.people.forEach((person) => {
      if (person.id === personId) return; // Skip self

      const personParents = this.getParents(person.id);
      const hasCommonParent = parents.some((parent) =>
        personParents.some((personParent) => personParent.id === parent.id)
      );

      if (hasCommonParent) {
        siblings.push(person);
      }
    });

    return siblings;
  }

  /**
   * Get direct parents
   */
  getParents(personId: string): Person[] {
    return this.relationships
      .filter(
        (rel) =>
          rel.toId === personId &&
          (rel.type === RelationshipType.Parent ||
            rel.type === RelationshipType.AdoptiveParent ||
            rel.type === RelationshipType.StepParent)
      )
      .map((rel) => this.people.find((p) => p.id === rel.fromId))
      .filter(Boolean) as Person[];
  }

  /**
   * Get direct children
   */
  getChildren(personId: string): Person[] {
    return this.relationships
      .filter(
        (rel) =>
          rel.fromId === personId &&
          (rel.type === RelationshipType.Parent ||
            rel.type === RelationshipType.AdoptiveParent ||
            rel.type === RelationshipType.StepParent)
      )
      .map((rel) => this.people.find((p) => p.id === rel.toId))
      .filter(Boolean) as Person[];
  }

  /**
   * Get spouse/partner
   */
  getSpouse(personId: string): Person | null {
    const spouseRel = this.relationships.find(
      (rel) =>
        (rel.fromId === personId || rel.toId === personId) &&
        (rel.type === RelationshipType.Spouse ||
          rel.type === RelationshipType.Partner)
    );

    if (!spouseRel) return null;

    const spouseId =
      spouseRel.fromId === personId ? spouseRel.toId : spouseRel.fromId;
    return this.people.find((p) => p.id === spouseId) || null;
  }

  private getDerivedRelationships(personId: string): Array<{
    person: Person;
    relationship: AllRelationshipTypes;
    isDerived: boolean;
  }> {
    const results: Array<{
      person: Person;
      relationship: AllRelationshipTypes;
      isDerived: boolean;
    }> = [];

    // Get explicit relationships to avoid duplicating them in derived
    const explicitRelationships = new Set<string>();
    this.relationships.forEach((rel) => {
      if (rel.fromId === personId) {
        explicitRelationships.add(`${rel.toId}-${rel.type}`);
        // For parent relationships, we show children explicitly, so mark them
        if (
          rel.type === RelationshipType.Parent ||
          rel.type === RelationshipType.AdoptiveParent ||
          rel.type === RelationshipType.StepParent
        ) {
          explicitRelationships.add(`${rel.toId}-child`);
        }
      } else if (rel.toId === personId) {
        explicitRelationships.add(`${rel.fromId}-${rel.type}`);
      }
    });

    // Add siblings
    this.getSiblings(personId).forEach((sibling) => {
      const key = `${sibling.id}-sibling`;
      if (!explicitRelationships.has(key)) {
        results.push({
          person: sibling,
          relationship: DerivedRelationshipType.Sibling,
          isDerived: true,
        });
      }
    });

    // Add grandparents (parents of parents)
    const parents = this.getParents(personId);
    parents.forEach((parent) => {
      this.getParents(parent.id).forEach((grandparent) => {
        const key = `${grandparent.id}-grandparent`;
        if (!explicitRelationships.has(key)) {
          results.push({
            person: grandparent,
            relationship: DerivedRelationshipType.Grandparent,
            isDerived: true,
          });
        }
      });
    });

    // Add grandchildren (children of children)
    const children = this.getChildren(personId);
    children.forEach((child) => {
      this.getChildren(child.id).forEach((grandchild) => {
        results.push({
          person: grandchild,
          relationship: DerivedRelationshipType.Grandchild,
          isDerived: true,
        });
      });
    });

    return results;
  }
}

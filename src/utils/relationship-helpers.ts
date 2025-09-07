import type { AllRelationshipTypes } from '../types';
import { DerivedRelationshipType, RelationshipType } from '../types';

/**
 * Helper to get human-readable relationship labels
 */
export const getRelationshipLabel = (
  relationship: AllRelationshipTypes
): string => {
  const labels: Record<AllRelationshipTypes, string> = {
    // Explicit relationship types
    [RelationshipType.Parent]: 'Parent',
    [RelationshipType.Spouse]: 'Spouse',
    [RelationshipType.Partner]: 'Partner',
    [RelationshipType.AdoptiveParent]: 'Adoptive Parent',
    [RelationshipType.StepParent]: 'Step-parent',
    [RelationshipType.Guardian]: 'Guardian',
    [RelationshipType.Godparent]: 'Godparent',
    [RelationshipType.Other]: 'Other',

    // Derived relationship types
    [DerivedRelationshipType.Child]: 'Child',
    [DerivedRelationshipType.Sibling]: 'Sibling',
    [DerivedRelationshipType.Grandparent]: 'Grandparent',
    [DerivedRelationshipType.Grandchild]: 'Grandchild',
    [DerivedRelationshipType.Uncle]: 'Uncle',
    [DerivedRelationshipType.Aunt]: 'Aunt',
    [DerivedRelationshipType.Nephew]: 'Nephew',
    [DerivedRelationshipType.Niece]: 'Niece',
    [DerivedRelationshipType.Cousin]: 'Cousin',
    [DerivedRelationshipType.ParentInLaw]: 'Parent-in-law',
    [DerivedRelationshipType.ChildInLaw]: 'Child-in-law',
    [DerivedRelationshipType.SiblingInLaw]: 'Sibling-in-law',
    [DerivedRelationshipType.StepSibling]: 'Step-sibling',
  };

  return labels[relationship] || relationship;
};

/**
 * Check if a relationship type is bidirectional
 */
export const isBidirectionalRelationship = (
  type: RelationshipType
): boolean => {
  return [
    RelationshipType.Spouse,
    RelationshipType.Partner,
    RelationshipType.Other,
  ].includes(type);
};

/**
 * Check if a relationship type represents a parent-child relationship
 */
export const isParentChildRelationship = (type: RelationshipType): boolean => {
  return [
    RelationshipType.Parent,
    RelationshipType.AdoptiveParent,
    RelationshipType.StepParent,
  ].includes(type);
};

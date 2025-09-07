export enum RelationshipType {
  // Core relationships that must be explicitly defined
  Parent = 'parent', // A is parent of B
  Spouse = 'spouse', // A is married to/partnered with B
  Partner = 'partner', // A is in relationship with B (non-married)

  // Special cases that can't be easily derived
  AdoptiveParent = 'adoptive-parent', // A adopted B
  StepParent = 'step-parent', // A is step-parent of B
  Guardian = 'guardian', // A is legal guardian of B
  Godparent = 'godparent', // A is godparent of B

  // Flexible catch-all
  Other = 'other',
}

// Derived relationships - calculated automatically from core relationships
export enum DerivedRelationshipType {
  Child = 'child', // Derived from Parent (reverse)
  Sibling = 'sibling', // Derived from common parents
  Grandparent = 'grandparent', // Derived from parent of parent
  Grandchild = 'grandchild', // Derived from child of child
  Uncle = 'uncle', // Derived from sibling of parent
  Aunt = 'aunt', // Derived from sibling of parent
  Nephew = 'nephew', // Derived from child of sibling
  Niece = 'niece', // Derived from child of sibling
  Cousin = 'cousin', // Derived from child of uncle/aunt
  ParentInLaw = 'parent-in-law', // Derived from parent of spouse
  ChildInLaw = 'child-in-law', // Derived from spouse of child
  SiblingInLaw = 'sibling-in-law', // Derived from sibling of spouse
  StepSibling = 'step-sibling', // Derived from step-parent relationships
}

// Utility type for all relationship types (core + derived)
export type AllRelationshipTypes = RelationshipType | DerivedRelationshipType;

export type Relationship = {
  id: string;
  fromId: string; // Person who "has" this relationship
  toId: string; // Person who "is" this relationship to fromId
  type: RelationshipType;
  startDate?: string; // When relationship began (marriage, adoption, etc.)
  endDate?: string; // When relationship ended (divorce, death, etc.)
  notes?: string; // Additional context about the relationship
  isActive?: boolean; // Whether relationship is currently active
  metadata?: {
    marriageLocation?: string;
    adoptionDate?: string;
    [key: string]: any;
  };
};

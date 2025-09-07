# Family Tree Types and Utilities

This folder contains the organized type definitions and utility functions for the family tree application.

## Structure

### Types (`/types`)

- **`person.ts`** - Person entity type definition
- **`relationship.ts`** - Relationship types and enums
- **`project.ts`** - Project data container type
- **`index.ts`** - Convenient re-exports of all types

### Utilities (`/utils`)

- **`relationship-resolver.ts`** - Core class for resolving family relationships
- **`relationship-helpers.ts`** - Helper functions for relationship operations
- **`index.ts`** - Convenient re-exports of all utilities

## Usage

### Importing Types

```typescript
// Import all types from the main entry point
import type {
  Person,
  Relationship,
  ProjectData,
  AllRelationshipTypes,
} from '../types';
import { RelationshipType, DerivedRelationshipType } from '../types';

// Or import specific types
import type { Person } from '../types/person';
import type { Relationship } from '../types/relationship';
```

### Using Utilities

```typescript
// Import utilities
import { RelationshipResolver, getRelationshipLabel } from '../utils';

// Create resolver
const resolver = new RelationshipResolver(people, relationships);

// Get relationships for a person
const personRelationships = resolver.getRelationshipsForPerson(personId);

// Get human-readable labels
const label = getRelationshipLabel(RelationshipType.Parent); // "Parent"
```

## Migration Notes

The original `models.ts` file has been kept for backward compatibility but now re-exports from the new organized structure. Components should gradually be updated to import from the new structure:

**Old way:**

```typescript
import { RelationshipResolver, type Person } from '../types/models';
```

**New way:**

```typescript
import type { Person } from '../types';
import { RelationshipResolver } from '../utils';
```

## Benefits

1. **Separation of Concerns** - Types and logic are separated
2. **Better Organization** - Related functionality is grouped together
3. **Easier Maintenance** - Smaller, focused files are easier to maintain
4. **Reusability** - Utilities can be easily reused across components
5. **Type Safety** - Better TypeScript support with focused type definitions

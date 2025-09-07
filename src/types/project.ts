import type { Person } from './person';
import type { Relationship } from './relationship';

export type ProjectData = {
  people: Person[];
  relationships: Relationship[];
};

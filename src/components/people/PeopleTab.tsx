import type { Person, ProjectData, Relationship } from '../../types';
import PeopleManager from './PeopleManager';

type Props = {
  readonly project: ProjectData;
  readonly onUpdatePerson: (person: Person) => void;
  readonly onDeletePerson: (personId: string) => void;
  readonly onAddPerson: (person: Person) => Promise<void>;
  readonly onAddRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  readonly onAddRelationships: (
    relationships: Omit<Relationship, 'id'>[]
  ) => Promise<void>;
  readonly onDeleteRelationship: (relationshipId: string) => void;
  readonly onSelectPerson: (personId: string) => void;
  readonly onFocusPerson?: (personId: string) => void;
  readonly selectedIds: string[];
  readonly onToggleSelection: (personId: string) => void;
  readonly onClearSelection: () => void;
  readonly onSelectAll: () => void;
  readonly selectedPersonId?: string | null;
};

export default function PeopleTab({
  project,
  onUpdatePerson,
  onDeletePerson,
  onAddPerson,
  onAddRelationship,
  onAddRelationships,
  onDeleteRelationship,
  onSelectPerson,
  onFocusPerson,
  selectedIds,
  onToggleSelection,
  onClearSelection,
  onSelectAll,
  selectedPersonId,
}: Props) {
  return (
    <PeopleManager
      project={project}
      onUpdatePerson={onUpdatePerson}
      onDeletePerson={onDeletePerson}
      onAddPerson={onAddPerson}
      onAddRelationship={onAddRelationship}
      onAddRelationships={onAddRelationships}
      onDeleteRelationship={onDeleteRelationship}
      onSelectPerson={onSelectPerson}
      onFocusPerson={onFocusPerson}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onClearSelection={onClearSelection}
      onSelectAll={onSelectAll}
      selectedPersonId={selectedPersonId}
    />
  );
}

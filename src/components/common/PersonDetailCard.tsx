import { Card, Divider, Stack } from '@mantine/core';
import type { Person, ProjectData } from '../../types/models';
import PersonCard from './PersonCard';
import RelationshipDisplay from './RelationshipDisplay';

type Props = {
  readonly person: Person;
  readonly project: ProjectData;
  readonly onSelect?: (id: string) => void;
  readonly isSelected?: boolean;
};

export default function PersonDetailCard({
  person,
  project,
  onSelect,
  isSelected = false,
}: Props) {
  return (
    <Card shadow='sm' padding='lg' radius='md' withBorder>
      <Stack gap='md'>
        <PersonCard
          person={person}
          onSelect={onSelect}
          isSelected={isSelected}
        />

        <Divider />

        <RelationshipDisplay person={person} project={project} />
      </Stack>
    </Card>
  );
}

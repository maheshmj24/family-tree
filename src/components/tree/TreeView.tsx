import { Button, Card, Grid, Group, Space, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import type { ProjectData } from '../../types/models';
import { calculateAge, calculateAgeAtDeath } from '../../utils';
import PersonCard from '../common/PersonCard';
import PersonDetailCard from '../common/PersonDetailCard';

type Props = {
  readonly personId?: string | null;
  readonly project?: ProjectData | null;
  readonly onSelectPerson?: (id: string) => void;
};

export default function FocusTree({
  personId,
  project,
  onSelectPerson,
}: Props) {
  const [showAllPeople, setShowAllPeople] = useState(false);

  const selectedPerson =
    personId && project ? project.people.find((p) => p.id === personId) : null;

  // Sort people by age (descending), people without age first
  const allPeople = (project?.people || []).sort((a, b) => {
    const isDeceasedA = !a.alive || !!a.deathDate;
    const isDeceasedB = !b.alive || !!b.deathDate;

    const ageA =
      isDeceasedA && a.deathDate
        ? calculateAgeAtDeath(a.birthDate, a.deathDate)
        : calculateAge(a.birthDate);

    const ageB =
      isDeceasedB && b.deathDate
        ? calculateAgeAtDeath(b.birthDate, b.deathDate)
        : calculateAge(b.birthDate);

    // People without age (null/undefined) should be first (treated as oldest)
    if (ageA === null && ageB === null) return 0;
    if (ageA === null) return -1; // A comes first
    if (ageB === null) return 1; // B comes first

    // Both have ages, sort by descending age
    return (ageB || 0) - (ageA || 0);
  });

  if (!project || allPeople.length === 0) {
    return (
      <Card shadow='sm' padding='lg' radius='md' className='focus-tree'>
        <Text fw={700}>Focus View</Text>
        <Space h='sm' />
        <Text c='dimmed'>No people in your family tree yet.</Text>
        <Text c='dimmed'>Add some people to get started!</Text>
      </Card>
    );
  }

  return (
    <Stack gap='md' className='focus-tree'>
      <Card shadow='sm' padding='lg' radius='md'>
        <Group justify='space-between' align='center'>
          <Text fw={700}>Focus View</Text>
          <Button
            variant='outline'
            size='xs'
            onClick={() => setShowAllPeople(!showAllPeople)}
          >
            {showAllPeople ? 'Hide All' : 'Show All People'}
          </Button>
        </Group>
        <Space h='sm' />

        {selectedPerson ? (
          <Text c='dimmed'>Focused on: {selectedPerson.displayName}</Text>
        ) : (
          <Stack gap='xs'>
            <Text c='dimmed'>Click on a person card to focus on them</Text>
            <Text size='sm' c='blue'>
              💡 Select a person to see their 3-layer family hierarchy
            </Text>
          </Stack>
        )}
      </Card>

      {/* Selected Person Detail with Relationships */}
      {selectedPerson && project && (
        <PersonDetailCard
          person={selectedPerson}
          project={project}
          onSelect={onSelectPerson}
          isSelected={true}
        />
      )}

      {/* All People or Focused View */}
      <Card shadow='sm' padding='lg' radius='md'>
        <Text fw={600} mb='md'>
          {showAllPeople
            ? `All People (${allPeople.length})`
            : 'Family Members'}
        </Text>

        <Grid gutter='md'>
          {(showAllPeople ? allPeople : allPeople.slice(0, 6)).map((person) => (
            <Grid.Col span={6} key={person.id}>
              <PersonCard
                person={person}
                onSelect={onSelectPerson}
                isSelected={person.id === personId}
              />
            </Grid.Col>
          ))}
        </Grid>

        {!showAllPeople && allPeople.length > 6 && (
          <Group justify='center' mt='md'>
            <Button
              variant='light'
              size='sm'
              onClick={() => setShowAllPeople(true)}
            >
              Show all {allPeople.length} people
            </Button>
          </Group>
        )}
      </Card>
    </Stack>
  );
}

import { Badge, Box, Group, Stack, Text } from '@mantine/core';
import type { AllRelationshipTypes, Person, ProjectData } from '../../types';
import { RelationshipResolver, getRelationshipLabel } from '../../utils';

type Props = {
  readonly person: Person;
  readonly project: ProjectData;
};

export default function RelationshipDisplay({ person, project }: Props) {
  const resolver = new RelationshipResolver(
    project.people,
    project.relationships
  );
  const relationships = resolver.getRelationshipsForPerson(person.id);

  // Separate explicit and derived relationships
  const explicitRelationships = relationships.filter((r) => !r.isDerived);
  const derivedRelationships = relationships.filter((r) => r.isDerived);

  if (relationships.length === 0) {
    return (
      <Box>
        <Text size='sm' c='dimmed'>
          No relationships defined
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap='md'>
      {explicitRelationships.length > 0 && (
        <Box>
          <Text size='sm' fw={600} mb='xs'>
            Direct
          </Text>
          <Stack gap='xs'>
            {Object.entries(
              explicitRelationships.reduce((acc, rel) => {
                const key = rel.relationship;
                if (!acc[key]) acc[key] = [];
                acc[key].push(rel);
                return acc;
              }, {} as Record<AllRelationshipTypes, typeof explicitRelationships>)
            ).map(([relationshipType, rels]) => (
              <Group key={relationshipType} gap='xs'>
                <Badge variant='filled' size='sm' color='blue'>
                  {getRelationshipLabel(
                    relationshipType as AllRelationshipTypes
                  )}
                </Badge>
                <Text size='sm'>
                  {rels.map((r) => r.person.displayName).join(', ')}
                </Text>
              </Group>
            ))}
          </Stack>
        </Box>
      )}

      {derivedRelationships.length > 0 && (
        <Box>
          <Text size='sm' fw={600} mb='xs' c='dimmed'>
            Derived
          </Text>
          <Stack gap='xs'>
            {Object.entries(
              derivedRelationships.reduce((acc, rel) => {
                const key = rel.relationship;
                if (!acc[key]) acc[key] = [];
                acc[key].push(rel);
                return acc;
              }, {} as Record<AllRelationshipTypes, typeof derivedRelationships>)
            ).map(([relationshipType, rels]) => (
              <Group key={relationshipType} gap='xs'>
                <Badge variant='light' size='sm' color='gray'>
                  {getRelationshipLabel(
                    relationshipType as AllRelationshipTypes
                  )}
                </Badge>
                <Text size='sm' c='dimmed'>
                  {rels.map((r) => r.person.displayName).join(', ')}
                </Text>
              </Group>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

import { Box, Card, Stack, Text } from '@mantine/core';
import { IconHierarchy3 } from '@tabler/icons-react';
import { RelationshipResolver, type ProjectData } from '../../types/models';
import type { Person } from '../../types/person';
import { calculateAge, calculateAgeAtDeath } from '../../utils/age-helpers';
import PersonCard from '../common/PersonCard';

type Props = {
  readonly focusPersonId: string;
  readonly project: ProjectData;
  readonly onSelectPerson?: (id: string) => void;
};

// Hierarchy icon between layers - pointing down (parents to focus)
const HierarchyDown = () => (
  <Box
    style={{
      width: '100%',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '4px 0',
      flexShrink: 0,
    }}
  >
    <IconHierarchy3
      size={20}
      color='var(--mantine-color-gray-5)'
      style={{ opacity: 0.7 }}
    />
  </Box>
);

// Hierarchy icon between layers - pointing up (focus to children)
const HierarchyUp = () => (
  <Box
    style={{
      width: '100%',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '4px 0',
      transform: 'rotate(180deg)',
      flexShrink: 0,
    }}
  >
    <IconHierarchy3
      size={20}
      color='var(--mantine-color-gray-5)'
      style={{ opacity: 0.7 }}
    />
  </Box>
); // Simple connecting line between layers (keeping as fallback)
const SimpleLine = () => (
  <Box
    style={{
      width: '100%',
      height: '2px',
      backgroundColor: 'var(--mantine-color-gray-4)',
      margin: '8px 0',
    }}
  />
);

export default function HierarchicalFocusView({
  focusPersonId,
  project,
  onSelectPerson,
}: Props) {
  const resolver = new RelationshipResolver(
    project.people,
    project.relationships
  );
  const focusPerson = project.people.find((p) => p.id === focusPersonId);

  // Helper function to determine if content will overflow and need scrolling
  const shouldUseFlexStart = (itemCount: number, cardWidth: number) => {
    const gap = 16; // gap between cards in px
    const padding = 48; // total horizontal padding (24px * 2)
    const totalContentWidth =
      itemCount * cardWidth + (itemCount - 1) * gap + padding;

    // Estimate available width (this is a reasonable default for most screens)
    // In a real scenario, you might want to use a ref to get actual container width
    const estimatedAvailableWidth = window.innerWidth * 0.8; // 80% of viewport width

    return totalContentWidth > estimatedAvailableWidth;
  };

  // Helper function to sort people by age criteria
  const sortPeopleByAge = (people: Person[]) => {
    return [...people].sort((a, b) => {
      // Calculate ages for both people
      const ageA =
        a.alive !== false
          ? calculateAge(a.birthDate)
          : calculateAgeAtDeath(a.birthDate, a.deathDate);
      const ageB =
        b.alive !== false
          ? calculateAge(b.birthDate)
          : calculateAgeAtDeath(b.birthDate, b.deathDate);

      // People without ages come first
      if (ageA === undefined && ageB !== undefined) return -1;
      if (ageA !== undefined && ageB === undefined) return 1;

      // If both have no ages, sort alphabetically by displayName
      if (ageA === undefined && ageB === undefined) {
        return a.displayName.localeCompare(b.displayName);
      }

      // If both have ages, sort in descending order (older first)
      if (ageA !== undefined && ageB !== undefined) {
        return ageB - ageA;
      }

      return 0;
    });
  };

  if (!focusPerson) {
    return (
      <Card shadow='sm' padding='lg' radius='md'>
        <Text c='dimmed'>Person not found</Text>
      </Card>
    );
  }

  // Get generational layers
  const parents = sortPeopleByAge(resolver.getParents(focusPersonId));
  const siblings = sortPeopleByAge(resolver.getSiblings(focusPersonId));
  const children = sortPeopleByAge(resolver.getChildren(focusPersonId));

  // Middle generation: Focus person + siblings, all sorted together
  const middleGeneration = sortPeopleByAge([focusPerson, ...siblings]);

  return (
    <Stack gap={0} style={{ height: '100%', width: '100%' }}>
      {/* Upper Generation - Parents (2.1/6.8 of height) - Always visible */}
      <Box
        style={{
          flex: '2.1 1 0',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {parents.length > 0 && (
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '0 24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  minWidth: '100%',
                  justifyContent: shouldUseFlexStart(parents.length, 140)
                    ? 'flex-start'
                    : 'center',
                }}
              >
                {parents.map((parent) => (
                  <div
                    key={parent.id}
                    style={{
                      flexShrink: 0,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <PersonCard
                      person={parent}
                      onSelect={onSelectPerson}
                      isSelected={false}
                      size='small'
                    />
                  </div>
                ))}
              </div>
            </div>
          </Box>
        )}
        <HierarchyDown />
      </Box>

      {/* Middle Generation - Focus Person + Siblings (2.5/6.8 of height) - Always visible */}
      <Box
        style={{
          flex: '2.5 1 0',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.08)', // Subtle inset shadow to highlight the focus level
          position: 'relative',
        }}
      >
        <Box
          style={{
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              overflowX: 'auto',
              overflowY: 'hidden',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '0 24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                minWidth: '100%',
                justifyContent: shouldUseFlexStart(middleGeneration.length, 180)
                  ? 'flex-start'
                  : 'center',
              }}
            >
              {middleGeneration.map((person) => (
                <div
                  key={person.id}
                  style={{
                    flexShrink: 0,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <PersonCard
                    person={person}
                    onSelect={onSelectPerson}
                    isSelected={person.id === focusPersonId}
                    size='large'
                  />
                </div>
              ))}
            </div>
          </div>
        </Box>
      </Box>

      {/* Lower Generation - Children (2.1/6.8 of height) - Always visible */}
      <Box
        style={{
          flex: '2.1 1 0',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <HierarchyUp />
        {children.length > 0 && (
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '0 24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  minWidth: '100%',
                  justifyContent: shouldUseFlexStart(children.length, 140)
                    ? 'flex-start'
                    : 'center',
                }}
              >
                {children.map((child) => (
                  <div
                    key={child.id}
                    style={{
                      flexShrink: 0,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <PersonCard
                      person={child}
                      onSelect={onSelectPerson}
                      isSelected={false}
                      size='small'
                    />
                  </div>
                ))}
              </div>
            </div>
          </Box>
        )}
      </Box>
    </Stack>
  );
}

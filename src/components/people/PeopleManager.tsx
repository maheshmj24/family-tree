import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Group,
  Modal,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconPlus,
  IconSearch,
  IconSelector,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { usePhoto } from '../../hooks/usePhoto';
import {
  RelationshipResolver,
  type Person,
  type ProjectData,
  type Relationship,
} from '../../types/models';
import { calculateAge, calculateAgeAtDeath } from '../../utils';
import RelationshipDisplay from '../common/RelationshipDisplay';
import PersonForm from './PersonForm';
import PersonTableRow from './PersonTableRow';
import RelationshipForm from './RelationshipForm';

// Enhanced person details view component
function PersonDetailsView({
  person,
  project,
}: {
  readonly person: Person;
  readonly project: ProjectData;
}) {
  const { photoUrl } = usePhoto(person.avatar);

  return (
    <Stack gap='lg'>
      {/* Header with photo and name */}
      <Flex gap='md' align='center'>
        <Avatar src={photoUrl} size={80} radius='md' style={{ flexShrink: 0 }}>
          {person.displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()}
        </Avatar>
        <Box style={{ flex: 1 }}>
          <Title order={2} size='h2' mb='xs'>
            {person.displayName}
          </Title>
          {person.nickname && (
            <Text size='sm' c='dimmed'>
              "{person.nickname}"
            </Text>
          )}
        </Box>
      </Flex>

      {/* Personal Information Card */}
      <Card withBorder>
        <Card.Section withBorder inheritPadding py='sm'>
          <Text fw={600}>Personal Information</Text>
        </Card.Section>
        <Card.Section inheritPadding py='md'>
          <Stack gap='sm'>
            <Group justify='space-between'>
              <Text c='dimmed'>Full Name</Text>
              <Text>{person.fullName || 'Not specified'}</Text>
            </Group>
            {person.gender && (
              <Group justify='space-between'>
                <Text c='dimmed'>Gender</Text>
                <Text>
                  {person.gender.charAt(0).toUpperCase() +
                    person.gender.slice(1)}
                </Text>
              </Group>
            )}
            {person.birthDate && (
              <Group justify='space-between'>
                <Text c='dimmed'>Birth Date</Text>
                <Text>{new Date(person.birthDate).toLocaleDateString()}</Text>
              </Group>
            )}
            {(() => {
              const isDeceased = !person.alive || !!person.deathDate;
              const age =
                isDeceased && person.deathDate
                  ? calculateAgeAtDeath(person.birthDate, person.deathDate)
                  : calculateAge(person.birthDate);

              return (
                age !== undefined && (
                  <Group justify='space-between'>
                    <Text c='dimmed'>Age</Text>
                    <Text>
                      {age}
                      {isDeceased ? ' (at death)' : ''}
                    </Text>
                  </Group>
                )
              );
            })()}
          </Stack>
        </Card.Section>
      </Card>

      {/* Relationships Card */}
      <Card withBorder>
        <Card.Section withBorder inheritPadding py='sm'>
          <Text fw={600}>Family Relationships</Text>
        </Card.Section>
        <Card.Section inheritPadding py='md'>
          <RelationshipDisplay person={person} project={project} />
        </Card.Section>
      </Card>
    </Stack>
  );
}

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
  readonly onSelectPerson?: (personId: string) => void;
  readonly selectedIds?: string[];
  readonly onToggleSelection?: (personId: string) => void;
  readonly onClearSelection?: () => void;
  readonly onSelectAll?: () => void;
};

export default function PeopleManager({
  project,
  onUpdatePerson,
  onDeletePerson,
  onAddPerson,
  onAddRelationship,
  onAddRelationships,
  onDeleteRelationship,
  onSelectPerson,
  selectedIds = [],
  onToggleSelection,
  onClearSelection,
  onSelectAll,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);
  const [viewingPersonId, setViewingPersonId] = useState<string | null>(null);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [addRelationshipOpen, setAddRelationshipOpen] = useState(false);
  const [showOnlyUnrelated, setShowOnlyUnrelated] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'age' | 'gender' | null>(
    null
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const resolver = new RelationshipResolver(
    project.people,
    project.relationships
  );

  // Handle multiple relationship submissions (e.g., both parents)
  const handleSubmitMultiple = async (
    relationships: Omit<Relationship, 'id'>[]
  ) => {
    await onAddRelationships(relationships);
  };

  // Handle sorting
  const handleSort = (field: 'name' | 'age' | 'gender') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get relationship count and status for a person
  const getPersonRelationshipStatus = (personId: string) => {
    const relationships = resolver.getRelationshipsForPerson(personId);
    const explicitRelationships = relationships.filter((r) => !r.isDerived);

    return {
      total: relationships.length,
      explicit: explicitRelationships.length,
      hasRelationships: relationships.length > 0, // Consider both explicit and derived relationships
    };
  };

  // Filter and sort people based on search query and sort settings
  const filteredAndSortedPeople = useMemo(() => {
    let filtered = project.people;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (person) =>
          person.displayName.toLowerCase().includes(query) ||
          person.fullName?.toLowerCase().includes(query) ||
          person.nickname?.toLowerCase().includes(query)
      );
    }

    // Apply unrelated people filter
    if (showOnlyUnrelated) {
      filtered = filtered.filter((person) => {
        const relationshipStatus = getPersonRelationshipStatus(person.id);
        return !relationshipStatus.hasRelationships;
      });
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        if (sortField === 'name') {
          aValue = a.displayName.toLowerCase();
          bValue = b.displayName.toLowerCase();
        } else if (sortField === 'gender') {
          // Sort by gender: female, male, other, then no gender
          const genderOrder = { female: 1, male: 2, other: 3 };
          aValue = a.gender ? genderOrder[a.gender] || 4 : 4;
          bValue = b.gender ? genderOrder[b.gender] || 4 : 4;
        } else {
          // age
          const aIsDeceased = !a.alive || !!a.deathDate;
          const aAge =
            aIsDeceased && a.deathDate
              ? calculateAgeAtDeath(a.birthDate, a.deathDate)
              : calculateAge(a.birthDate);

          const bIsDeceased = !b.alive || !!b.deathDate;
          const bAge =
            bIsDeceased && b.deathDate
              ? calculateAgeAtDeath(b.birthDate, b.deathDate)
              : calculateAge(b.birthDate);

          aValue = aAge || 0;
          bValue = bAge || 0;
        }

        if (sortDirection === 'asc') {
          if (aValue < bValue) return -1;
          if (aValue > bValue) return 1;
          return 0;
        } else {
          if (aValue > bValue) return -1;
          if (aValue < bValue) return 1;
          return 0;
        }
      });
    }

    return filtered;
  }, [
    project.people,
    searchQuery,
    sortField,
    sortDirection,
    showOnlyUnrelated,
    project.relationships,
  ]);

  const handleDeletePerson = (personId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this person? This will also remove all their relationships.'
      )
    ) {
      // Remove relationships involving this person
      project.relationships
        .filter((rel) => rel.fromId === personId || rel.toId === personId)
        .forEach((rel) => onDeleteRelationship(rel.id));

      onDeletePerson(personId);

      // Clear selection if deleted person was selected
      if (selectedPersonId === personId) {
        setSelectedPersonId(null);
      }
    }
  };

  const selectedPerson = selectedPersonId
    ? project.people.find((p) => p.id === selectedPersonId)
    : null;
  const editingPerson = editingPersonId
    ? project.people.find((p) => p.id === editingPersonId)
    : null;
  const viewingPerson = viewingPersonId
    ? project.people.find((p) => p.id === viewingPersonId)
    : null;

  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Card
        shadow='sm'
        padding='lg'
        radius='md'
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* Header with Search and Action Buttons */}
        <Group justify='space-between' align='center' mb='md'>
          <Group align='center' gap='md'>
            <TextInput
              placeholder='Search people by name...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              size='md'
              style={{ width: 280 }}
            />
            <Badge variant='light' color='blue'>
              {filteredAndSortedPeople.length} of {project.people.length}
            </Badge>
            <Switch
              label='No relationships'
              checked={showOnlyUnrelated}
              onChange={(event) =>
                setShowOnlyUnrelated(event.currentTarget.checked)
              }
              size='sm'
            />
          </Group>
          <Group gap='md' align='center'>
            {selectedIds.length > 0 && (
              <>
                <Badge variant='outline' color='blue'>
                  {selectedIds.length} selected
                </Badge>
                <Button
                  onClick={onClearSelection}
                  variant='outline'
                  color='red'
                  size='sm'
                  disabled={selectedIds.length === 0}
                >
                  Clear Selection
                </Button>
              </>
            )}
            <Button
              onClick={() => setAddRelationshipOpen(true)}
              variant='outline'
              color='teal'
              size='sm'
              leftSection={<IconPlus size={16} />}
            >
              {selectedIds.length > 1
                ? 'Add Relationships - Batch'
                : 'Add Relationship'}
            </Button>
            <Button
              onClick={() => setAddPersonOpen(true)}
              variant='filled'
              color='blue'
              size='sm'
              leftSection={<IconPlus size={16} />}
            >
              Add Person
            </Button>
          </Group>
        </Group>

        {/* Master/Detail Layout */}
        <Flex gap='md' style={{ flex: 1, minHeight: 0 }}>
          {/* People List */}
          <Box
            style={{
              flex: '0 0 65%', // Fixed 65% width
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            {filteredAndSortedPeople.length === 0 ? (
              <Text c='dimmed' ta='center' py='xl'>
                {searchQuery
                  ? 'No people found matching your search.'
                  : 'No people in your family tree yet.'}
              </Text>
            ) : (
              <Box
                style={{
                  flex: 1,
                  overflow: 'auto',
                  border: '1px solid var(--mantine-color-gray-3)',
                  borderRadius: '8px',
                }}
              >
                <Table striped highlightOnHover>
                  <Table.Thead
                    style={{
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'var(--mantine-color-body)',
                      zIndex: 1,
                    }}
                  >
                    <Table.Tr>
                      <Table.Th style={{ width: '50px', padding: '8px' }}>
                        <Checkbox
                          size='sm'
                          checked={
                            selectedIds.length ===
                              filteredAndSortedPeople.length &&
                            filteredAndSortedPeople.length > 0
                          }
                          indeterminate={
                            selectedIds.length > 0 &&
                            selectedIds.length < filteredAndSortedPeople.length
                          }
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            if (e.currentTarget.checked) {
                              onSelectAll?.();
                            } else {
                              onClearSelection?.();
                            }
                          }}
                        />
                      </Table.Th>
                      <Table.Th>
                        <UnstyledButton
                          onClick={() => handleSort('name')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                          }}
                        >
                          Name
                          {(() => {
                            if (sortField === 'name') {
                              return sortDirection === 'asc' ? (
                                <IconChevronUp size={14} />
                              ) : (
                                <IconChevronDown size={14} />
                              );
                            }
                            return <IconSelector size={14} opacity={0.5} />;
                          })()}
                        </UnstyledButton>
                      </Table.Th>
                      <Table.Th>
                        <UnstyledButton
                          onClick={() => handleSort('age')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                          }}
                        >
                          Age
                          {(() => {
                            if (sortField === 'age') {
                              return sortDirection === 'asc' ? (
                                <IconChevronUp size={14} />
                              ) : (
                                <IconChevronDown size={14} />
                              );
                            }
                            return <IconSelector size={14} opacity={0.5} />;
                          })()}
                        </UnstyledButton>
                      </Table.Th>
                      <Table.Th>
                        <UnstyledButton
                          onClick={() => handleSort('gender')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                          }}
                        >
                          Gender
                          {(() => {
                            if (sortField === 'gender') {
                              return sortDirection === 'asc' ? (
                                <IconChevronUp size={14} />
                              ) : (
                                <IconChevronDown size={14} />
                              );
                            }
                            return <IconSelector size={14} opacity={0.5} />;
                          })()}
                        </UnstyledButton>
                      </Table.Th>
                      <Table.Th>Relationships</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredAndSortedPeople.map((person) => {
                      const relationshipStatus = getPersonRelationshipStatus(
                        person.id
                      );
                      const isDeceased = !person.alive || !!person.deathDate;
                      const age =
                        isDeceased && person.deathDate
                          ? calculateAgeAtDeath(
                              person.birthDate,
                              person.deathDate
                            )
                          : calculateAge(person.birthDate);

                      return (
                        <PersonTableRow
                          key={person.id}
                          person={person}
                          age={age}
                          relationshipStatus={relationshipStatus}
                          isSelected={selectedPersonId === person.id}
                          onSelect={setSelectedPersonId}
                          onView={setViewingPersonId}
                          onEdit={setEditingPersonId}
                          onDelete={handleDeletePerson}
                          onFocus={onSelectPerson}
                          isMultiSelected={selectedIds.includes(person.id)}
                          onToggleMultiSelect={onToggleSelection}
                        />
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Box>
            )}
          </Box>

          {/* Relationships Panel - Always Visible */}
          <Box
            style={{
              flex: '0 0 35%', // Fixed 35% width
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <Box
              style={{
                flex: 1,
                overflow: 'auto',
                border: '1px solid var(--mantine-color-gray-3)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              {selectedPerson ? (
                <>
                  <Group justify='space-between' mb='md'>
                    <Text fw={600}>
                      Relationships for {selectedPerson.displayName}
                    </Text>
                    <Group gap='xs'>
                      <Button
                        size='xs'
                        leftSection={<IconPlus size={14} />}
                        onClick={() => setShowRelationshipForm(true)}
                      >
                        Add to {selectedPerson.displayName}
                      </Button>
                      <Button
                        size='xs'
                        variant='subtle'
                        color='gray'
                        onClick={() => setSelectedPersonId(null)}
                        title='Clear selection'
                      >
                        ✕
                      </Button>
                    </Group>
                  </Group>

                  <Stack gap='md'>
                    <RelationshipDisplay
                      person={selectedPerson}
                      project={project}
                    />

                    {/* Explicit Relationships with CRUD */}
                    <Box>
                      <Text size='sm' fw={600} mb='xs'>
                        Manage
                      </Text>
                      {(() => {
                        const resolver = new RelationshipResolver(
                          project.people,
                          project.relationships
                        );
                        const allRelationships =
                          resolver.getRelationshipsForPerson(selectedPerson.id);
                        const explicitRelationships = allRelationships.filter(
                          (r) => !r.isDerived
                        );

                        return explicitRelationships.map((rel) => {
                          // Find the original relationship record that created this resolved relationship
                          const originalRelationship =
                            project.relationships.find((relationship) => {
                              return (
                                (relationship.fromId === selectedPerson.id &&
                                  relationship.toId === rel.person.id) ||
                                (relationship.toId === selectedPerson.id &&
                                  relationship.fromId === rel.person.id)
                              );
                            });

                          if (!originalRelationship) return null;

                          return (
                            <Card
                              key={originalRelationship.id}
                              padding='sm'
                              withBorder
                              mb='xs'
                            >
                              <Group justify='space-between'>
                                <Box>
                                  <Text size='sm' fw={500}>
                                    {rel.relationship} →{' '}
                                    {rel.person.displayName}
                                  </Text>
                                  {originalRelationship.notes && (
                                    <Text size='xs' c='dimmed'>
                                      {originalRelationship.notes}
                                    </Text>
                                  )}
                                </Box>
                                <ActionIcon
                                  variant='subtle'
                                  color='red'
                                  size='sm'
                                  onClick={() => {
                                    if (
                                      confirm(
                                        'Are you sure you want to delete this relationship?'
                                      )
                                    ) {
                                      onDeleteRelationship(
                                        originalRelationship.id
                                      );
                                    }
                                  }}
                                >
                                  <IconTrash size={12} />
                                </ActionIcon>
                              </Group>
                            </Card>
                          );
                        });
                      })()}
                    </Box>
                  </Stack>
                </>
              ) : (
                <Stack
                  gap='lg'
                  align='center'
                  justify='center'
                  style={{ height: '100%', textAlign: 'center' }}
                >
                  <IconUsers size={48} color='var(--mantine-color-gray-5)' />
                  <Box>
                    <Text size='lg' fw={600} c='dimmed' mb='xs'>
                      Select a person to view relationships
                    </Text>
                    <Text size='sm' c='dimmed'>
                      Click on any person in the list to see their family
                      connections and manage their relationships.
                    </Text>
                  </Box>
                </Stack>
              )}
            </Box>
          </Box>
        </Flex>
      </Card>

      {/* Edit Person Modal */}
      {editingPerson && (
        <PersonForm
          initial={editingPerson}
          open={!!editingPerson}
          onCancel={() => setEditingPersonId(null)}
          onSubmit={async (updatedPerson) => {
            onUpdatePerson(updatedPerson);
            setEditingPersonId(null);
          }}
        />
      )}

      {/* View Person Details Modal */}
      {viewingPerson && (
        <Modal
          opened={!!viewingPerson}
          onClose={() => setViewingPersonId(null)}
          title={null}
          size='lg'
          centered
        >
          <PersonDetailsView person={viewingPerson} project={project} />
        </Modal>
      )}

      {/* Add Relationship Modal */}
      {selectedPerson && (
        <RelationshipForm
          opened={showRelationshipForm}
          onClose={() => setShowRelationshipForm(false)}
          people={project.people}
          relationships={project.relationships}
          fromPerson={selectedPerson}
          onSubmit={(relationshipData) => {
            onAddRelationship(relationshipData);
            setShowRelationshipForm(false);
          }}
          onSubmitMultiple={async (relationships) => {
            await handleSubmitMultiple(relationships);
            setShowRelationshipForm(false);
          }}
        />
      )}

      {/* Add Person Modal */}
      <PersonForm
        open={addPersonOpen}
        onCancel={() => setAddPersonOpen(false)}
        onSubmit={async (person: Person) => {
          await onAddPerson(person);
          setAddPersonOpen(false);
        }}
      />

      {/* Add Relationship Modal (from header) */}
      <RelationshipForm
        opened={addRelationshipOpen}
        onClose={() => setAddRelationshipOpen(false)}
        people={project.people}
        relationships={project.relationships}
        selectedPeople={selectedIds
          .map((id) => project.people.find((p) => p.id === id)!)
          .filter(Boolean)}
        onSubmit={(relationshipData: Omit<Relationship, 'id'>) => {
          onAddRelationship(relationshipData);
          setAddRelationshipOpen(false);
        }}
        onSubmitMultiple={async (relationships: Omit<Relationship, 'id'>[]) => {
          await handleSubmitMultiple(relationships);
          setAddRelationshipOpen(false);
          onClearSelection?.(); // Clear selection after batch operation
        }}
      />
    </Box>
  );
}

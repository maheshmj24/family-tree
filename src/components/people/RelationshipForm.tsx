import {
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import type { Person, Relationship, RelationshipType } from '../../types';
import { isParentChildRelationship } from '../../utils';

type Props = {
  readonly opened: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (relationship: Omit<Relationship, 'id'>) => void;
  readonly onSubmitMultiple?: (
    relationships: Omit<Relationship, 'id'>[]
  ) => void;
  readonly people: Person[];
  readonly relationships: Relationship[];
  readonly fromPerson?: Person | null; // Pre-selected person
  readonly selectedPeople?: Person[]; // For batch operations
};

export default function RelationshipForm({
  opened,
  onClose,
  onSubmit,
  onSubmitMultiple,
  people,
  relationships,
  fromPerson,
  selectedPeople = [],
}: Props) {
  const [fromId, setFromId] = useState(fromPerson?.id || '');
  const [toId, setToId] = useState('');
  const [type, setType] = useState<RelationshipType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [addBothParents, setAddBothParents] = useState(false);
  const [parent1Id, setParent1Id] = useState('');
  const [parent2Id, setParent2Id] = useState('');

  // Update fromId when fromPerson changes
  useEffect(() => {
    setFromId(fromPerson?.id || '');
  }, [fromPerson]);

  // Reset form when modal opens
  useEffect(() => {
    if (opened) {
      resetForm();
    }
  }, [opened, fromPerson]);

  // Reset form when modal opens (but not when it closes)
  useEffect(() => {
    if (opened) {
      resetForm();
    }
  }, [opened]); // Removed fromPerson from dependencies

  const handleSubmit = () => {
    if (!type) {
      alert('Please select a relationship type');
      return;
    }

    // Handle batch mode - create relationships for all selected people
    if (isBatchMode && selectedPeople.length > 0) {
      // Check if we're using "both parents" mode
      if (addBothParents && isParentChildRelationship(type)) {
        if (!parent1Id || !parent2Id) {
          alert('Please select both parents');
          return;
        }
      } else if (!toId) {
        const availableCount = people.filter(
          (p) => !selectedPeople.some((s) => s.id === p.id)
        ).length;
        alert(
          `Please select someone from the "Related To" dropdown field.\n\nYou have ${selectedPeople.length} people selected and ${availableCount} people available to choose from.`
        );
        return;
      }

      const relationships: Omit<Relationship, 'id'>[] = [];

      if (addBothParents && isParentChildRelationship(type)) {
        // Handle "both parents" mode for all selected people
        selectedPeople.forEach((person) => {
          // Skip if any parent is the same as the selected person
          if (person.id === parent1Id || person.id === parent2Id) {
            return;
          }

          // Create relationship with parent 1
          relationships.push({
            fromId: parent1Id, // Parent is "from"
            toId: person.id, // Child is "to"
            type,
            startDate: startDate || undefined,
            notes: notes || undefined,
            isActive,
          });

          // Create relationship with parent 2
          relationships.push({
            fromId: parent2Id, // Parent is "from"
            toId: person.id, // Child is "to"
            type,
            startDate: startDate || undefined,
            notes: notes || undefined,
            isActive,
          });
        });
      } else {
        // Handle normal batch mode
        selectedPeople.forEach((person) => {
          if (person.id === toId) {
            return; // Skip creating relationship to self
          }

          let finalFromId = person.id;
          let finalToId = toId;

          // Handle parent-child relationship direction
          if (isParentChildRelationship(type)) {
            finalFromId = toId; // The "to" person becomes the parent (from)
            finalToId = person.id; // The selected person becomes the child (to)
          }

          relationships.push({
            fromId: finalFromId,
            toId: finalToId,
            type,
            startDate: startDate || undefined,
            notes: notes || undefined,
            isActive,
          });
        });
      }

      if (relationships.length > 0) {
        if (onSubmitMultiple) {
          onSubmitMultiple(relationships);
        } else {
          relationships.forEach((rel) => onSubmit(rel));
        }
      }

      resetForm();
      return;
    }

    // Handle both parents scenario
    if (addBothParents && isParentChildRelationship(type)) {
      if (!fromId || !parent1Id || !parent2Id) {
        alert('Please fill in all required fields for both parents');
        return;
      }

      if (
        fromId === parent1Id ||
        fromId === parent2Id ||
        parent1Id === parent2Id
      ) {
        alert('Cannot create relationships with the same person');
        return;
      }

      const relationships: Omit<Relationship, 'id'>[] = [
        {
          fromId: parent1Id, // Parent is "from"
          toId: fromId, // Child is "to"
          type,
          startDate: startDate || undefined,
          notes: notes || undefined,
          isActive,
        },
        {
          fromId: parent2Id, // Parent is "from"
          toId: fromId, // Child is "to"
          type,
          startDate: startDate || undefined,
          notes: notes || undefined,
          isActive,
        },
      ];

      if (onSubmitMultiple) {
        onSubmitMultiple(relationships);
      } else {
        // Fallback: submit each relationship individually
        relationships.forEach((rel) => onSubmit(rel));
      }

      resetForm();
      return;
    }

    // Handle single relationship scenario
    if (!fromId || !toId) {
      alert('Please fill in all required fields');
      return;
    }

    if (fromId === toId) {
      alert('Cannot create relationship to the same person');
      return;
    }

    // For parent relationships, ensure correct direction:
    // Parent should be "from" and child should be "to"
    let finalFromId = fromId;
    let finalToId = toId;

    if (isParentChildRelationship(type)) {
      // If we're saying "Person A is Person B's parent", then:
      // Person B (toId) should be the parent, Person A (fromId) should be the child
      // So we need to flip the relationship
      finalFromId = toId; // The "to" person becomes the parent (from)
      finalToId = fromId; // The "from" person becomes the child (to)
    }

    const relationship: Omit<Relationship, 'id'> = {
      fromId: finalFromId,
      toId: finalToId,
      type,
      startDate: startDate || undefined,
      notes: notes || undefined,
      isActive,
    };

    onSubmit(relationship);
    resetForm();
  };

  const resetForm = () => {
    setFromId(fromPerson?.id || '');
    setToId('');
    setType('');
    setStartDate('');
    setNotes('');
    setIsActive(true);
    setAddBothParents(false);
    setParent1Id('');
    setParent2Id('');
  };

  const relationshipOptions = [
    { value: 'parent', label: 'Parent' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'partner', label: 'Partner (unmarried)' },
    { value: 'adoptive-parent', label: 'Adoptive parent' },
    { value: 'step-parent', label: 'Step-parent' },
    { value: 'other', label: 'Other' },
  ];

  const isBatchMode = selectedPeople.length > 0;

  // Helper function to get parent information for a person
  const getParentInfo = (person: Person): string => {
    // Find direct parent relationships where this person is the child (toId)
    const parentRelationships = relationships.filter(
      (rel) =>
        rel.toId === person.id &&
        (rel.type === 'parent' ||
          rel.type === 'adoptive-parent' ||
          rel.type === 'step-parent')
    );

    if (parentRelationships.length > 0) {
      const parentNames = parentRelationships
        .map((rel) => {
          const parent = people.find((p) => p.id === rel.fromId);
          return parent?.displayName || 'Unknown';
        })
        .filter(Boolean);

      if (parentNames.length > 0) {
        return `Child of ${parentNames.join(' & ')}`;
      }
    }

    // Fallback to birth year if available
    if (person.birthDate) {
      const birthYear = new Date(person.birthDate).getFullYear();
      return `Born ${birthYear}`;
    }

    return '';
  };

  const peopleOptions = people
    .filter((p) => {
      if (isBatchMode) {
        // In batch mode, exclude all selected people
        return !selectedPeople.some((selected) => selected.id === p.id);
      } else {
        // In normal mode, exclude the fromId person
        return p.id !== fromId;
      }
    })
    .map((p) => ({
      value: p.id,
      label: p.displayName,
      description: getParentInfo(p),
    }))
    .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically

  // Custom render option function for dropdown items
  const renderSelectOption = ({ option }: { option: any }) => (
    <div>
      <Text size='sm'>{option.label}</Text>
      {option.description && (
        <Text size='xs' c='dimmed'>
          {option.description}
        </Text>
      )}
    </div>
  );

  const fromPersonOptions = people
    .map((p) => ({
      value: p.id,
      label: p.displayName,
      description: getParentInfo(p),
    }))
    .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically

  const modalTitle = isBatchMode
    ? `Add Relationships to ${selectedPeople.length} People`
    : 'Add Relationship';

  const description = isBatchMode
    ? `Add the same relationship to all ${selectedPeople.length} selected people.`
    : 'Define how two people are related in your family tree.';

  return (
    <Modal opened={opened} onClose={onClose} title={modalTitle} size='md'>
      <Stack gap='md'>
        <Text size='sm' c='dimmed'>
          {description}
        </Text>

        {isBatchMode && (
          <Group gap='xs' wrap='wrap'>
            <Text size='sm' fw={500}>
              Selected people:
            </Text>
            {selectedPeople.map((person) => (
              <Badge key={person.id} variant='light' size='sm'>
                {person.displayName}
              </Badge>
            ))}
          </Group>
        )}

        {!isBatchMode && (
          <Select
            label='From Person'
            placeholder='Select person'
            data={fromPersonOptions}
            value={fromId}
            onChange={(value) => setFromId(value || '')}
            searchable
            disabled={!!fromPerson} // Disable if pre-selected
            required
            renderOption={renderSelectOption}
          />
        )}

        <Select
          label='Type (of from person)'
          placeholder='Select relationship'
          data={relationshipOptions}
          value={type}
          onChange={(value) => setType(value as RelationshipType)}
          required
        />

        {/* Show "both parents" option for parent relationships */}
        {type && isParentChildRelationship(type) && (
          <Checkbox
            label='Add both parents at once'
            description='Create relationships with both parents in one step'
            checked={addBothParents}
            onChange={(e) => setAddBothParents(e.currentTarget.checked)}
          />
        )}

        {/* Show different fields based on whether adding both parents */}
        {addBothParents && type && isParentChildRelationship(type) ? (
          <>
            <Select
              label='Parent 1'
              placeholder='Select first parent'
              data={peopleOptions}
              value={parent1Id}
              onChange={(value) => setParent1Id(value || '')}
              searchable
              required
              renderOption={renderSelectOption}
            />

            <Select
              label='Parent 2'
              placeholder='Select second parent'
              data={peopleOptions
                .filter((p) => p.value !== parent1Id) // Don't show the same person
                .sort((a, b) => a.label.localeCompare(b.label))} // Keep alphabetical order
              value={parent2Id}
              onChange={(value) => setParent2Id(value || '')}
              searchable
              required
              renderOption={renderSelectOption}
            />
          </>
        ) : (
          <Select
            label={
              isBatchMode
                ? 'Related To (same for all selected people)'
                : 'To Person'
            }
            placeholder={
              isBatchMode
                ? 'Select person to relate to all selected people'
                : 'Select related person'
            }
            data={peopleOptions}
            value={toId}
            onChange={(value) => setToId(value || '')}
            searchable
            required
            renderOption={renderSelectOption}
          />
        )}

        <TextInput
          label='Start Date (optional)'
          placeholder='YYYY-MM-DD'
          value={startDate}
          onChange={(e) => setStartDate(e.currentTarget.value)}
          description='When this relationship began (marriage, birth, etc.)'
        />

        <TextInput
          label='Notes (optional)'
          placeholder='Additional details about this relationship'
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
        />

        <Checkbox
          label='This relationship is currently active'
          checked={isActive}
          onChange={(e) => setIsActive(e.currentTarget.checked)}
        />

        <Group justify='flex-end' gap='sm'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {addBothParents && type && isParentChildRelationship(type)
              ? 'Add Both Parents'
              : 'Add Relationship'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Checkbox,
  Group,
  Table,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconEdit,
  IconEye,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import { usePhoto } from '../../hooks/usePhoto';
import type { Person } from '../../types/models';
import { formatGenderDisplay } from '../../utils';

interface PersonTableRowProps {
  readonly person: Person;
  readonly age: number | undefined;
  readonly relationshipStatus: {
    hasRelationships: boolean;
    explicit: number;
    total: number;
  };
  readonly isSelected: boolean;
  readonly onSelect: (personId: string) => void;
  readonly onView: (personId: string) => void;
  readonly onEdit: (personId: string) => void;
  readonly onDelete: (personId: string) => void;
  readonly onFocus?: (personId: string) => void;
  readonly isMultiSelected?: boolean;
  readonly onToggleMultiSelect?: (personId: string) => void;
}

export default function PersonTableRow({
  person,
  age,
  relationshipStatus,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onFocus,
  isMultiSelected = false,
  onToggleMultiSelect,
}: PersonTableRowProps) {
  const { photoUrl, isLoading, error } = usePhoto(person.avatar);
  return (
    <Table.Tr
      key={person.id}
      style={{
        backgroundColor: isSelected
          ? 'var(--mantine-color-yellow-0)'
          : undefined,
        cursor: 'pointer',
      }}
      onClick={() => onSelect(person.id)}
    >
      {/* Multi-select checkbox */}
      <Table.Td onClick={(e) => e.stopPropagation()}>
        {onToggleMultiSelect && (
          <Checkbox
            checked={isMultiSelected}
            onChange={() => onToggleMultiSelect(person.id)}
            size='sm'
          />
        )}
      </Table.Td>

      <Table.Td>
        <Group gap='sm' align='center'>
          <Avatar
            src={photoUrl}
            alt={person.displayName}
            size={36}
            radius='xl'
            style={{
              border: person.avatar
                ? '2px solid var(--mantine-color-green-4)'
                : '2px solid var(--mantine-color-gray-3)',
              backgroundColor: isLoading ? '#ffeb3b' : undefined, // Yellow background when loading
            }}
          >
            {person.displayName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Text fw={500}>{person.displayName}</Text>
            {person.fullName && person.fullName !== person.displayName && (
              <Text size='sm' c='dimmed'>
                {person.fullName}
              </Text>
            )}
            {person.nickname && (
              <Text size='xs' c='dimmed'>
                "{person.nickname}"
              </Text>
            )}
          </Box>
        </Group>
      </Table.Td>
      <Table.Td>
        {age ? <Text>{age}</Text> : <Text c='dimmed'>Unknown</Text>}
      </Table.Td>
      <Table.Td>
        <Text c={person.gender ? undefined : 'dimmed'}>
          {formatGenderDisplay(person.gender)}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap='xs'>
          {relationshipStatus.hasRelationships ? (
            <Badge color='green' variant='light' size='sm'>
              {relationshipStatus.explicit > 0
                ? `${relationshipStatus.explicit} defined`
                : 'Relationships found'}
            </Badge>
          ) : (
            <Group gap='xs'>
              <Badge color='red' variant='light' size='sm'>
                No relationships
              </Badge>
              <Tooltip label='This person has no relationships defined or derived'>
                <IconAlertTriangle size={16} color='orange' />
              </Tooltip>
            </Group>
          )}
          {relationshipStatus.total > relationshipStatus.explicit && (
            <Badge color='blue' variant='outline' size='sm'>
              +{relationshipStatus.total - relationshipStatus.explicit} derived
            </Badge>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap='xs'>
          <Tooltip label='View Details'>
            <ActionIcon
              variant='subtle'
              color='blue'
              onClick={(e) => {
                e.stopPropagation();
                onView(person.id);
              }}
            >
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label='Edit Person'>
            <ActionIcon
              variant='subtle'
              color='yellow'
              onClick={(e) => {
                e.stopPropagation();
                onEdit(person.id);
              }}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label='Delete Person'>
            <ActionIcon
              variant='subtle'
              color='red'
              onClick={(e) => {
                e.stopPropagation();
                onDelete(person.id);
              }}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
          {onFocus && (
            <Tooltip label='Focus in Family Tree'>
              <ActionIcon
                variant='subtle'
                color='green'
                onClick={(e) => {
                  e.stopPropagation();
                  onFocus(person.id);
                }}
              >
                <IconUsers size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}

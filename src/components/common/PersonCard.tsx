import { Avatar, Box, Card, Stack, Text } from '@mantine/core';
import { usePhoto } from '../../hooks/usePhoto';
import type { Person } from '../../types/models';
import { calculateAge, calculateAgeAtDeath } from '../../utils';

type Props = {
  readonly person: Person;
  readonly onSelect?: (id: string) => void;
  readonly isSelected?: boolean;
  readonly size?: 'small' | 'medium' | 'large';
};

export default function PersonCard({
  person,
  onSelect,
  isSelected = false,
  size = 'medium',
}: Props) {
  const { photoUrl, isLoading, error } = usePhoto(person.avatar);

  // Size configurations
  const sizeConfig = {
    small: {
      width: 140,
      minHeight: 120,
      avatarSize: 80,
      textSize: 'xs' as const,
    },
    medium: {
      width: 180,
      minHeight: 160,
      avatarSize: 110,
      textSize: 'sm' as const,
    },
    large: {
      width: 220,
      minHeight: 200,
      avatarSize: 140,
      textSize: 'md' as const,
    },
  };

  const config = sizeConfig[size];

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const isDeceased = !person.alive || !!person.deathDate;

  // Calculate age appropriately for living vs deceased people
  const age =
    isDeceased && person.deathDate
      ? calculateAgeAtDeath(person.birthDate, person.deathDate)
      : calculateAge(person.birthDate);

  // Determine background color
  let backgroundColor;
  if (isDeceased) {
    backgroundColor = 'var(--mantine-color-gray-0)';
  }
  // Note: Removed yellow background for selected state, keeping only the gold border

  return (
    <Card
      padding='sm'
      withBorder
      radius='md'
      shadow='sm'
      style={{
        cursor: onSelect ? 'pointer' : 'default',
        borderColor: isSelected ? '#ffd43b' : undefined, // Gold border when selected
        borderWidth: isSelected ? 3 : 1,
        backgroundColor,
        width: `${config.width}px`,
        minHeight: `${config.minHeight}px`,
        height: '100%',
        transition: 'all 0.2s ease',
        opacity: isDeceased ? 0.85 : 1,
        boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.15)' : undefined,
      }}
      onClick={() => onSelect?.(person.id)}
    >
      <Stack gap='xs' align='center' h='100%'>
        {/* Avatar Section - More space for image */}
        <Box
          style={{
            flex: '3 1 60%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Avatar
            src={photoUrl}
            alt={person.displayName}
            size={config.avatarSize}
            radius={config.avatarSize / 2}
            style={{
              border: isDeceased
                ? '3px solid var(--mantine-color-gray-4)'
                : '3px solid var(--mantine-color-green-5)',
            }}
          >
            {person.displayName.charAt(0).toUpperCase()}
          </Avatar>
        </Box>

        {/* Text Section - Compact */}
        <Box
          ta='center'
          w='100%'
          style={{
            flex: '2 1 40%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
          }}
        >
          <Text
            fw={600}
            size={config.textSize}
            lineClamp={1}
            c={isDeceased ? 'gray.7' : 'dark.8'}
            title={person.displayName}
            style={{ marginBottom: '2px' }}
          >
            {person.displayName}
            {age !== null && age !== undefined && (
              <Text span size='xs' c='dimmed' ml={4}>
                ({age})
              </Text>
            )}
          </Text>

          {/* Nickname - Always reserve space */}
          <Text
            size='xs'
            c={isDeceased ? 'gray.5' : 'dimmed'}
            lineClamp={1}
            style={{ minHeight: '14px', marginBottom: '1px' }}
          >
            {person.nickname ? `"${person.nickname}"` : ''}
          </Text>

          {/* Compact Birth/Death Info - Always reserve space */}
          <Text
            size='xs'
            c={isDeceased ? 'gray.5' : 'dimmed'}
            style={{ minHeight: '12px', lineHeight: 1.2 }}
          >
            {person.birthDate ? `Born:  ${formatDate(person.birthDate)}` : ''}
          </Text>

          <Text
            size='xs'
            c='gray.5'
            style={{ minHeight: '12px', lineHeight: 1.2 }}
          >
            {person.deathDate ? `Died: ${formatDate(person.deathDate)}` : ''}
          </Text>
        </Box>
      </Stack>
    </Card>
  );
}

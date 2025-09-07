import { Group, Menu, TextInput } from '@mantine/core';
import { IconSearch, IconUser } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import type { Person } from '../../types';

type Props = {
  readonly people: Person[];
  readonly onSelect?: (id: string) => void;
};

export default function SearchBar({ people, onSelect }: Props) {
  const [query, setQuery] = useState<string>('');
  const [opened, setOpened] = useState<boolean>(false);

  const filteredPeople = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    return people
      .filter(
        (person) =>
          person.displayName.toLowerCase().includes(searchTerm) ||
          person.fullName?.toLowerCase().includes(searchTerm) ||
          person.nickname?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 10); // Limit to 10 results
  }, [people, query]);

  const handleSelect = (personId: string) => {
    onSelect?.(personId);
    setQuery('');
    setOpened(false);
  };

  return (
    <Menu
      opened={opened && filteredPeople.length > 0}
      onChange={setOpened}
      width='target'
      position='bottom-start'
    >
      <Menu.Target>
        <Group gap='xs'>
          <TextInput
            placeholder='Search people...'
            value={query}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setOpened(e.currentTarget.value.trim().length > 0);
            }}
            size='md'
            style={{ flex: 1 }}
            leftSection={<IconSearch size={16} />}
          />
        </Group>
      </Menu.Target>

      <Menu.Dropdown>
        {filteredPeople.map((person) => (
          <Menu.Item
            key={person.id}
            leftSection={<IconUser size={16} />}
            onClick={() => handleSelect(person.id)}
          >
            {person.displayName}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

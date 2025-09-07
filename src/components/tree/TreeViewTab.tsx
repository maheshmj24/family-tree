import { Stack, Text } from '@mantine/core';
import type { ProjectData } from '../../types';
import HierarchicalTreeView from './HierarchicalTreeView';

type Props = {
  readonly project: ProjectData;
  readonly selectedPersonId?: string;
  readonly onSelectPerson: (personId: string) => void;
};

export default function FocusViewTab({
  project,
  selectedPersonId,
  onSelectPerson,
}: Props) {
  if (!selectedPersonId) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          boxSizing: 'border-box',
        }}
      >
        <Stack gap='xl' align='center' maw={500}>
          <Text size='xl' fw={600} c='gray.7' ta='center'>
            🌳 Tree View
          </Text>
          <Text size='lg' c='gray.6' ta='center' lh={1.6}>
            Select a person from the People tab or Network view to explore their
            family tree in detail
          </Text>
          <Text size='sm' c='gray.5' ta='center' fs='italic'>
            The tree view will show three generations centered around your
            selected person
          </Text>
        </Stack>
      </div>
    );
  }

  return (
    <HierarchicalTreeView
      focusPersonId={selectedPersonId}
      project={project}
      onSelectPerson={onSelectPerson}
    />
  );
}

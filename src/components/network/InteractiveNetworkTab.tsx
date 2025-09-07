import type { ProjectData } from '../../types/models';
import NetworkCanvas from './NetworkCanvas';

type Props = {
  readonly project: ProjectData;
  readonly selectedPersonId?: string;
  readonly onSelectPerson: (personId: string) => void;
};

export default function InteractiveGraphTab({
  project,
  selectedPersonId,
  onSelectPerson,
}: Props) {
  return (
    <NetworkCanvas
      project={project}
      selectedId={selectedPersonId}
      onSelect={onSelectPerson}
    />
  );
}

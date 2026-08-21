import { Row, Surface } from '@/components';
import type { TechnicianSkill } from '@/services/api/technicians.models';

export function TechnicianSkillCard({ skill }: { skill: TechnicianSkill }) {
  return (
    <Surface>
      <Row icon="build-outline" title={skill.name} />
    </Surface>
  );
}

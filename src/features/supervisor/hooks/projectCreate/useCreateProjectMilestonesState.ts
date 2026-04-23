import { useRef, useState } from 'react';
import { INITIAL_MILESTONE, isMilestoneComplete } from '../../createProject.shared';
import type { MilestoneDraft } from '../../createProject.shared';
import { earliestMilestone } from '../../createProject.shared';
import { validateCreateMilestonesPolicy } from '../../milestonePolicy';
import type { CreateSupervisorProjectResponse } from '../../types';

type UseCreateProjectMilestonesStateParams = {
  createdProject: CreateSupervisorProjectResponse | null;
};

export function useCreateProjectMilestonesState({
  createdProject,
}: UseCreateProjectMilestonesStateParams) {
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([{ ...INITIAL_MILESTONE }]);
  const [expandedMilestoneIndex, setExpandedMilestoneIndex] = useState<number | null>(0);
  const milestoneRefs = useRef<(HTMLDivElement | null)[]>([]);

  const milestonePolicyError = milestones.every(isMilestoneComplete)
    ? validateCreateMilestonesPolicy(milestones)
    : null;
  const step3Valid = milestones.every(isMilestoneComplete) && !milestonePolicyError;
  const incompleteMilestoneCount = milestones.filter(
    (milestone) => !isMilestoneComplete(milestone),
  ).length;

  const primaryCreatedMilestone = createdProject
    ? earliestMilestone(createdProject.milestones)
    : null;

  function updateMilestone<F extends keyof MilestoneDraft>(
    index: number,
    field: F,
    value: MilestoneDraft[F],
  ) {
    setMilestones((prev) =>
      prev.map((milestone, milestoneIndex) =>
        milestoneIndex === index ? { ...milestone, [field]: value } : milestone,
      ),
    );
  }

  function addMilestone() {
    setMilestones((prev) => {
      const newIndex = prev.length;
      setExpandedMilestoneIndex(newIndex);
      setTimeout(() => {
        milestoneRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return [...prev, { ...INITIAL_MILESTONE }];
    });
  }

  function removeMilestone(index: number) {
    if (milestones.length === 1) return;
    setMilestones((prev) => prev.filter((_, milestoneIndex) => milestoneIndex !== index));
    setExpandedMilestoneIndex((current) => {
      if (current === null) return null;
      if (current === index) {
        if (index === milestones.length - 1) return Math.max(0, index - 1);
        return index;
      }
      if (current > index) return current - 1;
      return current;
    });
  }

  function toggleMilestone(index: number) {
    setExpandedMilestoneIndex((current) => (current === index ? null : index));
  }

  function reset() {
    setMilestones([{ ...INITIAL_MILESTONE }]);
    setExpandedMilestoneIndex(0);
  }

  return {
    milestones,
    setMilestones,
    expandedMilestoneIndex,
    milestoneRefs,
    milestonePolicyError,
    step3Valid,
    incompleteMilestoneCount,
    primaryCreatedMilestone,
    updateMilestone,
    addMilestone,
    removeMilestone,
    toggleMilestone,
    resetMilestones: reset,
    isMilestoneComplete,
  };
}

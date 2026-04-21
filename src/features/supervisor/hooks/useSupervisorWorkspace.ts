import { tokenStorage } from '@/services/tokenStorage';
import { createSupervisorProjects } from '../data/mockSupervisorWorkspace';
import type { SupervisorDashboardStats } from '../types';
import { parseLocalDateOnly } from '@/lib/dateOnly';

export function useSupervisorWorkspace() {
  const user = tokenStorage.getUser();
  // The supervisor workspace is mock-backed, but the fixture is still personalized to the stored user.
  const projects = createSupervisorProjects(user);
  const comparisonDate = parseLocalDateOnly('2026-03-03');

  const getProjectById = (projectId: string) =>
    projects.find((project) => project.id === projectId) ?? null;

  const stats: SupervisorDashboardStats = {
    total: projects.length,
    active: projects.filter((project) => project.lifecycle === 'ACTIVE').length,
    atRisk: projects.filter((project) => project.lifecycle === 'AT_RISK').length,
    behind: projects.filter((project) => project.lifecycle === 'BEHIND').length,
    // Use a fixed comparison date so the demo dashboard stays deterministic across reloads.
    overdueActions: projects.reduce(
      (count, project) =>
        count +
        project.actionItems.filter((item) => {
          if (item.status === 'Done') {
            return false;
          }

          const dueDate = parseLocalDateOnly(item.dueDate);
          if (!dueDate || !comparisonDate) {
            return false;
          }

          return dueDate < comparisonDate;
        }).length,
      0,
    ),
  };

  return {
    user,
    projects,
    stats,
    getProjectById,
  };
}

import { tokenStorage } from '@/services/tokenStorage';
import { createSupervisorProjects } from '../data/mockSupervisorWorkspace';
import type { SupervisorDashboardStats } from '../types';

export function useSupervisorWorkspace() {
  const user = tokenStorage.getUser();
  const projects = createSupervisorProjects(user);

  const getProjectById = (projectId: string) =>
    projects.find((project) => project.id === projectId) ?? null;

  const stats: SupervisorDashboardStats = {
    total: projects.length,
    active: projects.filter((project) => project.lifecycle === 'ACTIVE').length,
    atRisk: projects.filter((project) => project.lifecycle === 'AT_RISK').length,
    behind: projects.filter((project) => project.lifecycle === 'BEHIND').length,
    overdueActions: projects.reduce(
      (count, project) =>
        count +
        project.actionItems.filter(
          (item) => item.status !== 'Done' && new Date(item.dueDate) < new Date('2026-03-03'),
        ).length,
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

import { tokenStorage } from '@/services/tokenStorage';
import { createStudentProjects } from '../data/mockStudentProjects';

export function useStudentProjects() {
  const user = tokenStorage.getUser();
  const projects = createStudentProjects(user);

  const getProjectById = (projectId: string) =>
    projects.find((project) => project.id === projectId) ?? null;

  return {
    user,
    projects,
    getProjectById,
  };
}

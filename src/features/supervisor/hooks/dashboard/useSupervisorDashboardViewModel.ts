import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { SupervisorDashboard } from '../../types';
import { PAGE_SIZE } from '../../utils/dashboard/constants';
import {
  computeAttentionProjects,
  computeUpcomingProjects,
  type AttentionItem,
  type UpcomingMilestoneItem,
} from '../../utils/dashboard/scoring';

type SupervisorDashboardViewModel = {
  query: string;
  setQuery: (value: string) => void;
  currentPage: number;
  setCurrentPage: (value: number | ((page: number) => number)) => void;
  normalizedQuery: string;
  projects: SupervisorDashboard['projects'];
  visibleProjects: SupervisorDashboard['projects'];
  totalPages: number;
  safeCurrentPage: number;
  pagedProjects: SupervisorDashboard['projects'];
  pageSize: number;
  attentionProjects: AttentionItem[];
  upcomingProjects: UpcomingMilestoneItem[];
};

export function useSupervisorDashboardViewModel(dashboard: SupervisorDashboard | null) {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const pageSize = PAGE_SIZE;

  const projects = useMemo(() => dashboard?.projects ?? [], [dashboard?.projects]);

  const visibleProjects = useMemo(() => {
    return projects.filter((project) =>
      normalizedQuery.length === 0
        ? true
        : `${project.title} ${project.summary ?? ''}`.toLowerCase().includes(normalizedQuery),
    );
  }, [projects, normalizedQuery]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(visibleProjects.length / pageSize));
  }, [visibleProjects.length, pageSize]);

  const safeCurrentPage = useMemo(() => {
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const pagedProjects = useMemo(() => {
    return visibleProjects.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  }, [pageSize, safeCurrentPage, visibleProjects]);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedQuery]);

  const now = useMemo(() => new Date(), []);
  const attentionProjects = useMemo(() => computeAttentionProjects(projects, now), [now, projects]);
  const upcomingProjects = useMemo(() => computeUpcomingProjects(projects, now), [now, projects]);

  const viewModel: SupervisorDashboardViewModel = {
    query,
    setQuery,
    currentPage,
    setCurrentPage,
    normalizedQuery,
    projects,
    visibleProjects,
    totalPages,
    safeCurrentPage,
    pagedProjects,
    pageSize,
    attentionProjects,
    upcomingProjects,
  };

  return viewModel;
}

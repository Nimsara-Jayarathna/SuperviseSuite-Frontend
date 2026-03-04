import { SupervisorLayout } from '@/app/layout/SupervisorLayout';
import { StudentLayout } from '@/app/layout/StudentLayout';
import { LoginPage, RegisterPage } from '@/features/auth';
import { LandingPage } from '@/features/landing';
import { StudentProjectDetailsPage, StudentProjectsPage } from '@/features/student';
import {
  CreateProjectPage,
  ProjectDetailsPage,
  SupervisorDashboardPage,
  SupervisorProjectsPage,
} from '@/features/supervisor';
import { tokenStorage } from '@/services/tokenStorage';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { RequireGuest, RequireRole } from './route-guards';

function LegacyDashboardRedirect() {
  const user = tokenStorage.getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'SUPERVISOR' ? '/supervisor' : '/student/projects'} replace />;
}

function LegacyProjectListRedirect() {
  const user = tokenStorage.getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={user.role === 'SUPERVISOR' ? '/supervisor/projects' : '/student/projects'}
      replace
    />
  );
}

function LegacyProjectCreateRedirect() {
  const user = tokenStorage.getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={user.role === 'SUPERVISOR' ? '/supervisor/projects/new' : '/student/projects'}
      replace
    />
  );
}

function LegacyProjectDetailsRedirect() {
  const { projectId } = useParams();
  const user = tokenStorage.getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const target =
    user.role === 'SUPERVISOR'
      ? `/supervisor/projects/${projectId}`
      : `/student/projects/${projectId}`;

  return <Navigate to={target} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Guest-only — redirect authenticated users to their dashboard */}
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Student-only */}
      <Route element={<RequireRole role="STUDENT" />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="projects" replace />} />
          <Route path="projects" element={<StudentProjectsPage />} />
          <Route path="projects/:projectId" element={<StudentProjectDetailsPage />} />
        </Route>
      </Route>

      {/* Supervisor-only */}
      <Route element={<RequireRole role="SUPERVISOR" />}>
        <Route path="/supervisor" element={<SupervisorLayout />}>
          <Route index element={<SupervisorDashboardPage />} />
          <Route path="dashboard" element={<SupervisorDashboardPage />} />
          <Route path="project" element={<Navigate to="/supervisor/projects" replace />} />
          <Route path="project/new" element={<Navigate to="/supervisor/projects/new" replace />} />
          <Route path="project/:projectId" element={<ProjectDetailsPage />} />
          <Route path="projects" element={<SupervisorProjectsPage />} />
          <Route path="projects/new" element={<CreateProjectPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
        </Route>
      </Route>

      {/* Role-aware legacy aliases */}
      <Route path="/dashboard" element={<LegacyDashboardRedirect />} />
      <Route path="/project" element={<LegacyProjectListRedirect />} />
      <Route path="/project/new" element={<LegacyProjectCreateRedirect />} />
      <Route path="/project/:projectId" element={<LegacyProjectDetailsRedirect />} />
      <Route path="/projects" element={<LegacyProjectListRedirect />} />
      <Route path="/projects/new" element={<LegacyProjectCreateRedirect />} />
      <Route path="/projects/:projectId" element={<LegacyProjectDetailsRedirect />} />
    </Routes>
  );
}

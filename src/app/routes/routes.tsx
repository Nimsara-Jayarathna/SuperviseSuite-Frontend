import { StudentLayout } from '@/app/layout/StudentLayout';
import { LoginPage, RegisterPage } from '@/features/auth';
import { SupervisorDashboardPage } from '@/features/dashboard';
import { LandingPage } from '@/features/landing';
import { StudentProjectDetailsPage, StudentProjectsPage } from '@/features/student';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { RequireRole } from './route-guards';

function StudentProjectRedirect() {
  const { projectId } = useParams();
  const target = projectId ? `/student/projects/${projectId}` : '/student/projects';

  return <Navigate to={target} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* /login and /register are always accessible */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Student-only */}
      <Route element={<RequireRole role="STUDENT" />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="projects" replace />} />
          <Route path="projects" element={<StudentProjectsPage />} />
          <Route path="projects/:projectId" element={<StudentProjectDetailsPage />} />
        </Route>
        <Route path="/project" element={<StudentProjectRedirect />} />
        <Route path="/project/:projectId" element={<StudentProjectRedirect />} />
        <Route path="/projects" element={<StudentProjectRedirect />} />
        <Route path="/projects/:projectId" element={<StudentProjectRedirect />} />
      </Route>

      {/* Supervisor-only */}
      <Route element={<RequireRole role="SUPERVISOR" />}>
        <Route path="/supervisor/dashboard" element={<SupervisorDashboardPage />} />
      </Route>
    </Routes>
  );
}

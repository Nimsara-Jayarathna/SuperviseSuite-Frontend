import { LoginPage, RegisterPage } from '@/features/auth';
import { LandingPage } from '@/features/landing';
import { Route, Routes } from 'react-router-dom';
import { RequireGuest, RequireRole } from './route-guards';

// ---------------------------------------------------------------------------
// Placeholder pages — replace with real feature pages as they are built
// ---------------------------------------------------------------------------
function StudentProjectsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg text-gray-600">Student Projects (coming soon)</p>
    </div>
  );
}

function SupervisorDashboardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg text-gray-600">Supervisor Dashboard (coming soon)</p>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Guest-only — redirect authenticated users to their home */}
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Student-only */}
      <Route element={<RequireRole role="STUDENT" />}>
        <Route path="/student/projects" element={<StudentProjectsPage />} />
      </Route>

      {/* Supervisor-only */}
      <Route element={<RequireRole role="SUPERVISOR" />}>
        <Route path="/supervisor/dashboard" element={<SupervisorDashboardPage />} />
      </Route>
    </Routes>
  );
}

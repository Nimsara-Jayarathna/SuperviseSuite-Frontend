import { SupervisorLayout } from '@/app/layout/SupervisorLayout';
import { StudentLayout } from '@/app/layout/StudentLayout';
import { LandingPage } from '@/features/landing';
import { PrivacyPolicyPage, SupportPage, TermsOfServicePage } from '@/features/legal';
import { StudentProjectDetailsPage, StudentProjectsPage } from '@/features/student';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import {
  CreateProjectPage,
  GitHubAccessUpdatedPage,
  JiraOAuthCallbackPage,
  ProjectDetailsPage,
  RequestGitHubRepositoryAccessPage,
  SupervisorDashboardPage,
  SupervisorProjectsPage,
} from '@/features/supervisor';
import { tokenStorage } from '@/services/tokenStorage';
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { RequireGuest, RequireRole } from './route-guards';
import { ROLE_HOME } from './roleHome';
import { useAuthStateValue } from '@/features/auth/state/authState';

function useResolvedUser() {
  const authState = useAuthStateValue();
  if (authState.status === 'bootstrapping') {
    return tokenStorage.getUser();
  }
  return authState.user;
}

function RootRoute() {
  const user = useResolvedUser();

  if (!user) {
    return <LandingPage />;
  }

  return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;
}

function LoginRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnToKey = searchParams.get('returnToKey');
  const returnToFromQuery = searchParams.get('returnTo');
  const RETURN_TO_KEY_PREFIX = 'login-return:';
  let returnTo: string | undefined;

  if (returnToKey?.startsWith(RETURN_TO_KEY_PREFIX)) {
    try {
      returnTo = sessionStorage.getItem(returnToKey) ?? undefined;
      sessionStorage.removeItem(returnToKey);
    } catch {
      returnTo = undefined;
    }
  } else {
    returnTo = returnToFromQuery ?? undefined;
  }

  return (
    <LandingPage
      initialLoginOpen={true}
      initialLoginReturnTo={returnTo}
      onLoginClose={() => navigate('/')}
    />
  );
}

function RegisterRoute() {
  const navigate = useNavigate();

  return <LandingPage initialRegistrationOpen={true} onRegistrationClose={() => navigate('/')} />;
}

function LegacyDashboardRedirect() {
  const user = useResolvedUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'SUPERVISOR' ? '/supervisor' : '/student/projects'} replace />;
}

function LegacyProjectListRedirect() {
  const user = useResolvedUser();

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
  const user = useResolvedUser();

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
  const user = useResolvedUser();

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
      <Route path="/" element={<RootRoute />} />
      <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/legal/terms" element={<TermsOfServicePage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/github/request-access" element={<RequestGitHubRepositoryAccessPage />} />
      <Route path="/github/access-updated" element={<GitHubAccessUpdatedPage />} />

      {/* Guest-only — redirect authenticated users to their dashboard */}
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/register" element={<RegisterRoute />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
          <Route path="jira/callback" element={<JiraOAuthCallbackPage />} />
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

      {/* Catch-all — authenticated users go to their role home, others to /login */}
      <Route path="*" element={<LegacyDashboardRedirect />} />
    </Routes>
  );
}

import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginPanel } from '../components/LoginPanel';

/**
 * Composition root for the login flow.
 *
 * Open/Closed Principle: LoginPage wires the useAuth hook into
 * LoginForm via props. LoginForm can be extended or tested without
 * modifying this page, and this page does not know about form internals.
 *
 * Dependency Inversion: LoginForm receives abstractions (callbacks + state),
 * not a concrete hook — the hook lives here, at the boundary layer.
 */
export function LoginPage() {
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-12">
      <LoginPanel inModal={false} returnTo={returnTo} onClose={() => navigate('/')} />
    </div>
  );
}

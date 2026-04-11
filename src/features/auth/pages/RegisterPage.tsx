import { useNavigate } from 'react-router-dom';
import { RegistrationPanel } from '../components/registration/RegistrationPanel';

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-12">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <RegistrationPanel onClose={() => navigate('/')} />
    </div>
  );
}

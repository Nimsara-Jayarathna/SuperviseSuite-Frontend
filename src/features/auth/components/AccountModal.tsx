import { Button } from '@/components/ui/Button';
import { getRoleLabel, type UserRole } from '@/types/roles';
import { X } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';

type AccountModalProps = {
  isOpen: boolean;
  name: string;
  email: string;
  role: UserRole;
  onClose: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  isLogoutPending?: boolean;
};

export function AccountModal({
  isOpen,
  name,
  email,
  role,
  onClose,
  onChangePassword,
  onLogout,
  isLogoutPending = false,
}: AccountModalProps) {
  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const initial = name.trim().charAt(0).toUpperCase() || 'U';

  return (
    <ModalShell
      isOpen={isOpen}
      containerClassName="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
      backdropClassName="absolute inset-0"
      onBackdropClick={onClose}
      closeOnEscape={false}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close account modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
            {initial}
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Account</h2>
            <p className="text-sm text-slate-500">Manage profile and security</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm">
          <div className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2">
            <span className="font-semibold text-slate-500">Name</span>
            <span className="font-medium text-slate-800">{name}</span>
            <span className="font-semibold text-slate-500">Email</span>
            <span className="font-medium text-slate-800">{email}</span>
            <span className="font-semibold text-slate-500">Role</span>
            <span className="font-medium text-slate-800">{getRoleLabel(role)}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            onClick={onChangePassword}
          >
            Change Password
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            className="w-full"
            onClick={onLogout}
            disabled={isLogoutPending}
          >
            {isLogoutPending ? 'Logging out…' : 'Log out'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

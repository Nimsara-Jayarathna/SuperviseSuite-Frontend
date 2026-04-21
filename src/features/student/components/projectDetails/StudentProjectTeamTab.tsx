import { Crown, ShieldCheck } from 'lucide-react';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { StudentProjectDetailMember } from '../../types';
import { memberDisplayName } from '../../utils/projectDetails/presentation';

type StudentProjectTeamTabProps = {
  members: StudentProjectDetailMember[];
  leaderId: string | null;
};

export function StudentProjectTeamTab({ members, leaderId }: StudentProjectTeamTabProps) {
  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col">
        <h2 className="text-lg font-bold tracking-tight text-slate-800">Project Team</h2>
        <p className="text-xs font-medium text-slate-400">
          Total {members.length} members assigned
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div
            key={member.id}
            className={`group relative overflow-hidden rounded-3xl border p-5 transition-all hover:shadow-lg ${
              member.memberRole === 'SUPERVISOR'
                ? 'border-indigo-100 bg-indigo-50/20'
                : 'border-slate-100 bg-white'
            }`}
          >
            {/* Background pattern */}
            <div
              className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 transition-transform group-hover:scale-150 ${
                member.memberRole === 'SUPERVISOR' ? 'bg-indigo-600' : 'bg-slate-400'
              }`}
            />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black shadow-inner ${
                    member.memberRole === 'SUPERVISOR'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-50 text-slate-500'
                  }`}
                >
                  {memberDisplayName(member).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-black tracking-tight text-slate-800">
                    {memberDisplayName(member)}
                  </p>
                  <p className="truncate text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                    {member.email}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <RoleBadge role={member.memberRole} />

                {leaderId === member.id && (
                  <div className="flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                    <StatusBadge
                      tone="warning"
                      className="border-none bg-amber-100 text-[10px] font-black uppercase tracking-wider text-amber-700"
                    >
                      Leader
                    </StatusBadge>
                  </div>
                )}

                {member.registrationNumber && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-dotted border-slate-200 bg-slate-50/50 px-2.5 py-1 text-[10px] font-black tracking-tight text-slate-500">
                    <ShieldCheck className="h-3 w-3" />
                    {member.registrationNumber}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

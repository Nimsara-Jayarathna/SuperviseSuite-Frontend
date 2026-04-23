import {
  UserPlus,
  ShieldCheck,
  Crown,
  Search,
  X,
  Check,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { buttonStyles } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { memberDisplayName } from '../../projectDetails.shared';
import type { TeamState } from '../../hooks/useProjectDetailsPageState';
import type { SupervisorProjectDetail } from '../../types';

type TeamTabSectionProps = {
  project: SupervisorProjectDetail;
  team: TeamState;
};

export function TeamTabSection({ project, team }: TeamTabSectionProps) {
  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold tracking-tight text-slate-800">Project Team</h2>
          <p className="text-xs font-medium text-slate-400">
            Total {project.members.length} members assigned
          </p>
        </div>
        {!team.isManagingStudents && (
          <button
            type="button"
            className={buttonStyles({
              variant: 'primary',
              size: 'sm',
              className: 'rounded-xl shadow-lg shadow-indigo-100',
            })}
            onClick={team.startManagement}
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            Manage students
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="flex items-center gap-3">
          <Crown className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-500">Project leader</span>
        </div>

        {project.leader ? (
          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-xs font-black text-emerald-600 shadow-inner">
              {memberDisplayName(project.leader).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 sm:max-w-[220px]">
              <p className="truncate text-sm font-black tracking-tight text-slate-800">
                {memberDisplayName(project.leader)}
              </p>
              <div className="truncate text-xs font-bold text-emerald-600">
                <span className="opacity-70">{project.leader.email}</span>
                {project.leader.registrationNumber ? (
                  <span className="opacity-70">{` • ${project.leader.registrationNumber}`}</span>
                ) : null}
              </div>
            </div>

            {team.studentMembers.length > 0 ? (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <Select
                  value={team.leaderDraftId}
                  onChange={(e) => team.setLeaderDraftId(e.target.value)}
                  disabled={team.isUpdatingLeader}
                  className="h-10 w-full min-w-[160px] rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 sm:w-auto"
                  aria-label="Select new leader"
                >
                  {team.studentMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {memberDisplayName(member)}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  onClick={() => void team.submitLeaderUpdate()}
                  disabled={team.isUpdatingLeader || team.leaderDraftId === project.leader?.id}
                  className={buttonStyles({
                    variant: 'primary',
                    size: 'sm',
                    className:
                      'h-10 w-full rounded-xl bg-emerald-600 shadow-lg shadow-emerald-100 hover:bg-emerald-700 sm:w-auto',
                  })}
                >
                  {team.isUpdatingLeader ? 'Saving...' : 'Change'}
                </button>
              </div>
            ) : null}
          </div>
        ) : team.studentMembers.length > 0 ? (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <Select
              value={team.leaderDraftId}
              onChange={(e) => team.setLeaderDraftId(e.target.value)}
              disabled={team.isUpdatingLeader}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 sm:w-auto"
              aria-label="Select leader to assign"
            >
              <option value="">Pick a student...</option>
              {team.studentMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {memberDisplayName(member)}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={() => void team.submitLeaderUpdate()}
              disabled={team.isUpdatingLeader || !team.leaderDraftId}
              className={buttonStyles({
                variant: 'primary',
                size: 'md',
                className: 'w-full rounded-2xl shadow-lg shadow-indigo-100 sm:w-auto',
              })}
            >
              {team.isUpdatingLeader ? 'Assigning...' : 'Assign leader'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <Plus className="h-3 w-3" />
            <span>Add students first</span>
          </div>
        )}
      </div>

      {team.isManagingStudents &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 mx-4">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-700">
                      Add Team Members
                    </h3>
                    <p className="text-xs font-medium text-indigo-500/70">
                      Search and assign students to this project
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:border-slate-200 hover:text-slate-600 hover:shadow-md"
                  onClick={team.cancelManagement}
                  disabled={team.isAddingStudents}
                  aria-label="Close student management"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={team.studentQuery}
                    onChange={(e) => team.setStudentQuery(e.target.value)}
                    placeholder="Search by student email..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-11 text-sm font-medium outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    disabled={team.isAddingStudents}
                  />
                </div>

                {team.studentQuery.trim().length >= 3 && (
                  <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-inner">
                    {team.studentSearchState === 'loading' && (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                      </div>
                    )}
                    {team.studentSearchState === 'error' && (
                      <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-rose-700">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-bold">
                          {team.studentSearchError?.message ?? 'Unable to search students.'}
                        </p>
                      </div>
                    )}
                    {team.studentSearchState === 'empty' && (
                      <div className="py-8 text-center text-slate-400">
                        <p className="text-sm font-bold">No available students found.</p>
                      </div>
                    )}
                    {team.studentSearchState === 'results' && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {team.studentSearchResults.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 text-left transition-all hover:border-indigo-200 hover:bg-indigo-50/30 group"
                            onClick={() => team.selectStudentToAdd(student)}
                          >
                            <div className="min-w-0">
                              <p className="block truncate text-sm font-black text-slate-800">
                                {`${student.firstName} ${student.lastName}`.trim() || student.email}
                              </p>
                              <p className="block truncate text-xs font-bold text-slate-400 group-hover:text-indigo-500">
                                {student.email}
                                {student.registrationNumber
                                  ? ` • ${student.registrationNumber}`
                                  : ''}
                              </p>
                            </div>
                            <Plus className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {team.selectedStudentsToAdd.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                      Selected students ({team.selectedStudentsToAdd.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {team.selectedStudentsToAdd.map((student) => (
                        <div
                          key={student.id}
                          className="inline-flex items-center gap-2 rounded-2xl border border-indigo-100 bg-white pl-4 pr-2 py-1.5 shadow-sm animate-in fade-in zoom-in-95 duration-200"
                        >
                          <span className="text-xs font-black text-slate-700">
                            {`${student.firstName} ${student.lastName}`.trim() || student.email}
                          </span>
                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            onClick={() => team.removeSelectedStudent(student.id)}
                            disabled={team.isAddingStudents}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-indigo-100 pt-6">
                <button
                  type="button"
                  className={buttonStyles({
                    variant: 'secondary',
                    size: 'md',
                    className: 'rounded-xl',
                  })}
                  onClick={team.cancelManagement}
                  disabled={team.isAddingStudents}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={buttonStyles({
                    variant: 'primary',
                    size: 'md',
                    className: 'rounded-xl shadow-lg shadow-indigo-100',
                  })}
                  onClick={team.addStudents}
                  disabled={team.isAddingStudents || team.selectedStudentsToAdd.length === 0}
                >
                  {team.isAddingStudents ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Check className="mr-1.5 h-4 w-4" />
                      Add selected students
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {project.members.map((member) => (
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

                {project.leader?.id === member.id && (
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

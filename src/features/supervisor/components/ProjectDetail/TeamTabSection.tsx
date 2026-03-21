import { RoleBadge } from '@/components/ui/RoleBadge';
import { buttonStyles } from '@/components/ui/Button';
import { memberDisplayName } from '../../projectDetails.shared';
import type { TeamState } from '../../hooks/useProjectDetailsPageState';
import type { SupervisorProjectDetail } from '../../types';

type TeamTabSectionProps = {
  project: SupervisorProjectDetail;
  team: TeamState;
};

export function TeamTabSection({ project, team }: TeamTabSectionProps) {
  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Team</h2>
        {!team.isManagingStudents && (
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
            onClick={team.startManagement}
          >
            Manage students
          </button>
        )}
      </div>

      {project.leader ? (
        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
            {memberDisplayName(project.leader).charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">
              {memberDisplayName(project.leader)}
            </p>
            <p className="text-xs text-emerald-700">Project leader</p>
          </div>

          {team.studentMembers.length > 0 ? (
            <div className="flex shrink-0 items-center gap-2">
              <select
                value={team.leaderDraftId}
                onChange={(e) => team.setLeaderDraftId(e.target.value)}
                disabled={team.isUpdatingLeader}
                className="h-8 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition-colors focus:border-amber-300"
                aria-label="Select new leader"
              >
                {team.studentMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {memberDisplayName(member)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void team.submitLeaderUpdate()}
                disabled={team.isUpdatingLeader || team.leaderDraftId === project.leader?.id}
                className="inline-flex h-8 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                {team.isUpdatingLeader ? 'Saving...' : 'Change'}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-400">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M2 13c0-2.21 2.686-4 6-4s6 1.79 6 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-600">No project leader assigned</p>
            <p className="text-xs text-muted-foreground">Assign a student to lead this project</p>
          </div>

          {team.studentMembers.length > 0 ? (
            <div className="flex shrink-0 items-center gap-2">
              <select
                value={team.leaderDraftId}
                onChange={(e) => team.setLeaderDraftId(e.target.value)}
                disabled={team.isUpdatingLeader}
                className="h-8 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition-colors focus:border-amber-300"
                aria-label="Select leader to assign"
              >
                <option value="">Pick a student</option>
                {team.studentMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {memberDisplayName(member)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void team.submitLeaderUpdate()}
                disabled={team.isUpdatingLeader || !team.leaderDraftId}
                className="inline-flex h-8 items-center justify-center rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {team.isUpdatingLeader ? 'Assigning...' : 'Assign leader'}
              </button>
            </div>
          ) : (
            <p className="shrink-0 text-xs text-muted-foreground">Add students first</p>
          )}
        </div>
      )}

      {team.isManagingStudents && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Search student email
            </span>
            <input
              value={team.studentQuery}
              onChange={(e) => team.setStudentQuery(e.target.value)}
              placeholder="Type at least 3 characters from a student email"
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
              disabled={team.isAddingStudents}
            />
          </label>

          {team.studentQuery.trim().length >= 3 && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
              {team.studentSearchState === 'loading' && (
                <p className="text-sm text-muted-foreground">Searching students...</p>
              )}
              {team.studentSearchState === 'error' && (
                <p className="text-sm text-rose-600">
                  {team.studentSearchError?.message ?? 'Unable to search students right now.'}
                </p>
              )}
              {team.studentSearchState === 'empty' && (
                <p className="text-sm text-muted-foreground">No available students found.</p>
              )}
              {team.studentSearchState === 'results' && (
                <div className="space-y-2">
                  {team.studentSearchResults.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      className="flex w-full items-start justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50"
                      onClick={() => team.selectStudentToAdd(student)}
                    >
                      <span>
                        <span className="block text-sm font-medium text-foreground">
                          {`${student.firstName} ${student.lastName}`.trim() || student.email}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {student.email}
                          {student.registrationNumber ? ` • ${student.registrationNumber}` : ''}
                        </span>
                      </span>
                      <span className="text-xs text-slate-500">Add</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {team.selectedStudentsToAdd.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Selected students
              </p>
              <div className="flex flex-wrap gap-2">
                {team.selectedStudentsToAdd.map((student) => (
                  <div
                    key={student.id}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm"
                  >
                    <span className="text-foreground">
                      {`${student.firstName} ${student.lastName}`.trim() || student.email}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-slate-700"
                      onClick={() => team.removeSelectedStudent(student.id)}
                      disabled={team.isAddingStudents}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={buttonStyles({ variant: 'secondary', size: 'sm' })}
              onClick={team.cancelManagement}
              disabled={team.isAddingStudents}
            >
              Cancel
            </button>
            <button
              type="button"
              className={buttonStyles({ variant: 'primary', size: 'sm' })}
              onClick={team.addStudents}
              disabled={team.isAddingStudents || team.selectedStudentsToAdd.length === 0}
            >
              {team.isAddingStudents ? 'Adding...' : 'Add selected students'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {project.members.map((member) => (
          <div
            key={member.id}
            className={`rounded-2xl border p-4 ${member.memberRole === 'SUPERVISOR' ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-slate-50'}`}
          >
            <p className="font-medium text-foreground">{memberDisplayName(member)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{member.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RoleBadge role={member.memberRole} />
              {member.registrationNumber && (
                <span className="text-xs text-muted-foreground">• {member.registrationNumber}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

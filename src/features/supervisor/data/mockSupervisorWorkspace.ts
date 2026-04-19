import type { StoredUser } from '@/services/tokenStorage';
import type { SupervisorProject } from '../types';

function buildSupervisorName(user: StoredUser | null): string {
  if (!user) {
    return 'Dr. Supervisor';
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return fullName || 'Dr. Supervisor';
}

export function createSupervisorProjects(user: StoredUser | null): SupervisorProject[] {
  const supervisorName = buildSupervisorName(user);

  return [
    {
      id: 'smart-attendance-tracker',
      title: 'Smart Attendance Tracker',
      summary:
        'Computer-vision attendance capture with supervisor-level monitoring, weekly milestones, and risk tracking.',
      lifecycle: 'ACTIVE',
      batch: '2026',
      semester: 'Semester 1',
      milestoneDate: '2026-03-21',
      lastActivityAt: '2026-03-02T16:30:00.000Z',
      progress: 74,
      communicationUrl: 'https://teams.microsoft.com/',
      repositoryUrl: 'https://github.com/example/smart-attendance-tracker',
      jiraBoardUrl: 'https://jira.example.com/projects/SAT/board',
      members: [
        { id: 'sup-1', name: supervisorName, role: 'Supervisor' },
        { id: 'stu-1', name: 'Nimsara Jayarathna', role: 'Student' },
        { id: 'stu-2', name: 'Kavindu Perera', role: 'Student' },
      ],
      metrics: [
        { label: 'Progress', value: '74%' },
        { label: 'Meetings', value: '8' },
        { label: 'Open actions', value: '5' },
        { label: 'Files', value: '14' },
      ],
      integrations: [
        {
          label: 'GitHub repository',
          status: 'Connected',
          href: 'https://github.com/example/smart-attendance-tracker',
        },
        {
          label: 'Jira board',
          status: 'Connected',
          href: 'https://jira.example.com/projects/SAT/board',
        },
        {
          label: 'Communication channel',
          status: 'Connected',
          href: 'https://teams.microsoft.com/',
        },
      ],
      highlights: [
        'Sprint review completed with a requested risk summary for the next meeting.',
        'Repository activity is healthy and milestone evidence is being uploaded consistently.',
        'Current blocker is edge-case recognition under poor lighting conditions.',
      ],
      events: [
        {
          id: 'sat-event-1',
          title: 'Sprint review completed',
          summary: 'The current sprint demo landed cleanly and the next focus is risk compression.',
          occurredAt: '2026-03-02T15:00:00.000Z',
        },
        {
          id: 'sat-event-2',
          title: 'Meeting minutes approved',
          summary: 'Weekly supervision notes were approved and action items were distributed.',
          occurredAt: '2026-02-28T09:30:00.000Z',
        },
      ],
      activityWeeks: [6, 9, 11, 10, 13, 15],
      contributions: [
        { memberId: 'stu-1', commits: 24, pullRequests: 6 },
        { memberId: 'stu-2', commits: 17, pullRequests: 4 },
      ],
      meetings: [
        {
          id: 'sat-meet-1',
          title: 'Weekly supervisor sync',
          scheduledFor: '2026-03-05T08:30:00.000Z',
          status: 'Approved',
          summary: 'Demo current sprint progress and review data quality edge cases.',
        },
        {
          id: 'sat-meet-2',
          title: 'Risk review',
          scheduledFor: '2026-03-12T10:00:00.000Z',
          status: 'Submitted',
          summary: 'Review low-light detection quality and discuss mitigation work.',
        },
      ],
      actionItems: [
        {
          id: 'sat-action-1',
          title: 'Refine low-light attendance test cases',
          assignee: 'Nimsara Jayarathna',
          dueDate: '2026-03-08',
          priority: 'High',
          status: 'In Progress',
          jiraKey: 'SAT-104',
        },
        {
          id: 'sat-action-2',
          title: 'Attach sprint screenshots to the review folder',
          assignee: 'Kavindu Perera',
          dueDate: '2026-03-06',
          priority: 'Medium',
          status: 'Done',
          jiraKey: 'SAT-109',
        },
        {
          id: 'sat-action-3',
          title: 'Document fallback handling for missing camera frames',
          assignee: 'Nimsara Jayarathna',
          dueDate: '2026-03-10',
          priority: 'High',
          status: 'Todo',
        },
      ],
      files: [
        {
          id: 'sat-file-1',
          name: 'Sprint-05-Demo.pdf',
          uploadedBy: 'Nimsara Jayarathna',
          updatedAt: '2026-03-02T11:30:00.000Z',
          sizeLabel: '1.8 MB',
          type: 'PDF',
        },
        {
          id: 'sat-file-2',
          name: 'Meeting-Notes-Week-08.docx',
          uploadedBy: 'Kavindu Perera',
          updatedAt: '2026-02-28T09:45:00.000Z',
          sizeLabel: '640 KB',
          type: 'DOCX',
        },
      ],
    },
    {
      id: 'mentorlink-portal',
      title: 'MentorLink Portal',
      summary:
        'A student-supervisor coordination portal for milestones, notes, delivery planning, and actionable follow-ups.',
      lifecycle: 'PLANNING',
      batch: '2026',
      semester: 'Semester 1',
      milestoneDate: '2026-03-28',
      lastActivityAt: '2026-03-01T10:15:00.000Z',
      progress: 32,
      communicationUrl: 'https://discord.com/',
      repositoryUrl: 'https://github.com/example/mentorlink-portal',
      members: [
        { id: 'sup-1', name: supervisorName, role: 'Supervisor' },
        { id: 'stu-3', name: 'Ayesha Silva', role: 'Student' },
        { id: 'stu-4', name: 'Dulaj Fernando', role: 'Student' },
      ],
      metrics: [
        { label: 'Progress', value: '32%' },
        { label: 'Meetings', value: '4' },
        { label: 'Open actions', value: '3' },
        { label: 'Files', value: '7' },
      ],
      integrations: [
        {
          label: 'GitHub repository',
          status: 'Connected',
          href: 'https://github.com/example/mentorlink-portal',
        },
        { label: 'Jira board', status: 'Needs setup' },
        {
          label: 'Communication channel',
          status: 'Connected',
          href: 'https://discord.com/',
        },
      ],
      highlights: [
        'Wireframes are approved and ready to be broken into feature tickets.',
        'The next milestone depends on a stable route and layout map.',
      ],
      events: [
        {
          id: 'ml-event-1',
          title: 'Prototype mapping completed',
          summary:
            'The current UI structure has been mapped from the prototype into feature folders.',
          occurredAt: '2026-03-01T09:10:00.000Z',
        },
      ],
      activityWeeks: [1, 2, 4, 4, 5, 6],
      contributions: [
        { memberId: 'stu-3', commits: 9, pullRequests: 2 },
        { memberId: 'stu-4', commits: 5, pullRequests: 1 },
      ],
      meetings: [
        {
          id: 'ml-meet-1',
          title: 'Architecture alignment',
          scheduledFor: '2026-03-07T14:00:00.000Z',
          status: 'Draft',
          summary: 'Finalize route ownership and component boundaries.',
        },
      ],
      actionItems: [
        {
          id: 'ml-action-1',
          title: 'Finalize milestone reminder flow',
          assignee: 'Ayesha Silva',
          dueDate: '2026-03-09',
          priority: 'Medium',
          status: 'In Progress',
        },
        {
          id: 'ml-action-2',
          title: 'Prepare feature ownership breakdown',
          assignee: 'Dulaj Fernando',
          dueDate: '2026-03-11',
          priority: 'Low',
          status: 'Todo',
        },
      ],
      files: [
        {
          id: 'ml-file-1',
          name: 'Wireframe-Board.fig',
          uploadedBy: 'Ayesha Silva',
          updatedAt: '2026-03-01T10:20:00.000Z',
          sizeLabel: '4.1 MB',
          type: 'FIG',
        },
      ],
    },
    {
      id: 'field-audit-mobile',
      title: 'Field Audit Mobile',
      summary:
        'Offline-first field audit capture with sync recovery, evidence uploads, and supervisor-facing risk summaries.',
      lifecycle: 'AT_RISK',
      batch: '2025',
      semester: 'Semester 2',
      milestoneDate: '2026-03-14',
      lastActivityAt: '2026-02-29T18:40:00.000Z',
      progress: 58,
      communicationUrl: 'https://meet.google.com/',
      jiraBoardUrl: 'https://jira.example.com/projects/FAM/board',
      members: [
        { id: 'sup-1', name: supervisorName, role: 'Supervisor' },
        { id: 'stu-5', name: 'Nethmi Rajapaksha', role: 'Student' },
        { id: 'stu-6', name: 'Thisara Liyanage', role: 'Student' },
      ],
      metrics: [
        { label: 'Progress', value: '58%' },
        { label: 'Meetings', value: '6' },
        { label: 'Open actions', value: '6' },
        { label: 'Files', value: '11' },
      ],
      integrations: [
        { label: 'GitHub repository', status: 'Issue' },
        {
          label: 'Jira board',
          status: 'Connected',
          href: 'https://jira.example.com/projects/FAM/board',
        },
        {
          label: 'Communication channel',
          status: 'Connected',
          href: 'https://meet.google.com/',
        },
      ],
      highlights: [
        'Submission pipeline is stable but offline merge conflicts are still unresolved.',
        'This project needs faster closure on blocker-class items.',
      ],
      events: [
        {
          id: 'fam-event-1',
          title: 'Offline sync issue reopened',
          summary: 'Repeated low-connectivity submissions are producing merge conflicts.',
          occurredAt: '2026-02-29T18:40:00.000Z',
        },
      ],
      activityWeeks: [5, 6, 7, 5, 4, 4],
      contributions: [
        { memberId: 'stu-5', commits: 13, pullRequests: 3 },
        { memberId: 'stu-6', commits: 11, pullRequests: 2 },
      ],
      meetings: [
        {
          id: 'fam-meet-1',
          title: 'Recovery planning session',
          scheduledFor: '2026-03-04T11:00:00.000Z',
          status: 'Submitted',
          summary: 'Prioritize sync consistency and define fallback handling.',
        },
      ],
      actionItems: [
        {
          id: 'fam-action-1',
          title: 'Add retry-safe merge strategy for offline uploads',
          assignee: 'Nethmi Rajapaksha',
          dueDate: '2026-03-07',
          priority: 'High',
          status: 'Todo',
        },
        {
          id: 'fam-action-2',
          title: 'Document field test regression summary',
          assignee: 'Thisara Liyanage',
          dueDate: '2026-03-05',
          priority: 'Medium',
          status: 'In Progress',
          jiraKey: 'FAM-33',
        },
      ],
      files: [
        {
          id: 'fam-file-1',
          name: 'Offline-Sync-Bug-Log.md',
          uploadedBy: 'Nethmi Rajapaksha',
          updatedAt: '2026-02-29T19:10:00.000Z',
          sizeLabel: '210 KB',
          type: 'MD',
        },
      ],
    },
    {
      id: 'insight-qa-hub',
      title: 'Insight QA Hub',
      summary:
        'A supervisor-facing review console for test evidence, regression trends, and delivery readiness checks.',
      lifecycle: 'BEHIND',
      batch: '2025',
      semester: 'Semester 2',
      milestoneDate: '2026-03-11',
      lastActivityAt: '2026-02-27T17:25:00.000Z',
      progress: 41,
      repositoryUrl: 'https://github.com/example/insight-qa-hub',
      members: [
        { id: 'sup-1', name: supervisorName, role: 'Supervisor' },
        { id: 'stu-7', name: 'Sahan Wickramasuriya', role: 'Student' },
      ],
      metrics: [
        { label: 'Progress', value: '41%' },
        { label: 'Meetings', value: '3' },
        { label: 'Open actions', value: '7' },
        { label: 'Files', value: '5' },
      ],
      integrations: [
        {
          label: 'GitHub repository',
          status: 'Connected',
          href: 'https://github.com/example/insight-qa-hub',
        },
        { label: 'Jira board', status: 'Needs setup' },
        { label: 'Communication channel', status: 'Needs setup' },
      ],
      highlights: [
        'The project is trending behind due to weak evidence capture.',
        'Supervisor review needs a more consistent test reporting structure.',
      ],
      events: [
        {
          id: 'qa-event-1',
          title: 'Regression report missed',
          summary: 'The last submission did not include the agreed regression evidence.',
          occurredAt: '2026-02-27T17:25:00.000Z',
        },
      ],
      activityWeeks: [4, 4, 3, 2, 2, 1],
      contributions: [{ memberId: 'stu-7', commits: 8, pullRequests: 1 }],
      meetings: [
        {
          id: 'qa-meet-1',
          title: 'Recovery checkpoint',
          scheduledFor: '2026-03-06T09:00:00.000Z',
          status: 'Draft',
          summary: 'Define the shortest path to get reporting quality back under control.',
        },
      ],
      actionItems: [
        {
          id: 'qa-action-1',
          title: 'Rebuild regression evidence checklist',
          assignee: 'Sahan Wickramasuriya',
          dueDate: '2026-03-04',
          priority: 'High',
          status: 'Todo',
        },
      ],
      files: [
        {
          id: 'qa-file-1',
          name: 'Evidence-Gap-Checklist.pdf',
          uploadedBy: 'Sahan Wickramasuriya',
          updatedAt: '2026-02-27T15:00:00.000Z',
          sizeLabel: '910 KB',
          type: 'PDF',
        },
      ],
    },
  ];
}

import type { StoredUser } from '@/services/tokenStorage';
import type { StudentProject } from '../types';

function buildDisplayName(user: StoredUser | null): string {
  if (!user) {
    return 'Student Researcher';
  }

  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || 'Student Researcher';
}

export function createStudentProjects(user: StoredUser | null): StudentProject[] {
  const currentStudent = buildDisplayName(user);

  return [
    {
      id: 'smart-attendance-tracker',
      title: 'Smart Attendance Tracker',
      summary:
        'AI-assisted attendance recognition with supervisor dashboards, submission checkpoints, and academic reporting.',
      status: 'ACTIVE',
      batch: '2026',
      semester: 'Semester 1',
      milestoneDate: '2026-03-21',
      lastUpdatedAt: '2026-03-02T16:30:00.000Z',
      communicationUrl: 'https://teams.microsoft.com/',
      repositoryUrl: 'https://github.com/example/smart-attendance-tracker',
      jiraBoardUrl: 'https://jira.example.com/projects/SAT/board',
      highlights: [
        'Current sprint is focused on attendance anomaly detection.',
        'Supervisor requested a sharper risk summary for the next review.',
        'Repository and meeting trail are in sync with the weekly submission cadence.',
      ],
      teamMembers: [currentStudent, 'Kavindu Perera', 'Supervisor: Dr. Fernando'],
      metrics: [
        { label: 'Progress', value: '74%' },
        { label: 'Open actions', value: '5' },
        { label: 'Meetings logged', value: '8' },
        { label: 'Files submitted', value: '14' },
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
          label: 'Communication space',
          status: 'Connected',
          href: 'https://teams.microsoft.com/',
        },
      ],
      activity: [
        {
          id: 'sat-activity-1',
          title: 'Sprint review completed',
          description:
            'Supervisor approved the revised prediction flow and requested a demo-ready summary.',
          occurredAt: '2026-03-02T15:00:00.000Z',
        },
        {
          id: 'sat-activity-2',
          title: 'Meeting notes submitted',
          description:
            'Weekly meeting note was shared with the action list and repository references.',
          occurredAt: '2026-02-28T09:30:00.000Z',
        },
        {
          id: 'sat-activity-3',
          title: 'Integration check passed',
          description:
            'GitHub and Jira references are mapped to the project workspace without issues.',
          occurredAt: '2026-02-25T12:15:00.000Z',
        },
      ],
      meetings: [
        {
          id: 'sat-meeting-1',
          title: 'Weekly supervisor sync',
          scheduledFor: '2026-03-05T08:30:00.000Z',
          status: 'Approved',
          notes: 'Prepare the updated sprint demo and mention open risks.',
        },
        {
          id: 'sat-meeting-2',
          title: 'Risk review',
          scheduledFor: '2026-03-12T10:00:00.000Z',
          status: 'Pending',
          notes: 'Discuss dataset drift and mitigation options.',
        },
      ],
      actionItems: [
        {
          id: 'sat-action-1',
          title: 'Refine low-light attendance test cases',
          owner: currentStudent,
          dueDate: '2026-03-08',
          status: 'In progress',
        },
        {
          id: 'sat-action-2',
          title: 'Attach sprint screenshots to the review folder',
          owner: 'Kavindu Perera',
          dueDate: '2026-03-06',
          status: 'Done',
        },
        {
          id: 'sat-action-3',
          title: 'Document fallback handling for missing camera frames',
          owner: currentStudent,
          dueDate: '2026-03-10',
          status: 'Blocked',
        },
      ],
      files: [
        {
          id: 'sat-file-1',
          name: 'Sprint-05-Demo.pdf',
          type: 'PDF',
          updatedAt: '2026-03-02T11:30:00.000Z',
        },
        {
          id: 'sat-file-2',
          name: 'Meeting-Notes-Week-08.docx',
          type: 'DOCX',
          updatedAt: '2026-02-28T09:45:00.000Z',
        },
        {
          id: 'sat-file-3',
          name: 'Dataset-Risk-Log.xlsx',
          type: 'XLSX',
          updatedAt: '2026-02-26T14:10:00.000Z',
        },
      ],
    },
    {
      id: 'mentorlink-portal',
      title: 'MentorLink Portal',
      summary:
        'A guided student-supervisor collaboration portal for milestone planning, action tracking, and communication summaries.',
      status: 'PLANNING',
      batch: '2026',
      semester: 'Semester 1',
      milestoneDate: '2026-03-28',
      lastUpdatedAt: '2026-03-01T10:15:00.000Z',
      communicationUrl: 'https://discord.com/',
      repositoryUrl: 'https://github.com/example/mentorlink-portal',
      highlights: [
        'UI wireframes are approved and waiting for implementation alignment.',
        'Next priority is converting the initial dashboard flow into reusable React sections.',
        'The project scope is still flexible before the next milestone lock-in.',
      ],
      teamMembers: [currentStudent, 'Ayesha Silva', 'Supervisor: Ms. Jayasuriya'],
      metrics: [
        { label: 'Progress', value: '32%' },
        { label: 'Open actions', value: '3' },
        { label: 'Meetings logged', value: '4' },
        { label: 'Files submitted', value: '7' },
      ],
      integrations: [
        {
          label: 'GitHub repository',
          status: 'Connected',
          href: 'https://github.com/example/mentorlink-portal',
        },
        { label: 'Jira board', status: 'Optional' },
        {
          label: 'Communication space',
          status: 'Connected',
          href: 'https://discord.com/',
        },
      ],
      activity: [
        {
          id: 'ml-activity-1',
          title: 'Prototype mapping completed',
          description:
            'Core page sections were mapped from the prototype into the current frontend design language.',
          occurredAt: '2026-03-01T09:10:00.000Z',
        },
        {
          id: 'ml-activity-2',
          title: 'Milestone draft submitted',
          description: 'Initial milestone targets were shared for supervisor review.',
          occurredAt: '2026-02-27T13:20:00.000Z',
        },
      ],
      meetings: [
        {
          id: 'ml-meeting-1',
          title: 'Architecture alignment',
          scheduledFor: '2026-03-07T14:00:00.000Z',
          status: 'Draft',
          notes: 'Finalize feature folder ownership and route breakdown.',
        },
      ],
      actionItems: [
        {
          id: 'ml-action-1',
          title: 'Finalize user flow for milestone reminders',
          owner: 'Ayesha Silva',
          dueDate: '2026-03-09',
          status: 'In progress',
        },
        {
          id: 'ml-action-2',
          title: 'Prepare component inventory for student workspace',
          owner: currentStudent,
          dueDate: '2026-03-11',
          status: 'Done',
        },
      ],
      files: [
        {
          id: 'ml-file-1',
          name: 'Wireframe-Board.fig',
          type: 'FIG',
          updatedAt: '2026-03-01T10:20:00.000Z',
        },
        {
          id: 'ml-file-2',
          name: 'Scope-Checklist.pdf',
          type: 'PDF',
          updatedAt: '2026-02-27T15:05:00.000Z',
        },
      ],
    },
    {
      id: 'field-audit-mobile',
      title: 'Field Audit Mobile',
      summary:
        'Offline-first mobile workflow for field inspections, evidence uploads, and supervisor-ready progress summaries.',
      status: 'AT_RISK',
      batch: '2025',
      semester: 'Semester 2',
      milestoneDate: '2026-03-14',
      lastUpdatedAt: '2026-02-29T18:40:00.000Z',
      communicationUrl: 'https://meet.google.com/',
      jiraBoardUrl: 'https://jira.example.com/projects/FAM/board',
      highlights: [
        'Submission pipeline is stable, but offline sync still needs conflict handling.',
        'The upcoming milestone is tight and requires faster issue closure.',
        'Supervisor asked for a more explicit blocker breakdown this week.',
      ],
      teamMembers: [currentStudent, 'Nethmi Rajapaksha', 'Supervisor: Prof. Wickramasinghe'],
      metrics: [
        { label: 'Progress', value: '58%' },
        { label: 'Open actions', value: '6' },
        { label: 'Meetings logged', value: '6' },
        { label: 'Files submitted', value: '11' },
      ],
      integrations: [
        { label: 'GitHub repository', status: 'Needs attention' },
        {
          label: 'Jira board',
          status: 'Connected',
          href: 'https://jira.example.com/projects/FAM/board',
        },
        {
          label: 'Communication space',
          status: 'Connected',
          href: 'https://meet.google.com/',
        },
      ],
      activity: [
        {
          id: 'fam-activity-1',
          title: 'Offline sync issue reopened',
          description:
            'Conflict merging is failing for repeated submissions from low-connectivity sessions.',
          occurredAt: '2026-02-29T18:40:00.000Z',
        },
        {
          id: 'fam-activity-2',
          title: 'Supervisor feedback received',
          description: 'A risk-focused action list is required before the next checkpoint.',
          occurredAt: '2026-02-28T16:00:00.000Z',
        },
      ],
      meetings: [
        {
          id: 'fam-meeting-1',
          title: 'Recovery planning session',
          scheduledFor: '2026-03-04T11:00:00.000Z',
          status: 'Pending',
          notes: 'Prioritize sync consistency and define a fallback submission path.',
        },
      ],
      actionItems: [
        {
          id: 'fam-action-1',
          title: 'Add retry-safe merge strategy for offline uploads',
          owner: currentStudent,
          dueDate: '2026-03-07',
          status: 'Blocked',
        },
        {
          id: 'fam-action-2',
          title: 'Document field test regression summary',
          owner: 'Nethmi Rajapaksha',
          dueDate: '2026-03-05',
          status: 'In progress',
        },
      ],
      files: [
        {
          id: 'fam-file-1',
          name: 'Offline-Sync-Bug-Log.md',
          type: 'MD',
          updatedAt: '2026-02-29T19:10:00.000Z',
        },
        {
          id: 'fam-file-2',
          name: 'Regression-Test-Run.pdf',
          type: 'PDF',
          updatedAt: '2026-02-28T17:00:00.000Z',
        },
      ],
    },
  ];
}

import { EmptyState } from '@/components/feedback/EmptyState';
import { useState } from 'react';
import { SupervisorMeetingChannelsSection } from '@/features/meetings/components/SupervisorMeetingChannelsSection';

type MeetingsTabSectionProps = {
  projectId: string;
};

type MeetingsInnerTab = 'channels' | 'records';

export function MeetingsTabSection({ projectId }: MeetingsTabSectionProps) {
  const [activeTab, setActiveTab] = useState<MeetingsInnerTab>('channels');
  const tabs: Array<{ value: MeetingsInnerTab; label: string }> = [
    { value: 'channels', label: 'Channels' },
    { value: 'records', label: 'Records' },
  ];

  return (
    <section className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <ul
          className="flex flex-wrap items-center justify-center gap-1.5"
          role="tablist"
          aria-label="Meeting insights"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <li key={tab.value} role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.value)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-all ${
                    isActive
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div hidden={activeTab !== 'channels'}>
        <SupervisorMeetingChannelsSection
          projectId={projectId}
          enabled={activeTab === 'channels'}
        />
      </div>

      <div hidden={activeTab !== 'records'}>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <EmptyState
            title="Records coming soon"
            description="Meeting records will be available in a future update."
          />
        </div>
      </div>
    </section>
  );
}

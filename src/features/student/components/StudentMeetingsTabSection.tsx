import { PageTabs } from '@/components/ui/PageTabs';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useState } from 'react';
import { StudentMeetingChannelsSection } from '@/features/meetings/components/StudentMeetingChannelsSection';

type StudentMeetingsTabSectionProps = {
  projectId: string;
};

type MeetingsInnerTab = 'channels' | 'records';

export function StudentMeetingsTabSection({ projectId }: StudentMeetingsTabSectionProps) {
  const [activeTab, setActiveTab] = useState<MeetingsInnerTab>('channels');

  return (
    <section className="space-y-5">
      <PageTabs
        items={[
          { value: 'channels', label: 'Channels' },
          { value: 'records', label: 'Records' },
        ]}
        value={activeTab}
        onChange={(value) => setActiveTab(value as MeetingsInnerTab)}
        tone="student"
      />

      <div hidden={activeTab !== 'channels'}>
        <StudentMeetingChannelsSection projectId={projectId} enabled={activeTab === 'channels'} />
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

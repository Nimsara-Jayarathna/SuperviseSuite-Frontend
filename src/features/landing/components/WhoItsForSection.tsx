import { Check, GraduationCap, UserCircle } from 'lucide-react';
import type { LandingAudienceCard } from '../types';

const AUDIENCES: LandingAudienceCard[] = [
  {
    id: 'students',
    icon: UserCircle,
    title: 'For Students',
    items: [
      'Track project progress transparently',
      'Share GitHub activity automatically',
      'Document meeting outcomes',
    ],
  },
  {
    id: 'supervisors',
    icon: GraduationCap,
    title: 'For Supervisors',
    items: [
      'Monitor student commits in real-time',
      'Review project milestones efficiently',
      'Maintain organized meeting records',
    ],
  },
];

export function WhoItsForSection() {
  return (
    <section className="bg-white/85 p-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Who it&apos;s for</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Designed for modern research supervision.
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {AUDIENCES.map(({ id, icon: Icon, title, items }) => (
          <div key={id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                <Icon className="h-6 w-6 text-sky-700" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            </div>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                  <span className="text-sm leading-6 text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

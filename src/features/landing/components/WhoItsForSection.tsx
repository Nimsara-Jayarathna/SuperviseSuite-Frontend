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
    <section className="relative overflow-hidden rounded-3xl border border-white/35 bg-white/60 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.1)] backdrop-blur-md">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Who it&apos;s for
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Designed for modern research supervision.
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {AUDIENCES.map(({ id, icon: Icon, title, items }) => (
          <div
            key={id}
            className="relative overflow-hidden rounded-3xl border border-transparent bg-white/55 p-6 shadow-[0_22px_54px_rgba(15,23,42,0.12)] backdrop-blur-md"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(155deg,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0.5)_58%,rgba(56,189,248,0.12)_100%)]" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                <Icon className="h-6 w-6 text-sky-700" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            </div>
            <ul className="relative z-10 mt-4 space-y-3">
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

import type { LandingFeatureCard } from '../types';

type FeatureCardProps = Omit<LandingFeatureCard, 'id'>;

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}

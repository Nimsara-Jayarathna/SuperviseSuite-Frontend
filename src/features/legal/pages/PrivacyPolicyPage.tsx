import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: March 31, 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-7 text-slate-700">
        <p>
          SuperviseSuite processes account and project integration data to provide project
          supervision features.
        </p>
        <p>
          For Jira integration, OAuth tokens are handled server-side and are never exposed in the
          frontend UI.
        </p>
        <p>
          We request only the minimum Jira read scopes required for viewing project-related Jira
          data.
        </p>
      </section>

      <div className="mt-10">
        <Link to="/" className="text-sm font-medium text-sky-700 hover:text-sky-800">
          Back to home
        </Link>
      </div>
    </main>
  );
}

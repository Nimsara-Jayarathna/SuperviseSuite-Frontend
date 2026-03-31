import { Link } from 'react-router-dom';

export function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: March 31, 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-7 text-slate-700">
        <p>
          By using SuperviseSuite, users agree to use the platform for academic project
          collaboration and supervision workflows.
        </p>
        <p>
          Jira integration is provided in read-only mode for linked workspaces authorized via
          Atlassian OAuth.
        </p>
        <p>
          Users are responsible for the accuracy of linked project data and for maintaining access
          rights in their Atlassian organization.
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

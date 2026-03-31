import { Link } from 'react-router-dom';

export function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Support</h1>
      <p className="mt-2 text-sm text-slate-500">Need help with SuperviseSuite?</p>

      <section className="mt-8 space-y-4 text-sm leading-7 text-slate-700">
        <p>For support, contact the SuperviseSuite team through your organization admin channel.</p>
        <p>
          If you are troubleshooting Jira connection issues, include your project ID and the time
          of the failed attempt.
        </p>
        <p>This local environment support page is intended for development and QA usage.</p>
      </section>

      <div className="mt-10">
        <Link to="/" className="text-sm font-medium text-sky-700 hover:text-sky-800">
          Back to home
        </Link>
      </div>
    </main>
  );
}

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders title, subtitle, and actions', () => {
    render(
      <PageHeader
        title="Projects"
        subtitle="Review all active projects."
        actions={<button type="button">New project</button>}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByText('Review all active projects.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New project' })).toBeInTheDocument();
  });
});

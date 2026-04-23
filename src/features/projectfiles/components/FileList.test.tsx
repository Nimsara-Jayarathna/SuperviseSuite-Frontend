import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProjectFile } from '../types';
import { FileList } from './FileList';

function makeFile(overrides: Partial<ProjectFile> = {}): ProjectFile {
  return {
    id: 'f-1',
    fileName: 'project-brief.pdf',
    fileType: 'application/pdf',
    fileSize: 51200,
    uploadedBy: 'u-1',
    uploadedByName: 'Jane Student',
    uploadedByRole: 'STUDENT',
    createdAt: '2026-04-18T12:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(max-width: 767px)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

describe('FileList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows only download action when delete is not allowed', () => {
    mockMatchMedia(false);
    const onDownload = vi.fn();

    render(
      <FileList
        files={[makeFile()]}
        canDelete={false}
        onDownload={onDownload}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Download file' }));
    expect(onDownload).toHaveBeenCalledWith('f-1');
    expect(screen.queryByRole('button', { name: 'Delete file' })).toBeNull();
  });

  it('renders mobile card fallback when viewport is narrow', () => {
    mockMatchMedia(true);

    render(
      <FileList
        files={[makeFile({ id: 'f-mobile' })]}
        canDelete
        onDownload={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('project-brief.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download file' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete file' })).toBeInTheDocument();
  });
});

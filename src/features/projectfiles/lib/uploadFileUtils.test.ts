import { describe, expect, it } from 'vitest';
import { resolveUploadContentType } from './uploadFileUtils';

describe('resolveUploadContentType', () => {
  it('returns normalized file.type when present', () => {
    const file = new File(['x'], 'report.pdf', { type: ' Application/PDF ' });
    expect(resolveUploadContentType(file)).toBe('application/pdf');
  });

  it('infers from extension when file.type is empty', () => {
    const file = new File(['x'], 'report.PDF', { type: '' });
    expect(resolveUploadContentType(file)).toBe('application/pdf');
  });

  it('falls back to application/octet-stream for unknown extension', () => {
    const file = new File(['x'], 'report.unknown', { type: '' });
    expect(resolveUploadContentType(file)).toBe('application/octet-stream');
  });

  it('falls back to application/octet-stream when no extension', () => {
    const file = new File(['x'], 'report', { type: '' });
    expect(resolveUploadContentType(file)).toBe('application/octet-stream');
  });
});


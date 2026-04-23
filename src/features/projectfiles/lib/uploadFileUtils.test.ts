import { describe, expect, it } from 'vitest';
import {
  enforceExpectedExtension,
  resolveExpectedExtension,
  resolveUploadContentType,
} from './uploadFileUtils';

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

describe('resolveExpectedExtension', () => {
  const allowed = new Set(['pdf', 'docx', 'pptx', 'zip']);

  it('prefers a valid extension from the selected file name', () => {
    const file = new File(['x'], 'report.PDF', { type: 'application/octet-stream' });
    expect(resolveExpectedExtension(file, allowed)).toBe('pdf');
  });

  it('infers from mime type when file name has no extension', () => {
    const file = new File(['x'], 'report', { type: 'application/pdf' });
    expect(resolveExpectedExtension(file, allowed)).toBe('pdf');
  });

  it('returns null when neither file name nor mime type resolve to an allowed type', () => {
    const file = new File(['x'], 'report', { type: 'application/octet-stream' });
    expect(resolveExpectedExtension(file, allowed)).toBeNull();
  });
});

describe('enforceExpectedExtension', () => {
  it('appends extension when missing', () => {
    expect(enforceExpectedExtension('report', 'pdf', 50)).toBe('report.pdf');
  });

  it('replaces a mismatched extension', () => {
    expect(enforceExpectedExtension('report.docx', 'pdf', 50)).toBe('report.pdf');
  });

  it('preserves extension when trimming by max length', () => {
    const result = enforceExpectedExtension('averyverylongfilename', 'pdf', 10);
    expect(result).toBe('averyv.pdf');
  });

  it('handles a trailing dot gracefully', () => {
    expect(enforceExpectedExtension('report.', 'pdf', 50)).toBe('report.pdf');
  });
});

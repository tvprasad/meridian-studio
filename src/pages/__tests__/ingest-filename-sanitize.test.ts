import { describe, it, expect } from 'vitest';

// Mirrors the sanitization applied in Ingest.tsx before appending files to FormData.
// Azure AI Search document keys only allow: letters, digits, underscore, dash, equals sign.
// Any other character (including dots) must be replaced to avoid a 400 InvalidDocumentKey error.
const sanitizeFilename = (name: string) => name.replace(/[^a-zA-Z0-9_\-=]/g, '_');

describe('ingest filename sanitization', () => {
  it('replaces dots with underscores', () => {
    expect(sanitizeFilename('faqs.txt')).toBe('faqs_txt');
  });

  it('replaces spaces with underscores', () => {
    expect(sanitizeFilename('my document.pdf')).toBe('my_document_pdf');
  });

  it('handles multiple dots', () => {
    expect(sanitizeFilename('report.v2.1.docx')).toBe('report_v2_1_docx');
  });

  it('leaves already-safe names unchanged', () => {
    expect(sanitizeFilename('safe_file-name')).toBe('safe_file-name');
  });

  it('replaces special characters', () => {
    expect(sanitizeFilename('Q&A (2024).txt')).toBe('Q_A__2024__txt');
  });

  it('preserves letters, digits, underscore, dash, equals', () => {
    expect(sanitizeFilename('doc_v1-final=rev2')).toBe('doc_v1-final=rev2');
  });
});

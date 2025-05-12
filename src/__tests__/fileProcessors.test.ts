import { describe, it, expect } from 'vitest';
import { processFile, processSpreadsheet, processWord, processPDF } from '../utils/fileProcessors';

describe('File Processors', () => {
  it('processes Excel files correctly', async () => {
    const file = new File(
      ['test,data\n1,2'],
      'test.xlsx',
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );
    const result = await processSpreadsheet(file);
    expect(result.headers).toEqual(['test', 'data']);
    expect(result.data[0]).toEqual(['1', '2']);
  });

  it('processes Word files correctly', async () => {
    const file = new File(
      ['test content'],
      'test.docx',
      { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    );
    const result = await processWord(file);
    expect(result.headers).toEqual(['Titre', 'Contenu']);
  });

  it('processes PDF files correctly', async () => {
    const file = new File(
      ['test content'],
      'test.pdf',
      { type: 'application/pdf' }
    );
    const result = await processPDF(file);
    expect(result.headers).toEqual(['Section', 'Contenu']);
  });
});
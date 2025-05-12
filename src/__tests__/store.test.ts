import { describe, it, expect, beforeEach } from 'vitest';
import { useSpreadsheetStore } from '../store';
import { act } from '@testing-library/react';

describe('Spreadsheet Store', () => {
  beforeEach(() => {
    useSpreadsheetStore.setState({
      data: [],
      columns: [],
      selectedCell: null,
      settings: useSpreadsheetStore.getState().settings,
      history: [],
      historyIndex: 0,
    });
  });

  it('adds new rows correctly', () => {
    act(() => {
      useSpreadsheetStore.getState().addRow();
    });
    expect(useSpreadsheetStore.getState().data).toHaveLength(1);
  });

  it('adds new columns correctly', () => {
    act(() => {
      useSpreadsheetStore.getState().addColumn();
    });
    expect(useSpreadsheetStore.getState().columns).toHaveLength(1);
  });

  it('updates cell values', () => {
    act(() => {
      useSpreadsheetStore.getState().addRow();
      useSpreadsheetStore.getState().addColumn();
      useSpreadsheetStore.getState().updateCell(0, 0, 'test');
    });
    expect(useSpreadsheetStore.getState().data[0][0].value).toBe('test');
  });

  it('handles undo/redo operations', () => {
    act(() => {
      useSpreadsheetStore.getState().addRow();
      useSpreadsheetStore.getState().addColumn();
      useSpreadsheetStore.getState().updateCell(0, 0, 'test');
      useSpreadsheetStore.getState().undo();
    });
    expect(useSpreadsheetStore.getState().data[0][0].value).toBe('');
  });
});
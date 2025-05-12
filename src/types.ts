import { Cell, Column, ResponseFormat, ResponseStructure, AIProvider, Settings, SpreadsheetState } from './types';

export interface Filter {
  column: number;
  type: 'text' | 'number' | 'date' | 'boolean';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'empty' | 'notEmpty';
  value: string;
  value2?: string; // For 'between' operator
}

export interface SpreadsheetStore extends SpreadsheetState {
  filters: Filter[];
  setData: (data: Cell[][]) => void;
  updateCell: (row: number, col: number, value: string) => void;
  setSelectedCell: (row: number | null, col: number | null) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  updatePrompt: (colIndex: number, prompt: string) => void;
  processColumn: (colIndex: number) => Promise<void>;
  addColumn: () => void;
  addRow: () => void;
  deleteRow: (rowIndex: number) => void;
  deleteColumn: (colIndex: number) => void;
  updateColumnName: (colIndex: number, name: string) => void;
  updateColumnWidth: (colIndex: number, width: number) => void;
  undo: () => void;
  redo: () => void;
  importData: (data: string[][], headers?: string[]) => void;
  toggleColumnProcessing: (colIndex: number) => void;
  addFilter: (filter: Filter) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  getFilteredData: () => Cell[][];
}
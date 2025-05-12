import React, { useCallback, useEffect, useState } from 'react';
import { useSpreadsheetStore } from '../store';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export const Grid: React.FC = () => {
  const {
    data,
    columns,
    selectedCell,
    setSelectedCell,
    updateCell,
    updateColumnName,
    updateColumnWidth,
    addRow,
    deleteRow,
    deleteColumn,
    getFilteredData,
  } = useSpreadsheetStore();

  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [showDeleteColumn, setShowDeleteColumn] = useState<number | null>(null);
  const [showDeleteRow, setShowDeleteRow] = useState<number | null>(null);

  const filteredData = getFilteredData();

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell(row, col);
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    updateCell(row, col, value);
  };

  const handleColumnResize = useCallback((e: MouseEvent) => {
    if (resizingColumn === null) return;

    const diff = e.clientX - startX;
    const newWidth = Math.max(100, startWidth + diff);
    updateColumnWidth(resizingColumn, newWidth);
  }, [resizingColumn, startX, startWidth, updateColumnWidth]);

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null);
  }, []);

  useEffect(() => {
    if (resizingColumn !== null) {
      window.addEventListener('mousemove', handleColumnResize);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleColumnResize);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingColumn, handleColumnResize, handleResizeEnd]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    
    switch (e.key) {
      case 'ArrowUp':
        if (row > 0) setSelectedCell(row - 1, col);
        break;
      case 'ArrowDown':
        if (row < filteredData.length - 1) setSelectedCell(row + 1, col);
        else if (row === filteredData.length - 1) addRow();
        break;
      case 'ArrowLeft':
        if (col > 0) setSelectedCell(row, col - 1);
        break;
      case 'ArrowRight':
        if (col < columns.length - 1) setSelectedCell(row, col + 1);
        break;
      case 'Delete':
        if (e.shiftKey && selectedCell) {
          if (e.ctrlKey || e.metaKey) {
            deleteColumn(col);
          } else {
            deleteRow(row);
          }
        }
        break;
    }
  }, [selectedCell, filteredData.length, columns.length, setSelectedCell, addRow, deleteRow, deleteColumn]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="overflow-auto flex-1 bg-gray-50 dark:bg-gray-900">
      <div className="inline-block min-w-full">
        <div className="grid" style={{
          gridTemplateColumns: `40px ${columns.map(col => `${col.width}px`).join(' ')}`
        }}>
          {/* Column headers */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 h-[72px]" />
          {columns.map((column, index) => (
            <div
              key={column.id}
              className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 group relative"
              style={{ width: column.width }}
              onMouseEnter={() => setShowDeleteColumn(index)}
              onMouseLeave={() => setShowDeleteColumn(null)}
            >
              <div className="p-2">
                <input
                  type="text"
                  className="w-full font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 dark:text-white"
                  value={column.name}
                  onChange={(e) => updateColumnName(index, e.target.value)}
                />
                <input
                  type="text"
                  className="w-full mt-1 text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-gray-500 dark:text-gray-400"
                  placeholder="Enter prompt..."
                  value={column.prompt}
                  onChange={(e) => useSpreadsheetStore.getState().updatePrompt(index, e.target.value)}
                />
              </div>
              {showDeleteColumn === index && columns.length > 1 && (
                <button
                  onClick={() => deleteColumn(index)}
                  className="absolute top-1 right-1 p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 bg-white/90 dark:bg-gray-800/90 rounded transition-colors"
                  title="Supprimer la colonne"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div
                data-testid="resize-handle"
                role="separator"
                className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize group-hover:bg-blue-500"
                onMouseDown={(e) => {
                  setResizingColumn(index);
                  setStartX(e.clientX);
                  setStartWidth(column.width);
                }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                  <GripVertical className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            </div>
          ))}

          {/* Row headers and cells */}
          {filteredData.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              <div 
                className="sticky left-0 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 h-9 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 relative group"
                onMouseEnter={() => setShowDeleteRow(rowIndex)}
                onMouseLeave={() => setShowDeleteRow(null)}
              >
                <span>{rowIndex + 1}</span>
                {showDeleteRow === rowIndex && filteredData.length > 1 && (
                  <button
                    onClick={() => deleteRow(rowIndex)}
                    className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    title="Supprimer la ligne"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  role="cell"
                  className={clsx(
                    'border-b border-r border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 h-9',
                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex && 'ring-2 ring-blue-500 ring-inset'
                  )}
                  style={{ width: columns[colIndex].width }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? (
                    <input
                      type="text"
                      className="w-full h-full px-1 bg-transparent border-none focus:outline-none dark:text-white"
                      value={cell.value}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <div className="px-1 truncate dark:text-white">{cell.value}</div>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}

          {/* Add row button */}
          <div
            className="sticky left-0 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 p-2 col-span-full hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 h-9"
            onClick={addRow}
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="text-sm">Add row</span>
          </div>
        </div>
      </div>
    </div>
  );
};
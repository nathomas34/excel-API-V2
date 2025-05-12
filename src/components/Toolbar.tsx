import React, { useState } from 'react';
import { Upload, Download, Undo2, Redo2, Play, Settings, Plus, FileSpreadsheet, FileText, File as FilePdf, Globe, Database, Import as FileImport, Filter } from 'lucide-react';
import Papa from 'papaparse';
import { useSpreadsheetStore } from '../store';
import { processFile, exportToExcel } from '../utils/fileProcessors';
import { ApiConfigModal } from './ApiConfigModal';
import { FilterModal } from './FilterModal';
import { getStoredApiData, exportDataToApi } from '../utils/apiProcessor';

interface ToolbarProps {
  onOpenSettings: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onOpenSettings }) => {
  const { undo, redo, importData, data, columns, addRow, addColumn, toggleColumnProcessing } = useSpreadsheetStore();
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const storedData = getStoredApiData();

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv') {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            const headers = results.meta.fields || [];
            const data = results.data as Record<string, string>[];
            const formattedData = data.map(row => headers.map(header => row[header] || ''));
            importData(formattedData, headers);
          },
        });
      } else {
        const { headers, data } = await processFile(file);
        importData(data, headers);
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Une erreur est survenue lors de l\'import du fichier. Vérifiez que le format est supporté.');
    }
  };

  const handleExport = () => {
    const format = window.prompt('Choisissez le format d\'export (csv/excel):', 'csv');
    
    if (format?.toLowerCase() === 'excel') {
      exportToExcel(data, columns);
    } else {
      const headers = columns.map(col => col.name);
      const csvData = data.map(row => row.map(cell => cell.value));
      const csv = Papa.unparse({
        fields: headers,
        data: csvData,
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'export_tableur.csv';
      link.click();
    }
  };

  const handleProcessAll = () => {
    columns.forEach((_, index) => {
      if (columns[index].prompt) {
        toggleColumnProcessing(index);
      }
    });
  };

  const handleQuickExport = async () => {
    if (!storedData) {
      setIsApiModalOpen(true);
      return;
    }

    try {
      await exportDataToApi(storedData.data);
      alert('Export réussi !');
    } catch (error) {
      alert('Erreur lors de l\'export : ' + (error instanceof Error ? error.message : 'Une erreur est survenue'));
    }
  };

  return (
    <>
      <div className="flex items-center bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-12">
        <div className="flex items-center border-r border-gray-200 dark:border-gray-700 h-full">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.ods,.docx,.doc,.pdf"
            onChange={handleFileImport}
            className="hidden"
            id="file-import"
          />
          <label
            htmlFor="file-import"
            className="h-full px-3 inline-flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 gap-2"
            title="Importer un fichier"
          >
            <Upload className="w-5 h-5" />
            <div className="flex gap-1">
              <FileSpreadsheet className="w-4 h-4" title="Excel/OpenOffice" />
              <FileText className="w-4 h-4" title="Word" />
              <FilePdf className="w-4 h-4" title="PDF" />
            </div>
          </label>
          <button
            onClick={() => setIsApiModalOpen(true)}
            className="h-full px-3 inline-flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 gap-2"
            title="Configurer les API"
          >
            <FileImport className="w-5 h-5" />
            <span className="text-sm font-medium">API Import</span>
          </button>
          <button
            onClick={handleQuickExport}
            className="h-full px-3 inline-flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 gap-2"
            title="Export rapide vers l'API"
          >
            <Database className="w-5 h-5" />
            <span className="text-sm font-medium">Export API</span>
          </button>
          <button
            onClick={handleExport}
            className="h-full px-3 inline-flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            title="Exporter (CSV/Excel)"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center border-r border-gray-200 dark:border-gray-700 h-full">
          <button
            onClick={undo}
            className="h-full px-3 inline-flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            title="Annuler"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            className="h-full px-3 inline-flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            title="Rétablir"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center h-full">
          <button
            onClick={addRow}
            className="h-full px-3 inline-flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            title="Ajouter une ligne"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Ligne</span>
          </button>
          <button
            onClick={addColumn}
            className="h-full px-3 inline-flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            title="Ajouter une colonne"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Colonne</span>
          </button>
        </div>

        <div className="flex items-center border-r border-gray-200 dark:border-gray-700 h-full">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="h-full px-3 inline-flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 gap-2"
            title="Filtres intelligents"
          >
            <Filter className="w-5 h-5" />
            <span className="text-sm font-medium">Filtres</span>
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center border-l border-gray-200 dark:border-gray-700 h-full">
          <button
            onClick={handleProcessAll}
            className="h-full px-3 inline-flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            title="Traiter toutes les colonnes"
          >
            <Play className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenSettings}
            className="h-full px-3 inline-flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            title="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <ApiConfigModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />
    </>
  );
};
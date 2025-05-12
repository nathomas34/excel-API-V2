import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Play, Download, Upload } from 'lucide-react';
import { useSpreadsheetStore } from '../store';
import { processApiResponse, getStoredApiData, exportDataToApi, saveExportConfig, getExportConfig } from '../utils/apiProcessor';
import { exportToExcel } from '../utils/fileProcessors';
import Papa from 'papaparse';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose }) => {
  const { importData } = useSpreadsheetStore();
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);
  const [dataPath, setDataPath] = useState('');
  const [headerMapping, setHeaderMapping] = useState<{ original: string; mapped: string }[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [storedData, setStoredData] = useState(getStoredApiData());
  
  // Configuration d'export
  const [showExportConfig, setShowExportConfig] = useState(false);
  const [exportUrl, setExportUrl] = useState('');
  const [exportMethod, setExportMethod] = useState<'POST' | 'PUT'>('POST');
  const [exportHeaders, setExportHeaders] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportDataKey, setExportDataKey] = useState('');

  useEffect(() => {
    const stored = getStoredApiData();
    if (stored) {
      setStoredData(stored);
      setUrl(stored.config.url);
      setMethod(stored.config.method);
      setHeaders(Object.entries(stored.config.headers || {}).map(([key, value]) => ({ key, value: String(value) })));
      setDataPath(stored.config.dataPath || '');
      setBody(stored.config.body ? JSON.stringify(stored.config.body, null, 2) : '');
    }

    const exportConfig = getExportConfig();
    if (exportConfig) {
      setExportUrl(exportConfig.url);
      setExportMethod(exportConfig.method);
      setExportHeaders(Object.entries(exportConfig.headers || {}).map(([key, value]) => ({ key, value: String(value) })));
      setExportFormat(exportConfig.format || 'json');
      setExportDataKey(exportConfig.dataKey || '');
    }
  }, []);

  const addHeader = (type: 'import' | 'export') => {
    if (type === 'export') {
      setExportHeaders([...exportHeaders, { key: '', value: '' }]);
    } else {
      setHeaders([...headers, { key: '', value: '' }]);
    }
  };

  const removeHeader = (index: number, type: 'import' | 'export') => {
    if (type === 'export') {
      setExportHeaders(exportHeaders.filter((_, i) => i !== index));
    } else {
      setHeaders(headers.filter((_, i) => i !== index));
    }
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string, type: 'import' | 'export') => {
    if (type === 'export') {
      const newHeaders = [...exportHeaders];
      newHeaders[index][field] = value;
      setExportHeaders(newHeaders);
    } else {
      const newHeaders = [...headers];
      newHeaders[index][field] = value;
      setHeaders(newHeaders);
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');

      const config = {
        url,
        method,
        headers: Object.fromEntries(
          headers
            .filter(h => h.key && h.value)
            .map(h => [h.key, h.value])
        ),
        body: body ? JSON.parse(body) : undefined,
        dataPath: dataPath || undefined,
        headerMapping: Object.fromEntries(
          headerMapping
            .filter(m => m.original && m.mapped)
            .map(m => [m.original, m.mapped])
        )
      };

      const { headers: responseHeaders, data } = await processApiResponse(config);
      importData(data, responseHeaders);
      setStoredData(getStoredApiData());
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'api') => {
    if (!storedData) return;

    if (format === 'api') {
      const exportConfig = {
        url: exportUrl,
        method: exportMethod,
        headers: Object.fromEntries(
          exportHeaders
            .filter(h => h.key && h.value)
            .map(h => [h.key, h.value])
        ),
        format: exportFormat,
        dataKey: exportDataKey
      };

      saveExportConfig(exportConfig);

      exportDataToApi(storedData.data).catch(error => {
        setError(error instanceof Error ? error.message : 'Erreur lors de l\'export vers l\'API');
      });
    } else if (format === 'excel') {
      const data = storedData.data.data.map(row => 
        row.map(cell => ({ value: cell, isEditing: false }))
      );
      const columns = storedData.data.headers.map(header => ({
        id: crypto.randomUUID(),
        name: header,
        prompt: '',
        isProcessing: false,
        width: 200
      }));
      exportToExcel(data, columns);
    } else {
      const csv = Papa.unparse({
        fields: storedData.data.headers,
        data: storedData.data.data
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'export_api_data.csv';
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[800px] max-w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-white">Configuration de l'API</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* URL et Méthode */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL de l'API
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.exemple.com/data"
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Méthode
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          {/* En-têtes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                En-têtes
              </label>
              <button
                onClick={() => addHeader('import')}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {headers.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value, 'import')}
                    placeholder="Clé"
                    className="flex-1 px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value, 'import')}
                    placeholder="Valeur"
                    className="flex-1 px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => removeHeader(index, 'import')}
                    className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Corps de la requête */}
          {method !== 'GET' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Corps de la requête (JSON)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                placeholder={'{\n  "key": "value"\n}'}
              />
            </div>
          )}

          {/* Chemin des données */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chemin des données
            </label>
            <input
              type="text"
              value={dataPath}
              onChange={(e) => setDataPath(e.target.value)}
              placeholder="data.results"
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Chemin pour accéder au tableau de données dans la réponse (ex: "data.results")
            </p>
          </div>

          {/* Configuration d'export */}
          {storedData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Export des données
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('csv')}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Excel
                  </button>
                  <button
                    onClick={() => setShowExportConfig(!showExportConfig)}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-4 h-4" />
                    API
                  </button>
                </div>
              </div>

              {showExportConfig && (
                <div className="space-y-4 border rounded-lg p-4 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Configuration de l'export API
                  </h4>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL de l'API d'export
                      </label>
                      <input
                        type="text"
                        value={exportUrl}
                        onChange={(e) => setExportUrl(e.target.value)}
                        placeholder="https://api.exemple.com/export"
                        className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Méthode
                      </label>
                      <select
                        value={exportMethod}
                        onChange={(e) => setExportMethod(e.target.value as 'POST' | 'PUT')}
                        className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        En-têtes d'export
                      </label>
                      <button
                        onClick={() => addHeader('export')}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter
                      </button>
                    </div>
                    <div className="space-y-2">
                      {exportHeaders.map((header, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={header.key}
                            onChange={(e) => updateHeader(index, 'key', e.target.value, 'export')}
                            placeholder="Clé"
                            className="flex-1 px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <input
                            type="text"
                            value={header.value}
                            onChange={(e) => updateHeader(index, 'value', e.target.value, 'export')}
                            placeholder="Valeur"
                            className="flex-1 px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => removeHeader(index, 'export')}
                            className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Format des données
                      </label>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                        className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Clé des données
                      </label>
                      <input
                        type="text"
                        value={exportDataKey}
                        onChange={(e) => setExportDataKey(e.target.value)}
                        placeholder="data"
                        className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Optionnel. Clé pour envelopper les données (ex: {"{ data: [...] }"})
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleExport('api')}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Exporter vers l'API
                    </button>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 dark:text-gray-400">
                Dernière mise à jour : {new Date(storedData.timestamp).toLocaleString()}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Importer les données
          </button>
        </div>
      </div>
    </div>
  );
};
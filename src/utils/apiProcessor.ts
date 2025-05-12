import axios from 'axios';
import { ProcessedData } from './fileProcessors';
import { Cell } from '../types';

interface ApiConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  dataPath?: string;
  headerMapping?: Record<string, string>;
}

interface StoredApiData {
  config: ApiConfig;
  data: ProcessedData;
  timestamp: number;
}

interface ExportConfig {
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  format?: 'json' | 'csv';
  dataKey?: string;
}

const STORAGE_KEY = 'api_data';
const EXPORT_CONFIG_KEY = 'api_export_config';

export const saveApiDataToStorage = (config: ApiConfig, data: ProcessedData) => {
  const storedData: StoredApiData = {
    config,
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
};

export const getStoredApiData = (): StoredApiData | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveExportConfig = (config: ExportConfig) => {
  localStorage.setItem(EXPORT_CONFIG_KEY, JSON.stringify(config));
};

export const getExportConfig = (): ExportConfig | null => {
  const stored = localStorage.getItem(EXPORT_CONFIG_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const processApiResponse = async (config: ApiConfig): Promise<ProcessedData> => {
  try {
    const response = await axios({
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.method !== 'GET' ? config.body : undefined
    });

    let data = response.data;
    if (config.dataPath) {
      const paths = config.dataPath.split('.');
      for (const path of paths) {
        data = data[path];
      }
    }

    if (!Array.isArray(data)) {
      throw new Error('Les données de l\'API doivent être un tableau');
    }

    const firstItem = data[0];
    const headers = Object.keys(firstItem).map(key => 
      config.headerMapping?.[key] || key
    );

    const rows = data.map(item =>
      headers.map(header => {
        const originalHeader = Object.keys(config.headerMapping || {})
          .find(key => config.headerMapping?.[key] === header) || header;
        return String(item[originalHeader] || '');
      })
    );

    const processedData = {
      headers,
      data: rows
    };

    saveApiDataToStorage(config, processedData);

    return processedData;
  } catch (error) {
    console.error('Erreur lors de la récupération des données de l\'API:', error);
    throw new Error('Impossible de récupérer les données de l\'API');
  }
};

export const exportDataToApi = async (data: Cell[][], headers: string[]): Promise<void> => {
  const config = getExportConfig();
  if (!config) {
    throw new Error('Configuration d\'export non trouvée');
  }

  try {
    let exportData;
    if (config.format === 'csv') {
      const Papa = await import('papaparse');
      exportData = Papa.default.unparse({
        fields: headers,
        data: data.map(row => row.map(cell => cell.value))
      });
    } else {
      exportData = data.map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = row[index].value;
        });
        return obj;
      });
    }

    const payload = config.dataKey 
      ? { [config.dataKey]: exportData }
      : exportData;

    await axios({
      method: config.method,
      url: config.url,
      headers: {
        'Content-Type': config.format === 'csv' ? 'text/csv' : 'application/json',
        ...config.headers
      },
      data: payload
    });
  } catch (error) {
    console.error('Erreur lors de l\'export des données:', error);
    throw new Error('Impossible d\'exporter les données vers l\'API');
  }
};
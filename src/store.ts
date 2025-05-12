import { create } from 'zustand';
import { SpreadsheetStore, Settings, ResponseFormat, ResponseStructure, AIProvider, Filter } from './types';
import OpenAI from 'openai';
import MistralClient from '@mistralai/mistralai';

const INITIAL_ROWS = 5;
const INITIAL_COLS = 3;
const DEFAULT_COLUMN_WIDTH = 200;

const loadSettings = (): Settings => {
  const storedSettings = Object.fromEntries(
    ['theme', 'language', 'aiProvider', 'geminiApiKey', 'openaiApiKey', 'mistralApiKey', 'aiModel', 'temperature', 'maxTokens', 'autoSave', 'processingDelay', 'rateLimit', 'responseFormat', 'responseStructure']
      .map(key => [key, localStorage.getItem(`settings.${key}`)])
      .filter(([_, value]) => value !== null)
  );

  const responseStructure: ResponseStructure = storedSettings.responseStructure 
    ? JSON.parse(storedSettings.responseStructure)
    : {
        title: true,
        description: true,
        keywords: false,
        categories: false,
        summary: false,
        analysis: false,
        custom: [],
      };

  return {
    aiProvider: (storedSettings.aiProvider as AIProvider) || 'gemini',
    geminiApiKey: storedSettings.geminiApiKey || '',
    openaiApiKey: storedSettings.openaiApiKey || '',
    mistralApiKey: storedSettings.mistralApiKey || '',
    aiModel: (storedSettings.aiModel as Settings['aiModel']) || 'gemini-pro',
    temperature: Number(storedSettings.temperature) || 0.7,
    maxTokens: Number(storedSettings.maxTokens) || 2048,
    autoSave: storedSettings.autoSave === 'true',
    theme: (storedSettings.theme as Settings['theme']) || 'system',
    language: (storedSettings.language as Settings['language']) || 'fr',
    processingDelay: Number(storedSettings.processingDelay) || 1000,
    rateLimit: Number(storedSettings.rateLimit) || 60,
    requestCount: 0,
    lastRequestTime: Date.now(),
    responseFormat: (storedSettings.responseFormat as ResponseFormat) || 'text',
    responseStructure,
  };
};

const DEFAULT_SETTINGS = loadSettings();

const createInitialData = (rows: number, cols: number) => {
  return Array(rows).fill(null).map(() =>
    Array(cols).fill(null).map(() => ({ value: '', isEditing: false }))
  );
};

const createInitialColumns = (cols: number) => {
  return Array(cols).fill(null).map((_, index) => ({
    id: crypto.randomUUID(),
    name: `Colonne ${index + 1}`,
    prompt: '',
    isProcessing: false,
    width: DEFAULT_COLUMN_WIDTH,
  }));
};

const checkRateLimit = (settings: Settings): { canProceed: boolean; waitTime: number } => {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  
  if (now - settings.lastRequestTime >= oneMinute) {
    return { canProceed: true, waitTime: 0 };
  }
  
  if (settings.requestCount >= settings.rateLimit) {
    const waitTime = oneMinute - (now - settings.lastRequestTime);
    return { canProceed: false, waitTime };
  }
  
  return { canProceed: true, waitTime: 0 };
};

function formatPromptWithStructure(basePrompt: string, input: string, settings: Settings): string {
  const { responseFormat, responseStructure } = settings;
  
  let structurePrompt = 'Format de réponse souhaité:\n';
  
  switch (responseFormat) {
    case 'json':
      structurePrompt += '- Répondre en JSON valide uniquement\n';
      break;
    case 'html':
      structurePrompt += '- Répondre en HTML valide uniquement\n';
      break;
    case 'csv':
      structurePrompt += '- Répondre en format CSV (valeurs séparées par des virgules)\n';
      break;
    default:
      structurePrompt += '- Répondre en texte simple\n';
  }

  structurePrompt += '\nStructure de la réponse:\n';
  if (responseStructure.title) structurePrompt += '- Inclure un titre\n';
  if (responseStructure.description) structurePrompt += '- Inclure une description\n';
  if (responseStructure.keywords) structurePrompt += '- Inclure des mots-clés\n';
  if (responseStructure.categories) structurePrompt += '- Inclure des catégories\n';
  if (responseStructure.summary) structurePrompt += '- Inclure un résumé\n';
  if (responseStructure.analysis) structurePrompt += '- Inclure une analyse\n';
  if (responseStructure.custom?.length) {
    structurePrompt += '\nChamps personnalisés à inclure:\n';
    responseStructure.custom.forEach(field => {
      structurePrompt += `- ${field}\n`;
    });
  }

  return `${structurePrompt}\n${basePrompt}\n\nInput: ${input}\n\nRéponse:`;
}

async function processWithGemini(prompt: string, input: string, settings: Settings, updateSettings: (settings: Partial<Settings>) => void) {
  if (!settings.geminiApiKey?.trim()) {
    return 'Pour commencer, veuillez configurer votre clé API Gemini dans les paramètres (icône ⚙️). Vous pouvez obtenir une clé gratuite sur Google AI Studio.';
  }

  const { canProceed, waitTime } = checkRateLimit(settings);
  
  if (!canProceed) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return processWithGemini(prompt, input, settings, updateSettings);
  }

  try {
    const now = Date.now();
    updateSettings({
      requestCount: settings.requestCount + 1,
      lastRequestTime: now
    });

    const formattedPrompt = formatPromptWithStructure(prompt, input, settings);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${settings.geminiApiKey.trim()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: formattedPrompt
          }]
        }],
        generationConfig: {
          temperature: settings.temperature,
          maxOutputTokens: settings.maxTokens,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur API Gemini:', errorData);
      
      if (errorData.error?.message) {
        if (errorData.error.message.includes('API key not valid')) {
          return 'La clé API n\'est pas valide. Veuillez vérifier que vous avez copié la clé complète depuis Google AI Studio et qu\'elle est correctement collée dans les paramètres (icône ⚙️).';
        } else if (errorData.error.message.includes('quota')) {
          return 'Quota d\'API dépassé. Veuillez réessayer plus tard ou vérifier les limites de votre compte Google AI Studio.';
        }
      }
      
      return 'Erreur lors du traitement : veuillez vérifier votre clé API et réessayer.';
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    
    if (data.promptFeedback?.blockReason) {
      return `Contenu bloqué par les règles de sécurité de l'IA : ${data.promptFeedback.blockReason}`;
    }

    return 'Pas de réponse de l\'IA. Veuillez reformuler votre demande.';
  } catch (error) {
    console.error('Erreur lors du traitement avec Gemini:', error);
    return 'Erreur de communication avec l\'IA. Veuillez vérifier votre connexion internet et réessayer.';
  }
}

async function processWithChatGPT(prompt: string, input: string, settings: Settings, updateSettings: (settings: Partial<Settings>) => void) {
  if (!settings.openaiApiKey?.trim()) {
    return 'Pour commencer, veuillez configurer votre clé API OpenAI dans les paramètres (icône ⚙️).';
  }

  const { canProceed, waitTime } = checkRateLimit(settings);
  
  if (!canProceed) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return processWithChatGPT(prompt, input, settings, updateSettings);
  }

  try {
    const now = Date.now();
    updateSettings({
      requestCount: settings.requestCount + 1,
      lastRequestTime: now
    });

    const formattedPrompt = formatPromptWithStructure(prompt, input, settings);

    const openai = new OpenAI({
      apiKey: settings.openaiApiKey.trim(),
      dangerouslyAllowBrowser: true
    });

    const completion = await openai.chat.completions.create({
      model: settings.aiModel === 'gpt-4' ? 'gpt-4' : 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant expert en analyse et traitement de données.'
        },
        {
          role: 'user',
          content: formattedPrompt
        }
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens
    });

    return completion.choices[0]?.message?.content?.trim() || 'Pas de réponse de l\'IA. Veuillez reformuler votre demande.';
  } catch (error) {
    console.error('Erreur lors du traitement avec ChatGPT:', error);
    
    if (error instanceof OpenAI.APIError) {
      if (error.code === 'invalid_api_key') {
        return 'La clé API OpenAI n\'est pas valide. Veuillez vérifier votre clé dans les paramètres.';
      } else if (error.code === 'insufficient_quota') {
        return 'Quota d\'API dépassé. Veuillez vérifier votre abonnement OpenAI.';
      }
    }
    
    return 'Erreur de communication avec l\'IA. Veuillez vérifier votre connexion internet et réessayer.';
  }
}

async function processWithMistral(prompt: string, input: string, settings: Settings, updateSettings: (settings: Partial<Settings>) => void) {
  if (!settings.mistralApiKey?.trim()) {
    return 'Pour commencer, veuillez configurer votre clé API Mistral dans les paramètres (icône ⚙️).';
  }

  const { canProceed, waitTime } = checkRateLimit(settings);
  
  if (!canProceed) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return processWithMistral(prompt, input, settings, updateSettings);
  }

  try {
    const now = Date.now();
    updateSettings({
      requestCount: settings.requestCount + 1,
      lastRequestTime: now
    });

    const formattedPrompt = formatPromptWithStructure(prompt, input, settings);

    const client = new MistralClient(settings.mistralApiKey.trim());

    const chatResponse = await client.chat({
      model: settings.aiModel,
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant expert en analyse et traitement de données.'
        },
        {
          role: 'user',
          content: formattedPrompt
        }
      ],
      temperature: settings.temperature,
      maxTokens: settings.maxTokens
    });

    return chatResponse.choices[0]?.message?.content?.trim() || 'Pas de réponse de l\'IA. Veuillez reformuler votre demande.';
  } catch (error) {
    console.error('Erreur lors du traitement avec Mistral:', error);
    
    if (error.message?.includes('Invalid API key')) {
      return 'La clé API Mistral n\'est pas valide. Veuillez vérifier votre clé dans les paramètres.';
    } else if (error.message?.includes('quota')) {
      return 'Quota d\'API dépassé. Veuillez vérifier votre abonnement Mistral.';
    }
    
    return 'Erreur de communication avec l\'IA. Veuillez vérifier votre connexion internet et réessayer.';
  }
}

export const useSpreadsheetStore = create<SpreadsheetStore>((set, get) => ({
  data: createInitialData(INITIAL_ROWS, INITIAL_COLS),
  columns: createInitialColumns(INITIAL_COLS),
  selectedCell: null,
  settings: DEFAULT_SETTINGS,
  history: [createInitialData(INITIAL_ROWS, INITIAL_COLS)],
  historyIndex: 0,
  filters: [],

  setData: (data) => set({ data }),
  
  updateCell: (row, col, value) => {
    const newData = [...get().data];
    newData[row][col] = { ...newData[row][col], value };
    
    const newHistory = [...get().history.slice(0, get().historyIndex + 1), newData];
    set({
      data: newData,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  setSelectedCell: (row, col) => set({
    selectedCell: row !== null && col !== null ? { row, col } : null
  }),

  updateSettings: (newSettings) => {
    const settings = { ...get().settings, ...newSettings };
    
    Object.entries(newSettings).forEach(([key, value]) => {
      if (typeof value !== 'function' && key !== 'requestCount' && key !== 'lastRequestTime') {
        if (key === 'responseStructure') {
          localStorage.setItem(`settings.${key}`, JSON.stringify(value));
        } else {
          localStorage.setItem(`settings.${key}`, String(value));
        }
      }
    });
    
    set({ settings });
  },

  updatePrompt: (colIndex, prompt) => {
    const newColumns = [...get().columns];
    newColumns[colIndex] = { ...newColumns[colIndex], prompt };
    set({ columns: newColumns });
  },

  processColumn: async (colIndex) => {
    const { columns, data, settings, updateSettings } = get();
    const column = columns[colIndex];
    const prompt = column.prompt;

    if (!prompt?.trim()) {
      const newData = [...data];
      newData[0][colIndex] = { 
        value: 'Veuillez d\'abord entrer un prompt dans l\'en-tête de la colonne.',
        isEditing: false 
      };
      set({ data: newData });
      return;
    }

    const newColumns = [...columns];
    newColumns[colIndex] = { ...column, isProcessing: true };
    set({ columns: newColumns });

    try {
      const newData = [...data];
      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const input = data[rowIndex][colIndex].value;
        if (input?.trim()) {
          let result;
          switch (settings.aiProvider) {
            case 'chatgpt':
              result = await processWithChatGPT(prompt, input, settings, updateSettings);
              break;
            case 'mistral':
              result = await processWithMistral(prompt, input, settings, updateSettings);
              break;
            default:
              result = await processWithGemini(prompt, input, settings, updateSettings);
          }

          newData[rowIndex][colIndex] = { value: result, isEditing: false };
          set({ data: newData });
          
          if (settings.processingDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, settings.processingDelay));
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la colonne:', error);
      const newData = [...data];
      newData[0][colIndex] = { 
        value: 'Une erreur est survenue lors du traitement. Veuillez réessayer.',
        isEditing: false 
      };
      set({ data: newData });
    } finally {
      newColumns[colIndex] = { ...column, isProcessing: false };
      set({ columns: newColumns });
    }
  },

  addColumn: () => {
    const { columns, data } = get();
    const newColumns = [...columns, {
      id: crypto.randomUUID(),
      name: `Colonne ${columns.length + 1}`,
      prompt: '',
      isProcessing: false,
      width: DEFAULT_COLUMN_WIDTH,
    }];
    
    const newData = data.map(row => [...row, { value: '', isEditing: false }]);
    set({ columns: newColumns, data: newData });
  },

  addRow: () => {
    const { data, columns } = get();
    const newRow = Array(columns.length).fill(null).map(() => ({ value: '', isEditing: false }));
    set({ data: [...data, newRow] });
  },

  updateColumnName: (colIndex, name) => {
    const newColumns = [...get().columns];
    newColumns[colIndex] = { ...newColumns[colIndex], name };
    set({ columns: newColumns });
  },

  updateColumnWidth: (colIndex, width) => {
    const newColumns = [...get().columns];
    newColumns[colIndex] = { ...newColumns[colIndex], width };
    set({ columns: newColumns });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      set({
        data: history[historyIndex - 1],
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      set({
        data: history[historyIndex + 1],
        historyIndex: historyIndex + 1,
      });
    }
  },

  importData: (csvData, headers) => {
    const newColumns = headers 
      ? headers.map((name, index) => ({
          id: crypto.randomUUID(),
          name,
          prompt: '',
          isProcessing: false,
          width: DEFAULT_COLUMN_WIDTH,
        }))
      : csvData[0].map((_, index) => ({
          id: crypto.randomUUID(),
          name: `Colonne ${index + 1}`,
          prompt: '',
          isProcessing: false,
          width: DEFAULT_COLUMN_WIDTH,
        }));

    const newData = csvData.map(row =>
      row.map(cell => ({ value: cell, isEditing: false }))
    );

    set({
      columns: newColumns,
      data: newData,
      history: [newData],
      historyIndex: 0,
    });
  },

  toggleColumnProcessing: (colIndex) => {
    const { columns, processColumn } = get();
    const column = columns[colIndex];
    
    if (column.isProcessing) {
      const newColumns = [...columns];
      newColumns[colIndex] = { ...column, isProcessing: false };
      set({ columns: newColumns });
    } else {
      processColumn(colIndex);
    }
  },

  deleteRow: (rowIndex: number) => {
    const { data, history, historyIndex } = get();
    const newData = [...data];
    newData.splice(rowIndex, 1);
    
    const newHistory = [...history.slice(0, historyIndex + 1), newData];
    set({
      data: newData,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedCell: null,
    });
  },

  deleteColumn: (colIndex: number) => {
    const { data, columns, history, historyIndex } = get();
    const newColumns = [...columns];
    newColumns.splice(colIndex, 1);
    
    const newData = data.map(row => {
      const newRow = [...row];
      newRow.splice(colIndex, 1);
      return newRow;
    });
    
    const newHistory = [...history.slice(0, historyIndex + 1), newData];
    set({
      columns: newColumns,
      data: newData,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedCell: null,
    });
  },

  addFilter: (filter: Filter) => {
    const filters = [...get().filters, filter];
    set({ filters });
  },

  removeFilter: (index: number) => {
    const filters = get().filters.filter((_, i) => i !== index);
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: [] });
  },

  getFilteredData: () => {
    const { data, filters } = get();
    
    if (filters.length === 0) return data;

    return data.filter(row => {
      return filters.every(filter => {
        const cellValue = row[filter.column].value;

        switch (filter.type) {
          case 'text':
            switch (filter.operator) {
              case 'contains':
                return cellValue.toLowerCase().includes(filter.value.toLowerCase());
              case 'equals':
                return cellValue.toLowerCase() === filter.value.toLowerCase();
              case 'startsWith':
                return cellValue.toLowerCase().startsWith(filter.value.toLowerCase());
              case 'endsWith':
                return cellValue.toLowerCase().endsWith(filter.value.toLowerCase());
              case 'empty':
                return !cellValue.trim();
              case 'notEmpty':
                return cellValue.trim().length > 0;
              default:
                return true;
            }

          case 'number':
            const numValue = parseFloat(cellValue);
            const filterValue = parseFloat(filter.value);
            const filterValue2 = filter.value2 ? parseFloat(filter.value2) : undefined;

            if (isNaN(numValue)) return false;

            switch (filter.operator) {
              case 'equals':
                return numValue === filterValue;
              case 'greaterThan':
                return numValue > filterValue;
              case 'lessThan':
                return numValue < filterValue;
              case 'between':
                return filterValue2 !== undefined && 
                       numValue >= filterValue && 
                       numValue <= filterValue2;
              default:
                return true;
            }

          case 'date':
            const dateValue = new Date(cellValue);
            const filterDate = new Date(filter.value);
            const filterDate2 = filter.value2 ? new Date(filter.value2) : undefined;

            if (isNaN(dateValue.getTime())) return false;

            switch (filter.operator) {
              case 'equals':
                return dateValue.toDateString() === filterDate.toDateString();
              case 'greaterThan':
                return dateValue > filterDate;
              case 'lessThan':
                return dateValue < filterDate;
              case 'between':
                return filterDate2 !== undefined && 
                       dateValue >= filterDate && 
                       dateValue <= filterDate2;
              default:
                return true;
            }

          case 'boolean':
            const boolValue = cellValue.toLowerCase() === 'true';
            return filter.operator === 'equals' && 
                   boolValue === (filter.value.toLowerCase() === 'true');

          default:
            return true;
        }
      });
    });
  },
}));
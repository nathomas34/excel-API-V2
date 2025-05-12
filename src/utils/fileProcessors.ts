import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Cell } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ProcessedData {
  headers: string[];
  data: string[][];
}

// Fonction utilitaire pour nettoyer les données
const cleanData = (data: string[][]): string[][] => {
  return data.map(row => 
    row.map(cell => 
      typeof cell === 'string' ? cell.trim() : String(cell)
    )
  ).filter(row => row.some(cell => cell !== ''));
};

// Traitement des fichiers Excel et OpenOffice
export const processSpreadsheet = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as string[][];
        
        resolve({
          headers: headers.map(h => String(h)),
          data: cleanData(rows)
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
};

// Traitement des fichiers Word
export const processWord = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        // Diviser le texte en paragraphes et tableaux
        const paragraphs = text.split('\n\n').filter(p => p.trim());
        
        // Détecter si le texte contient des tableaux ou est structuré
        const hasTabularData = paragraphs.some(p => p.includes('\t'));
        
        if (hasTabularData) {
          // Traiter comme un tableau
          const rows = paragraphs.map(p => p.split('\t'));
          const headers = rows[0];
          const data = rows.slice(1);
          
          resolve({
            headers: headers.map(h => h.trim()),
            data: cleanData(data)
          });
        } else {
          // Créer une structure avec des colonnes pour le texte
          resolve({
            headers: ['Titre', 'Contenu'],
            data: paragraphs.map((p, i) => [
              `Section ${i + 1}`,
              p.trim()
            ])
          });
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
};

// Traitement des fichiers PDF
export const processPDF = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        
        const textContent: string[] = [];
        const numPages = pdf.numPages;
        
        // Extraire le texte de chaque page
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const text = content.items
            .map((item: any) => item.str)
            .join(' ');
          textContent.push(text);
        }

        // Analyser la structure du texte
        const structuredData = textContent.map((text, pageNum) => {
          const lines = text.split(/[.!?]\s+/);
          return lines.map(line => line.trim()).filter(line => line);
        });

        // Créer une structure de données appropriée
        const data = structuredData.flatMap((pageLines, pageNum) =>
          pageLines.map((line, lineNum) => [
            `Page ${pageNum + 1} - Section ${lineNum + 1}`,
            line
          ])
        );

        resolve({
          headers: ['Section', 'Contenu'],
          data: cleanData(data)
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
};

// Export vers Excel
export const exportToExcel = (data: Cell[][], columns: { name: string }[]) => {
  const headers = columns.map(col => col.name);
  const rows = data.map(row => row.map(cell => cell.value));
  
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Feuille1');
  
  XLSX.writeFile(wb, 'export_tableur.xlsx');
};

// Détecter le type de fichier et traiter en conséquence
export const processFile = async (file: File): Promise<ProcessedData> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'xlsx':
    case 'xls':
    case 'ods':
      return processSpreadsheet(file);
    case 'docx':
    case 'doc':
      return processWord(file);
    case 'pdf':
      return processPDF(file);
    default:
      throw new Error('Format de fichier non supporté');
  }
};
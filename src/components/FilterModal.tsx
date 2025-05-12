import React, { useState } from 'react';
import { X, Plus, Filter } from 'lucide-react';
import { useSpreadsheetStore } from '../store';
import type { Filter as FilterType } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose }) => {
  const { columns, addFilter, filters, removeFilter, clearFilters } = useSpreadsheetStore();
  const [newFilter, setNewFilter] = useState<Partial<FilterType>>({
    column: 0,
    type: 'text',
    operator: 'contains',
    value: ''
  });

  if (!isOpen) return null;

  const handleAddFilter = () => {
    if (newFilter.column !== undefined && newFilter.type && newFilter.operator && newFilter.value) {
      addFilter(newFilter as FilterType);
      setNewFilter({
        column: 0,
        type: 'text',
        operator: 'contains',
        value: ''
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[600px] max-w-full">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
            <Filter className="w-5 h-5" />
            Filtres Intelligents
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Nouveau filtre */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ajouter un filtre
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Colonne
                </label>
                <select
                  value={newFilter.column}
                  onChange={(e) => setNewFilter({ ...newFilter, column: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {columns.map((col, index) => (
                    <option key={col.id} value={index}>{col.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={newFilter.type}
                  onChange={(e) => setNewFilter({ ...newFilter, type: e.target.value as FilterType['type'] })}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="text">Texte</option>
                  <option value="number">Nombre</option>
                  <option value="date">Date</option>
                  <option value="boolean">Booléen</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Opérateur
                </label>
                <select
                  value={newFilter.operator}
                  onChange={(e) => setNewFilter({ ...newFilter, operator: e.target.value as FilterType['operator'] })}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {newFilter.type === 'text' && (
                    <>
                      <option value="contains">Contient</option>
                      <option value="equals">Égal à</option>
                      <option value="startsWith">Commence par</option>
                      <option value="endsWith">Termine par</option>
                      <option value="empty">Vide</option>
                      <option value="notEmpty">Non vide</option>
                    </>
                  )}
                  {(newFilter.type === 'number' || newFilter.type === 'date') && (
                    <>
                      <option value="equals">Égal à</option>
                      <option value="greaterThan">Supérieur à</option>
                      <option value="lessThan">Inférieur à</option>
                      <option value="between">Entre</option>
                    </>
                  )}
                  {newFilter.type === 'boolean' && (
                    <option value="equals">Égal à</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valeur
                </label>
                {newFilter.type === 'boolean' ? (
                  <select
                    value={newFilter.value}
                    onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="true">Vrai</option>
                    <option value="false">Faux</option>
                  </select>
                ) : (
                  <input
                    type={newFilter.type === 'date' ? 'date' : 'text'}
                    value={newFilter.value}
                    onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Entrez une valeur"
                  />
                )}
              </div>
            </div>

            {newFilter.operator === 'between' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valeur 2
                </label>
                <input
                  type={newFilter.type === 'date' ? 'date' : 'text'}
                  value={newFilter.value2 || ''}
                  onChange={(e) => setNewFilter({ ...newFilter, value2: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Entrez la deuxième valeur"
                />
              </div>
            )}

            <button
              onClick={handleAddFilter}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter le filtre
            </button>
          </div>

          {/* Filtres actifs */}
          {filters.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filtres actifs
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Effacer tous les filtres
                </button>
              </div>

              <div className="space-y-2">
                {filters.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                        {columns[filter.column].name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {filter.operator}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {filter.value}
                        {filter.value2 && ` - ${filter.value2}`}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFilter(index)}
                      className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
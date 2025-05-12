import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterModal } from '../components/FilterModal';

describe('FilterModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    render(<FilterModal isOpen={true} onClose={mockOnClose} />);
  });

  it('renders filter configuration form', () => {
    expect(screen.getByText('Filtres Intelligents')).toBeInTheDocument();
    expect(screen.getByText('Ajouter un filtre')).toBeInTheDocument();
  });

  it('adds text filter correctly', async () => {
    const columnSelect = screen.getByLabelText('Colonne');
    const typeSelect = screen.getByLabelText('Type');
    const operatorSelect = screen.getByLabelText('Opérateur');
    const valueInput = screen.getByLabelText('Valeur');
    
    await userEvent.selectOptions(columnSelect, '0');
    await userEvent.selectOptions(typeSelect, 'text');
    await userEvent.selectOptions(operatorSelect, 'contains');
    await userEvent.type(valueInput, 'test');
    
    const addButton = screen.getByText('Ajouter le filtre');
    await userEvent.click(addButton);
    
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('adds number filter correctly', async () => {
    const typeSelect = screen.getByLabelText('Type');
    await userEvent.selectOptions(typeSelect, 'number');
    
    expect(screen.getByText('Supérieur à')).toBeInTheDocument();
    expect(screen.getByText('Inférieur à')).toBeInTheDocument();
  });

  it('adds date filter correctly', async () => {
    const typeSelect = screen.getByLabelText('Type');
    await userEvent.selectOptions(typeSelect, 'date');
    
    const valueInput = screen.getByLabelText('Valeur');
    expect(valueInput).toHaveAttribute('type', 'date');
  });

  it('shows second value input for between operator', async () => {
    const typeSelect = screen.getByLabelText('Type');
    const operatorSelect = screen.getByLabelText('Opérateur');
    
    await userEvent.selectOptions(typeSelect, 'number');
    await userEvent.selectOptions(operatorSelect, 'between');
    
    expect(screen.getByLabelText('Valeur 2')).toBeInTheDocument();
  });

  it('removes filter when delete button is clicked', async () => {
    // Add a filter first
    const valueInput = screen.getByLabelText('Valeur');
    await userEvent.type(valueInput, 'test');
    const addButton = screen.getByText('Ajouter le filtre');
    await userEvent.click(addButton);
    
    // Then remove it
    const deleteButton = screen.getByRole('button', { name: /supprimer/i });
    await userEvent.click(deleteButton);
    
    expect(screen.queryByText('test')).not.toBeInTheDocument();
  });

  it('clears all filters', async () => {
    // Add two filters
    const valueInput = screen.getByLabelText('Valeur');
    await userEvent.type(valueInput, 'test1');
    const addButton = screen.getByText('Ajouter le filtre');
    await userEvent.click(addButton);
    
    await userEvent.clear(valueInput);
    await userEvent.type(valueInput, 'test2');
    await userEvent.click(addButton);
    
    // Clear all filters
    const clearButton = screen.getByText('Effacer tous les filtres');
    await userEvent.click(clearButton);
    
    expect(screen.queryByText('test1')).not.toBeInTheDocument();
    expect(screen.queryByText('test2')).not.toBeInTheDocument();
  });
});
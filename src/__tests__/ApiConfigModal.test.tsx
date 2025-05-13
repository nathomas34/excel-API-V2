import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiConfigModal } from '../components/ApiConfigModal';

describe('ApiConfigModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    render(<ApiConfigModal isOpen={true} onClose={mockOnClose} />);
  });

  it('renders API configuration form', () => {
    expect(screen.getByLabelText('URL de l\'API')).toBeInTheDocument();
    expect(screen.getByLabelText('Méthode')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const urlInput = screen.getByLabelText('URL de l\'API');
    await userEvent.type(urlInput, 'https://api.example.com');
    const submitButton = screen.getByText('Importer les données');
    await userEvent.click(submitButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    const submitButton = screen.getByText('Importer les données');
    await userEvent.click(submitButton);
    expect(screen.getByText('L\'URL de l\'API est requise')).toBeInTheDocument();
  });

  it('handles API export configuration', async () => {
    const exportButton = screen.getByText('Export API');
    await userEvent.click(exportButton);
    expect(screen.getByText('Configuration de l\'export API')).toBeInTheDocument();
  });
});
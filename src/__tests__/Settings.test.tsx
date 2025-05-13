import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from '../components/Settings';

// Mock translations
vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'settings.title': 'Paramètres',
      'settings.buttons.save': 'Sauvegarder',
      'settings.buttons.cancel': 'Annuler'
    }[key] || key)
  })
}));

describe('Settings Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    render(<Settings isOpen={true} onClose={mockOnClose} />);
  });

  it('renders all settings sections', () => {
    expect(screen.getByText('Configuration API')).toBeInTheDocument();
    expect(screen.getByText('Format de Réponse')).toBeInTheDocument();
    expect(screen.getByText('Paramètres du Modèle')).toBeInTheDocument();
  });

  it('updates AI provider settings', async () => {
    const geminiButton = screen.getByText('Google Gemini');
    await userEvent.click(geminiButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Clé API Gemini')).toBeInTheDocument();
    });
  });

  it('handles theme changes', async () => {
    const darkThemeButton = screen.getByText('Sombre');
    await userEvent.click(darkThemeButton);
    
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('saves settings on form submission', async () => {
    const saveButton = screen.getByRole('button', { name: /Sauvegarder/i });
    await userEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
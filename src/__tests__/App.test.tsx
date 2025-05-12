import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('App Component', () => {
  beforeEach(() => {
    render(<App />);
  });

  it('renders the main layout', () => {
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('opens settings modal when settings button is clicked', async () => {
    const settingsButton = screen.getByTitle('Paramètres');
    await userEvent.click(settingsButton);
    expect(screen.getByText('Configuration API')).toBeInTheDocument();
  });

  it('adds a new row when clicking the add row button', async () => {
    const addRowButton = screen.getByTitle('Ajouter une ligne');
    const initialRowCount = screen.getAllByRole('row').length;
    await userEvent.click(addRowButton);
    expect(screen.getAllByRole('row')).toHaveLength(initialRowCount + 1);
  });

  it('adds a new column when clicking the add column button', async () => {
    const addColumnButton = screen.getByTitle('Ajouter une colonne');
    const initialColumnCount = screen.getAllByRole('columnheader').length;
    await userEvent.click(addColumnButton);
    expect(screen.getAllByRole('columnheader')).toHaveLength(initialColumnCount + 1);
  });
});
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Grid } from '../components/Grid';

describe('Grid Component', () => {
  beforeEach(() => {
    render(<Grid />);
  });

  it('allows cell editing on click', async () => {
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBeGreaterThan(0);
    
    const firstCell = cells[0];
    await userEvent.click(firstCell);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'test value');
    expect(input).toHaveValue('test value');
  });

  it('handles keyboard navigation', async () => {
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBeGreaterThan(1);
    
    await userEvent.click(cells[0]);
    await userEvent.keyboard('{ArrowRight}');
    
    expect(document.activeElement).toBe(cells[1]);
  });

  it('allows column resizing', async () => {
    const resizeHandles = screen.getAllByTestId('resize-handle');
    expect(resizeHandles.length).toBeGreaterThan(0);
    
    const firstHandle = resizeHandles[0];
    const initialWidth = firstHandle.parentElement?.getBoundingClientRect().width;
    
    fireEvent.mouseDown(firstHandle, { clientX: 0 });
    fireEvent.mouseMove(document, { clientX: 50 });
    fireEvent.mouseUp(document);
    
    const finalWidth = firstHandle.parentElement?.getBoundingClientRect().width;
    expect(finalWidth).toBeGreaterThan(initialWidth as number);
  });

  it('shows delete buttons on hover', async () => {
    const cells = screen.getAllByRole('cell');
    const firstCell = cells[0];
    
    await userEvent.hover(firstCell);
    const deleteButton = screen.getByTitle('Supprimer la ligne');
    expect(deleteButton).toBeInTheDocument();
  });

  it('deletes row when delete button is clicked', async () => {
    const initialRows = screen.getAllByRole('row').length;
    const cells = screen.getAllByRole('cell');
    
    await userEvent.hover(cells[0]);
    const deleteButton = screen.getByTitle('Supprimer la ligne');
    await userEvent.click(deleteButton);
    
    const finalRows = screen.getAllByRole('row').length;
    expect(finalRows).toBe(initialRows - 1);
  });

  it('deletes column when delete button is clicked', async () => {
    const initialColumns = screen.getAllByRole('columnheader').length;
    const headers = screen.getAllByRole('columnheader');
    
    await userEvent.hover(headers[0]);
    const deleteButton = screen.getByTitle('Supprimer la colonne');
    await userEvent.click(deleteButton);
    
    const finalColumns = screen.getAllByRole('columnheader').length;
    expect(finalColumns).toBe(initialColumns - 1);
  });

  it('handles keyboard shortcuts for deletion', async () => {
    const cells = screen.getAllByRole('cell');
    await userEvent.click(cells[0]);
    
    // Test row deletion
    await userEvent.keyboard('{Shift>}{Delete}{/Shift}');
    expect(screen.getAllByRole('row').length).toBeLessThan(cells.length);
    
    // Test column deletion
    await userEvent.keyboard('{Shift>}{Control>}{Delete}{/Control}{/Shift}');
    expect(screen.getAllByRole('columnheader').length).toBeLessThan(cells[0].parentElement?.children.length || 0);
  });
});
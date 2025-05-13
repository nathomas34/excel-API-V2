import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processApiResponse, exportDataToApi } from '../utils/apiProcessor';
import axios from 'axios';

vi.mock('axios');

describe('API Processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('processes API responses correctly', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    (axios as any).mockResolvedValueOnce({ data: mockData });

    const result = await processApiResponse({
      url: 'https://api.example.com',
      method: 'GET'
    });

    expect(result.headers).toEqual(['id', 'name']);
    expect(result.data[0]).toEqual(['1', 'Test']);
  });

  it('handles API export correctly', async () => {
    (axios as any).mockResolvedValueOnce({ data: { success: true } });

    await exportDataToApi(
      [[{ value: 'test' }]],
      ['column1']
    );

    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      method: expect.any(String),
      url: expect.any(String),
      data: expect.any(Object)
    }));
  });
});
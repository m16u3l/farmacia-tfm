import { Sell, SellFormData } from '@/types';
import { apiRequest } from './api';

export function useSells() {
  const getSells = () => apiRequest<Sell[]>('/api/sells');

  const getSell = (id: number) => apiRequest<Sell>(`/api/sells/${id}`);

  const createSell = (data: SellFormData) =>
    apiRequest<Sell>('/api/sells', {
      method: 'POST',
      body: data,
    });

  const updateSell = (id: number, data: Partial<SellFormData>) =>
    apiRequest<Sell>(`/api/sells/${id}`, {
      method: 'PUT',
      body: data,
    });

  const deleteSell = (id: number) =>
    apiRequest<void>(`/api/sells/${id}`, {
      method: 'DELETE',
    });

  return {
    getSells,
    getSell,
    createSell,
    updateSell,
    deleteSell,
  };
}

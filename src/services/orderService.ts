import { Order, OrderFormData } from '@/types';
import { apiRequest } from './api';

export function useOrders() {
  const getOrders = () => apiRequest<Order[]>('/api/orders');

  const getOrder = (id: number) => apiRequest<Order>(`/api/orders/${id}`);

  const createOrder = (data: OrderFormData) =>
    apiRequest<Order>('/api/orders', {
      method: 'POST',
      body: data,
    });

  const updateOrder = (id: number, data: Partial<OrderFormData>) =>
    apiRequest<Order>(`/api/orders/${id}`, {
      method: 'PUT',
      body: data,
    });

  const deleteOrder = (id: number) =>
    apiRequest<void>(`/api/orders/${id}`, {
      method: 'DELETE',
    });

  return {
    getOrders,
    getOrder,
    createOrder,
    updateOrder,
    deleteOrder,
  };
}

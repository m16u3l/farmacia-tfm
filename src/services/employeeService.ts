import { Employee, EmployeeFormData } from '@/types';
import { apiRequest } from './api';

export function useEmployees() {
  const getEmployees = () => apiRequest<Employee[]>('/api/employees');

  const getEmployee = (id: number) => apiRequest<Employee>(`/api/employees/${id}`);

  const createEmployee = (data: EmployeeFormData) =>
    apiRequest<Employee>('/api/employees', {
      method: 'POST',
      body: data,
    });

  const updateEmployee = (id: number, data: Partial<EmployeeFormData>) =>
    apiRequest<Employee>(`/api/employees/${id}`, {
      method: 'PUT',
      body: data,
    });

  const deleteEmployee = (id: number) =>
    apiRequest<void>(`/api/employees/${id}`, {
      method: 'DELETE',
    });

  return {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
}

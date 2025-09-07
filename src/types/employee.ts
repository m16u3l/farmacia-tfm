export interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
}

export type EmployeeFormData = Omit<Employee, 'employee_id'>;

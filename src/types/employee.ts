export interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface EmployeeFormData extends Omit<Employee, 'employee_id'> {}

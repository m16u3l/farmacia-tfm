export type UserRole = "admin" | "farmaceutico" | "cajero";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  employee_id: number | null;
  created_at?: string;
}

export type UserFormData = Partial<User> & { password?: string };

import { Employee, EmployeeFormData } from "@/types/employee";

interface UseEmployeesReturn {
  createEmployee: (employeeData: EmployeeFormData) => Promise<Employee>;
  updateEmployee: (id: number, employeeData: Partial<EmployeeFormData>) => Promise<Employee>;
  deleteEmployee: (id: number) => Promise<void>;
}

export function useEmployees(): UseEmployeesReturn {
  const createEmployee = async (employeeData: EmployeeFormData): Promise<Employee> => {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employeeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al crear el empleado");
    }

    return response.json();
  };

  const updateEmployee = async (id: number, employeeData: Partial<EmployeeFormData>): Promise<Employee> => {
    const response = await fetch(`/api/employees/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employeeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al actualizar el empleado");
    }

    return response.json();
  };

  const deleteEmployee = async (id: number): Promise<void> => {
    const response = await fetch(`/api/employees/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al eliminar el empleado");
    }
  };

  return {
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
}

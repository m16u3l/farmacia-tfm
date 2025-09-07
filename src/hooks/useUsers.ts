import { useState, useCallback } from "react";
import { User,UserFormData } from "@/types/user";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Error al cargar Users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      console.error('Error fetching Users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUsuario = async (formData: UserFormData, isEditing: boolean) => {
    try {
      const url = isEditing ? `/api/users/${formData.id}` : "/api/users";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error al guardar usuario");
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error saving usuario:", error);
      return false;
    }
  };

  const deleteUsuario = async (id: number) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar usuario");
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error deleting usuario:", error);
      return false;
    }
  };

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    saveUsuario,
    deleteUsuario,
  };
}

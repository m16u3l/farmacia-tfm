import { Product } from "@/types/products";

interface UseProductsReturn {
  createProduct: (productData: Omit<Product, "product_id">) => Promise<Product>;
  updateProduct: (id: number, productData: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
}

export function useProducts(): UseProductsReturn {
  const createProduct = async (productData: Omit<Product, "product_id">): Promise<Product> => {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al crear el producto");
    }

    return response.json();
  };

  const updateProduct = async (id: number, productData: Partial<Product>): Promise<Product> => {
    const response = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al actualizar el producto");
    }

    return response.json();
  };

  const deleteProduct = async (id: number): Promise<void> => {
    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al eliminar el producto");
    }
  };

  return {
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

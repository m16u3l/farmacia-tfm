type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
};

export async function apiRequest<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const response = await fetch(endpoint, {
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    // Las rutas de API de este repo responden { error: "..." }; se prioriza ese
    // campo para que el mensaje del servidor llegue a la UI.
    const error = await response.json();
    throw new Error(error.error || error.message || 'Error en la solicitud');
  }

  return response.json();
}

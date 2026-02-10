type ApiResponse<T> = {
  data: T;
  error?: string;
};

export const apiFetch = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(payload.error ?? 'Erro inesperado na API.');
  }

  return payload.data;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const clearAuth = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
  localStorage.removeItem('sifraRadnika');
};

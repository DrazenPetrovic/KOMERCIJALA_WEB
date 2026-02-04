export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
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
  localStorage.removeItem('token');
  localStorage.removeItem('username');
};

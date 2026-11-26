import { API_CONFIG } from './apiConfig.js';

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export async function apiRequest(path, options = {}) {
  const url = `${API_CONFIG.BASE_URL.replace(/\/$/, '')}${path}`;
  const config = {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    throw new ApiError(`Não foi possível conectar à API em ${API_CONFIG.BASE_URL}.`, 0, error);
  }

  let payload = null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    payload = text ? { mensagem: text } : null;
  }

  if (!response.ok || payload?.sucesso === false) {
    const message = payload?.erro ?? payload?.mensagem ?? payload?.message ?? `A API retornou HTTP ${response.status}.`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

export function isDemoMode() {
  return API_CONFIG.DEMO_MODE;
}

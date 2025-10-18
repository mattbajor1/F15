const isEmulator = (import.meta as any).env.VITE_FUNCTIONS_EMULATOR==='true' && (location.hostname==='localhost' || location.hostname==='127.0.0.1');
export const API_BASE = isEmulator ? ((import.meta as any).env.VITE_API_BASE2 || 'http://127.0.0.1:5001/f15-internal/us-central1/api') : '/api';

export async function api(path: string, options: any = {}) {
  try {
    const url = `${API_BASE}${path}`;
    console.log('API Request:', url, options);
    const res = await fetch(url, {
      // Disable credentials in emulator due to CORS limitations
      credentials: isEmulator ? 'omit' : 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error:', res.status, res.statusText, errorText);
      throw new Error(`${res.status} ${res.statusText}: ${errorText}`);
    }

    return res.json();
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
}

export const postJSON = (path: string, body: any) => api(path, { method: 'POST', body: JSON.stringify(body) })
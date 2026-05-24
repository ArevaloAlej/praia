/* ───────────────────────── PRAIA · API adapter ─────────────────────────
 * Cliente para llamar el backend Apps Script.
 *
 * Uso:
 *   await PRAIA_API.login(apiUrl, email)  → valida y guarda config
 *   PRAIA_API.getConfig() → {apiUrl, email, user}
 *   PRAIA_API.logout() → limpia config
 *
 *   await PRAIA_API.get('tickets')
 *   await PRAIA_API.get('all')
 *   await PRAIA_API.post('create', { ticket: {...} })
 *
 * CORS workaround:
 *   POST con Content-Type 'application/json' dispara preflight que
 *   Apps Script no maneja bien. Usamos 'text/plain' — el body sigue
 *   siendo JSON y el backend lo parsea igual con e.postData.contents.
 * ────────────────────────────────────────────────────────────────────── */

const PRAIA_API = (() => {
  const STORAGE_KEY = 'praia.config.v1';
  // La URL del API se configura una sola vez aquí — todos los users la usan
  const API_URL = 'https://script.google.com/macros/s/AKfycbxmaVohLzDTk5xKIOrNuCpzEq5dThGht_ikuFMdc49IkNZtnprHS-Je1k1NYZ45Fmlj/exec';

  function getConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function setConfig(c) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
  }

  async function get(action) {
    const cfg = getConfig();
    if (!cfg) throw new Error('Not configured');
    const url = `${API_URL}?action=${encodeURIComponent(action)}&email=${encodeURIComponent(cfg.email)}`;
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  }

  async function post(action, body = {}) {
    const cfg = getConfig();
    if (!cfg) throw new Error('Not configured');
    const payload = JSON.stringify({ action, email: cfg.email, ...body });
    // text/plain evita el preflight CORS que Apps Script no soporta
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload,
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  }

  /* Login: email + password → valida en el backend */
  async function login(email, password) {
    email = (email || '').trim();
    password = (password || '').trim();
    if (!email.includes('@')) {
      throw new Error('Email inválido');
    }
    if (password.length < 6) {
      throw new Error('Contraseña debe tener al menos 6 caracteres');
    }

    const payload = JSON.stringify({ action: 'login', email, password });
    let json;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload,
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      json = await res.json();
    } catch (e) {
      throw new Error('No se pudo contactar la API: ' + e.message);
    }
    if (json.error) {
      throw new Error(json.error);
    }
    const user = json.data;
    setConfig({ apiUrl: API_URL, email, user });
    return user;
  }

  /* Bulk load — todo lo necesario para arrancar */
  async function bootstrap() {
    return await get('all');
  }

  return { getConfig, setConfig, logout, get, post, login, bootstrap };
})();

window.PRAIA_API = PRAIA_API;

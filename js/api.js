// ============================================================
// SyBorx Messenger — Cliente de API REST y WebSockets en Tiempo Real
// ============================================================

const API_CONFIG = {
  baseUrl: window.location.origin.includes('localhost')
    ? `${window.location.origin}/api`
    : 'http://localhost:3001/api',
  wsUrl: window.location.origin.includes('localhost')
    ? `${window.location.origin}/realtime`
    : 'http://localhost:3001/realtime',
};

class SyBorxAPI {
  constructor() {
    this.token = localStorage.getItem('syborx_token') || null;
    this.user = JSON.parse(localStorage.getItem('syborx_user') || 'null');
    this.socket = null;
    this.listeners = new Map();
  }

  setSession(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('syborx_token', token);
    localStorage.setItem('syborx_user', JSON.stringify(user));
    this.initSocket();
  }

  clearSession() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('syborx_token');
    localStorage.removeItem('syborx_user');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error en la petición');
      }
      return data;
    } catch (err) {
      console.warn(`[API] Error en ${endpoint}:`, err.message);
      throw err;
    }
  }

  // ---------- Autenticación ----------
  async login(identifier, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.setSession(res.accessToken, res.user);
    return res;
  }

  async register(userData) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setSession(res.accessToken, res.user);
    return res;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // ---------- Comunidades y Canales ----------
  async getMyCommunities() {
    return this.request('/communities/my');
  }

  async getChannelMessages(channelId) {
    return this.request(`/channels/${channelId}/messages?limit=50`);
  }

  async createChannel(communityId, channelData) {
    return this.request(`/communities/${communityId}/channels`, {
      method: 'POST',
      body: JSON.stringify(channelData),
    });
  }

  // ---------- Chats Directos 1 a 1 ----------
  async getDirectChats() {
    return this.request('/direct-chats');
  }

  async getDirectMessages(chatId) {
    return this.request(`/direct-chats/${chatId}/messages?limit=50`);
  }

  async startDirectChat(recipientId) {
    return this.request('/direct-chats', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    });
  }

  async getDirectory() {
    return this.request('/users/directory');
  }

  // ---------- Mensajería y Archivos ----------
  async sendMessage(payload) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async toggleReaction(messageId, emoji) {
    return this.request(`/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_CONFIG.baseUrl}/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Error al subir archivo');
    }
    return res.json();
  }

  // ---------- WebSockets en Tiempo Real ----------
  initSocket() {
    if (!window.io || !this.token) return;

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = window.io(API_CONFIG.wsUrl, {
      auth: { token: this.token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('⚡ Conectado al WebSocket Gateway de SyBorx');
    });

    this.socket.on('message:new', (msg) => {
      this.emit('message:new', msg);
    });

    this.socket.on('user:typing', (data) => {
      this.emit('user:typing', data);
    });

    this.socket.on('user:presence', (data) => {
      this.emit('user:presence', data);
    });
  }

  joinChannel(channelId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('channel:join', { channelId });
    }
  }

  joinDirectChat(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('direct_chat:join', { chatId });
    }
  }

  emitTyping(target, isTyping) {
    if (!this.socket || !this.socket.connected) return;
    const event = isTyping ? 'typing:start' : 'typing:stop';
    this.socket.emit(event, target);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const list = this.listeners.get(event) || [];
    list.forEach((cb) => cb(data));
  }
}

// Instancia global disponible en window.api
window.syborxApi = new SyBorxAPI();

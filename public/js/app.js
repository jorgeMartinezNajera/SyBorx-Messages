// ============================================================
// SyBorx Comunity — Cliente conectado al backend NestJS
// API /api · WebSocket /realtime · JWT Bearer
// ============================================================

const $ = sel => document.querySelector(sel);

const API_BASE = '/api';
const STORE_KEY_TOKEN = 'syborx_token';
const STORE_KEY_THEME = 'syborx_theme';

const ROLE_LABELS = {
  SUPERADMIN: 'CEO / Superadmin',
  ADMIN: 'Admin',
  TECH_LEAD: 'Tech Lead',
  DEVELOPER: 'Developer',
  GUEST: 'Guest',
};

const COMM_ROLE_LABELS = {
  COMMUNITY_OWNER: 'Propietario',
  COMMUNITY_ADMIN: 'Admin del servidor',
  COMMUNITY_MODERATOR: 'Moderador',
  COMMUNITY_MEMBER: 'Integrante',
};

const STATUS_LABELS = {
  ONLINE: 'En línea',
  IDLE: 'Ausente',
  DND: 'No molestar',
  OFFLINE: 'Desconectado',
};

const els = {
  authScreen: $('#auth-screen'),
  app: $('#app'),
  authThemeToggle: $('#auth-theme-toggle'),
  authTabsBox: $('#auth-tabs'),
  authTabs: document.querySelectorAll('.auth-tab'),
  loginForm: $('#login-form'),
  registerForm: $('#register-form'),
  loginIdentifier: $('#login-identifier'),
  loginPassword: $('#login-password'),
  loginSubmit: $('#login-submit'),
  regName: $('#reg-name'),
  regEmail: $('#reg-email'),
  regUsername: $('#reg-username'),
  regPassword: $('#reg-password'),
  regBio: $('#reg-bio'),
  registerSubmit: $('#register-submit'),
  authError: $('#auth-error'),
  profileOpen: $('#profile-open'),
  meAvatar: $('#me-avatar'),
  meName: $('#me-name'),
  meRole: $('#me-role'),
  adminPanelBtn: $('#admin-panel-btn'),
  forcePwdModal: $('#force-pwd-modal'),
  forcePwdForm: $('#force-pwd-form'),
  forcePwdNew: $('#force-pwd-new'),
  forcePwdConfirm: $('#force-pwd-confirm'),
  forcePwdSubmit: $('#force-pwd-submit'),
  forcePwdError: $('#force-pwd-error'),
  pwdBar: $('#pwd-bar'),
  pwdStrengthText: $('#pwd-strength-text'),
  themeToggle: $('#theme-toggle'),
  logoutBtn: $('#logout-btn'),
  viewSwitch: $('#view-switch'),
  segBtns: document.querySelectorAll('#view-switch .seg-btn'),
  searchInput: $('#search-input'),
  searchClear: $('#search-clear'),
  listTitle: $('#list-title'),
  newGroupBtn: $('#new-group-btn'),
  chatList: $('#chat-list'),
  chatHeader: $('#chat-header'),
  chatAvatar: $('#chat-avatar'),
  chatName: $('#chat-name'),
  chatSub: $('#chat-sub'),
  sharedFilesBtn: $('#shared-files-btn'),
  membersBtn: $('#members-btn'),
  deleteChatBtn: $('#delete-chat-btn'),
  emptyState: $('#empty-state'),
  emptyText: $('#empty-text'),
  messages: $('#messages'),
  messagesInner: $('#messages-inner'),
  typingIndicator: $('#typing-indicator'),
  typingAvatar: $('#typing-avatar'),
  typingText: $('#typing-text'),
  composer: $('#composer'),
  input: $('#input'),
  sendBtn: $('#send-btn'),
  attachBtn: $('#attach-btn'),
  fileInput: $('#file-input'),
  attachmentsPreview: $('#attachments-preview'),
  modal: $('#modal'),
  modalTitle: $('#modal-title'),
  modalClose: $('#modal-close'),
  modalBody: $('#modal-body'),
  toast: $('#toast'),
};

const state = {
  token: localStorage.getItem(STORE_KEY_TOKEN) || null,
  user: null,
  view: 'direct',
  activeChat: null, // { kind: 'direct'|'channel', id }
  directory: [],
  directChats: [],
  communities: [],
  channels: [],
  community: null,
  messages: [],
  joinedRoom: null,
  modalMode: null,
  socket: null,
  typingUsers: {},
  unreadCounts: {},
  recentChatId: null,
  recentMsgId: null,
};

const pendingFiles = [];

// ---------- Sonido sutil de notificación (Web Audio API) ----------
function playMessageChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  } catch (_) {}
}

// ---------- Utilidades ----------
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove('show'), 2400);
}

function initials(name) {
  return String(name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function avatarHtml(user, cls = 'avatar') {
  if (!user) return `<span class="${cls}">?</span>`;
  if (user.avatarUrl) return `<span class="${cls}" style="background-image:url('${esc(user.avatarUrl)}');background-size:cover;background-position:center;"></span>`;
  return `<span class="${cls}">${esc(initials(user.displayName))}</span>`;
}

function setAvatar(el, user) {
  if (user && user.avatarUrl) {
    el.textContent = '';
    el.style.backgroundImage = `url('${esc(user.avatarUrl)}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
  } else {
    el.textContent = initials(user ? user.displayName : '?');
    el.style.backgroundImage = '';
    el.style.backgroundSize = '';
  }
}

function fmtTime(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((today - day) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}

// ---------- Tema ----------
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const dark = theme === 'dark';
  [['#ico-moon', '#ico-sun'], ['#auth-ico-moon', '#auth-ico-sun']].forEach(([m, s]) => {
    $(m).classList.toggle('hidden', dark);
    $(s).classList.toggle('hidden', !dark);
  });
  localStorage.setItem(STORE_KEY_THEME, theme);
}

// ---------- API ----------
async function api(path, opts = {}) {
  const { method = 'GET', body, isForm } = opts;
  const headers = {};
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  let payload = body;
  if (body && !isForm) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(API_BASE + path, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && state.token && path !== '/auth/login') {
    await logout(false);
    throw new Error('Sesión expirada');
  }
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message.join(' · ') : (data.message || 'Error de servidor');
    throw new Error(msg);
  }
  return data;
}

// ---------- Autenticación ----------
function setAuthError(msg) {
  els.authError.textContent = msg;
  els.authError.classList.remove('hidden');
}

function clearAuthError() {
  els.authError.classList.add('hidden');
}

async function doLogin() {
  const identifier = els.loginIdentifier.value.trim();
  const password = els.loginPassword.value;
  if (!identifier || !password) return setAuthError('Ingresa correo/usuario y contraseña.');
  setBusy(els.loginSubmit, true, 'Ingresando...');
  try {
    const res = await api('/auth/login', { method: 'POST', body: { identifier, password } });
    await onAuthenticated(res);
  } catch (e) {
    setAuthError(e.message);
  } finally {
    setBusy(els.loginSubmit, false, 'Iniciar sesión');
  }
}

async function doRegister() {
  const displayName = els.regName.value.trim();
  const email = els.regEmail.value.trim();
  const username = els.regUsername.value.trim();
  const password = els.regPassword.value;
  const bio = els.regBio.value.trim();
  if (!displayName || !email || !username || !password) return setAuthError('Completa todos los campos obligatorios.');
  setBusy(els.registerSubmit, true, 'Creando cuenta...');
  try {
    const res = await api('/auth/register', {
      method: 'POST',
      body: { email, username, password, displayName, ...(bio ? { bio } : {}) },
    });
    await onAuthenticated(res);
  } catch (e) {
    setAuthError(e.message);
  } finally {
    setBusy(els.registerSubmit, false, 'Crear cuenta');
  }
}

function setBusy(btn, busy, label) {
  btn.disabled = busy;
  btn.textContent = label;
}

async function onAuthenticated(res) {
  state.token = res.accessToken;
  state.user = res.user;
  localStorage.setItem(STORE_KEY_TOKEN, state.token);
  clearAuthError();

  if (res.mustChangePassword || (res.user && res.user.mustChangePassword)) {
    showForcePasswordModal();
    return;
  }
  await enterApp();
}

function showForcePasswordModal() {
  els.forcePwdModal.classList.remove('hidden');
  els.forcePwdNew.value = '';
  els.forcePwdConfirm.value = '';
  els.forcePwdError.classList.add('hidden');
  validatePasswordStrength();
}

function validatePasswordStrength() {
  const val = els.forcePwdNew.value || '';
  const confirmVal = els.forcePwdConfirm.value || '';

  const hasLen = val.length >= 8;
  const hasUpper = /[A-Z]/.test(val);
  const hasLower = /[a-z]/.test(val);
  const hasNum = /\d/.test(val);
  const hasSym = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(val);
  const matches = Boolean(val && confirmVal && val === confirmVal);

  setRuleStatus($('#rule-len'), hasLen);
  setRuleStatus($('#rule-upper'), hasUpper);
  setRuleStatus($('#rule-lower'), hasLower);
  setRuleStatus($('#rule-num'), hasNum);
  setRuleStatus($('#rule-sym'), hasSym);
  setRuleStatus($('#rule-match'), matches);

  const score = [hasLen, hasUpper, hasLower, hasNum, hasSym].filter(Boolean).length;
  els.pwdBar.className = 'pwd-bar';
  if (!val) {
    els.pwdStrengthText.textContent = 'Seguridad: Ingresa una contraseña';
  } else if (score <= 2) {
    els.pwdBar.classList.add('weak');
    els.pwdStrengthText.textContent = 'Seguridad: Débil (insegura)';
  } else if (score === 3 || score === 4) {
    els.pwdBar.classList.add('fair');
    els.pwdStrengthText.textContent = 'Seguridad: Media (requiere más requisitos)';
  } else if (score === 5) {
    els.pwdBar.classList.add('strong');
    els.pwdStrengthText.textContent = 'Seguridad: Fuerte y Segura ✓';
  }

  const allValid = hasLen && hasUpper && hasLower && hasNum && hasSym && matches;
  els.forcePwdSubmit.disabled = !allValid;
}

function setRuleStatus(el, isValid) {
  if (!el) return;
  el.classList.toggle('valid', isValid);
  const ico = el.querySelector('.rule-ico');
  if (ico) ico.textContent = isValid ? '✓' : '✕';
}

async function doForceChangePassword(e) {
  if (e) e.preventDefault();
  const newPassword = els.forcePwdNew.value;
  setBusy(els.forcePwdSubmit, true, 'Guardando nueva contraseña...');
  try {
    await api('/auth/change-password', {
      method: 'POST',
      body: { newPassword },
    });
    els.forcePwdModal.classList.add('hidden');
    if (state.user) state.user.mustChangePassword = false;
    toast('¡Contraseña actualizada exitosamente!');
    await enterApp();
  } catch (err) {
    els.forcePwdError.textContent = err.message;
    els.forcePwdError.classList.remove('hidden');
  } finally {
    setBusy(els.forcePwdSubmit, false, 'Guardar y Acceder al Messenger');
  }
}

function showAuth() {
  els.app.classList.add('hidden');
  els.authScreen.classList.remove('hidden');
}

function showApp() {
  els.authScreen.classList.add('hidden');
  els.app.classList.remove('hidden');
}

async function logout(toastMsg = true) {
  try {
    if (state.token) await api('/auth/logout', { method: 'POST' });
  } catch (_) { /* best effort */ }
  state.token = null;
  state.user = null;
  state.socket && state.socket.disconnect();
  state.socket = null;
  localStorage.removeItem(STORE_KEY_TOKEN);
  clearPendingFiles();
  resetAppUI();
  showAuth();
  if (toastMsg) toast('Sesión cerrada');
}

function resetAppUI() {
  state.activeChat = null;
  state.directory = [];
  state.directChats = [];
  state.communities = [];
  state.channels = [];
  state.community = null;
  state.messages = [];
  state.joinedRoom = null;
  els.chatHeader.classList.add('hidden');
  els.membersBtn.classList.add('hidden');
  els.messages.classList.add('hidden');
  els.composer.classList.add('hidden');
  els.emptyState.classList.remove('hidden');
  els.chatList.innerHTML = '';
}

// ---------- Carga de datos ----------
async function loadAppData() {
  const [dir, dms, comms] = await Promise.all([
    api('/users/directory?limit=100'),
    api('/direct-chats'),
    api('/communities/my'),
  ]);
  state.directory = dir.data || [];
  state.directChats = dms || [];
  state.communities = comms || [];
  state.channels = [];
  state.communities.forEach(c => (c.channels || []).forEach(ch => {
    state.channels.push({ ...ch, community: c });
  }));
  state.community = state.communities[0] || null;
}

async function enterApp() {
  try {
    await loadAppData();
    connectSocket();
    showApp();
    renderAll();
    toast(`Bienvenido, ${state.user.displayName}`);
  } catch (e) {
    setAuthError(e.message);
  }
}

// ---------- WebSocket ----------
function connectSocket() {
  if (state.socket) state.socket.disconnect();
  state.socket = io('/realtime', { auth: { token: state.token } });
  state.socket.on('connect', () => {
    if (state.activeChat) connectChatRoom(state.activeChat);
  });
  state.socket.on('message:new', onNewMessage);
  state.socket.on('message:status', onMessageStatus);
  state.socket.on('user:presence', onPresence);
  state.socket.on('user:typing', onTyping);
  state.socket.on('disconnect', () => { state.joinedRoom = null; });
}

function onMessageStatus(data) {
  if (!data) return;
  // Si el evento fue generado por mí mismo leyendo los mensajes de otro, no cambiar mis propios mensajes enviados
  if (data.readByUserId && data.readByUserId === state.user.id) return;

  let changed = false;
  state.messages.forEach(m => {
    if (data.messageId && m.id === data.messageId) {
      m.deliveryStatus = data.status;
      changed = true;
    } else if (data.directChatId && m.directChatId === data.directChatId && m.senderId === state.user.id) {
      if (data.status === 'READ') {
        m.deliveryStatus = 'READ';
        changed = true;
      }
    }
  });
  if (changed) {
    renderMessages();
  }
}

function connectChatRoom(chat) {
  if (!state.socket || !state.socket.connected) return;
  const room = chat.kind === 'channel' ? `channel_${chat.id}` : `direct_chat_${chat.id}`;
  if (state.joinedRoom === room) return;
  if (chat.kind === 'channel') state.socket.emit('channel:join', { channelId: chat.id });
  else state.socket.emit('direct_chat:join', { chatId: chat.id });
  state.joinedRoom = room;
}

function leaveChatRoom(chat) {
  if (!state.socket || !state.joinedRoom) return;
  if (chat.kind === 'channel') state.socket.emit('channel:leave', { channelId: chat.id });
  else state.socket.emit('direct_chat:leave', { chatId: chat.id });
  state.joinedRoom = null;
}

function onNewMessage(msg) {
  const isFromMe = msg.senderId === state.user.id;
  const isActive = state.activeChat &&
    ((state.activeChat.kind === 'channel' && msg.channelId === state.activeChat.id) ||
     (state.activeChat.kind === 'direct' && msg.directChatId === state.activeChat.id));

  if (!isFromMe && state.socket && state.socket.connected) {
    if (isActive) {
      state.socket.emit('message:read', { messageId: msg.id, directChatId: msg.directChatId, channelId: msg.channelId });
    } else {
      state.socket.emit('message:delivered', { messageId: msg.id, directChatId: msg.directChatId, channelId: msg.channelId });
    }
  }

  if (isActive) {
    if (!isFromMe) {
      state.recentMsgId = msg.id;
      playMessageChime();
    }
    upsertMessage(msg);
    renderMessages();
    scrollToBottom();
  }

  // Actualizar metadata de DM y ordenar al inicio
  if (msg.directChatId) {
    let dm = state.directChats.find(d => d.id === msg.directChatId);
    if (!dm) {
      const otherUser = isFromMe
        ? state.directory.find(u => u.id !== state.user.id)
        : (msg.sender || state.directory.find(u => u.id === msg.senderId));
      dm = {
        id: msg.directChatId,
        recipient: otherUser,
        lastMessage: null,
        updatedAt: msg.createdAt,
      };
      state.directChats.unshift(dm);
    }
    dm.lastMessage = {
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      createdAt: msg.createdAt,
      messageType: msg.messageType,
    };
    dm.updatedAt = msg.createdAt || new Date().toISOString();

    if (!isActive && !isFromMe) {
      const peerId = dm.recipient ? dm.recipient.id : msg.senderId;
      state.unreadCounts[peerId] = (state.unreadCounts[peerId] || 0) + 1;
      state.unreadCounts[dm.id] = (state.unreadCounts[dm.id] || 0) + 1;
      state.recentChatId = peerId;
      playMessageChime();
    }
  }

  // Actualizar canal
  if (msg.channelId) {
    const ch = state.channels.find(c => c.id === msg.channelId);
    if (ch) {
      ch.lastMessage = {
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
        messageType: msg.messageType,
      };
      ch.updatedAt = msg.createdAt || new Date().toISOString();
    }
    if (!isActive && !isFromMe) {
      state.unreadCounts[msg.channelId] = (state.unreadCounts[msg.channelId] || 0) + 1;
      state.recentChatId = msg.channelId;
      playMessageChime();
    }
  }

  renderList();
}

function onPresence(data) {
  if (!data || !data.userId) return;
  const dirUser = state.directory.find(u => u.id === data.userId);
  if (dirUser) dirUser.status = data.status;
  state.directChats.forEach(dm => { if (dm.recipient && dm.recipient.id === data.userId) dm.recipient.status = data.status; });
  if (state.view === 'direct') renderList();
  if (state.activeChat && state.activeChat.kind === 'direct') {
    const dm = state.directChats.find(d => d.id === state.activeChat.id);
    if (dm && dm.recipient && dm.recipient.id === data.userId) renderHeader(state.activeChat);
  }
}

// Temporizadores de auto-expiración de escritura
const typingTimeouts = {};

function onTyping(data) {
  if (!data || !data.user) return;
  const userId = data.user.id;
  const userName = data.user.displayName || data.user.username;
  const avatarUrl = data.user.avatarUrl;

  const isActive = state.activeChat &&
    ((data.channelId && state.activeChat.kind === 'channel' && data.channelId === state.activeChat.id) ||
     (data.directChatId && state.activeChat.kind === 'direct' && data.directChatId === state.activeChat.id));

  // Limpiar timer previo para este usuario
  if (typingTimeouts[userId]) {
    clearTimeout(typingTimeouts[userId]);
    delete typingTimeouts[userId];
  }

  if (data.isTyping) {
    state.typingUsers[userId] = { id: userId, displayName: userName, avatarUrl, channelId: data.channelId, directChatId: data.directChatId };
    // Auto-expirar en 3.5 segundos si no se recibe typing:stop
    typingTimeouts[userId] = setTimeout(() => {
      delete state.typingUsers[userId];
      updateTypingUI();
      renderList();
    }, 3500);
  } else {
    delete state.typingUsers[userId];
  }

  if (isActive) {
    updateTypingUI();
  }
  renderList();
}

function updateTypingUI() {
  if (!state.activeChat) {
    if (els.typingIndicator) els.typingIndicator.classList.add('hidden');
    return;
  }

  const activeTypers = Object.values(state.typingUsers).filter(t => {
    if (state.activeChat.kind === 'channel') return t.channelId === state.activeChat.id;
    if (state.activeChat.kind === 'direct') return t.directChatId === state.activeChat.id;
    return false;
  });

  // 1. Burbuja flotante de escritura en el chat
  if (els.typingIndicator && els.typingText) {
    if (activeTypers.length > 0) {
      const first = activeTypers[0];
      if (els.typingAvatar) {
        if (first.avatarUrl) {
          els.typingAvatar.textContent = '';
          els.typingAvatar.style.backgroundImage = `url('${esc(first.avatarUrl)}')`;
          els.typingAvatar.style.backgroundSize = 'cover';
        } else {
          els.typingAvatar.textContent = initials(first.displayName);
          els.typingAvatar.style.backgroundImage = '';
        }
      }
      if (activeTypers.length === 1) {
        els.typingText.textContent = `${first.displayName} está escribiendo`;
      } else if (activeTypers.length === 2) {
        els.typingText.textContent = `${activeTypers[0].displayName} y ${activeTypers[1].displayName} están escribiendo`;
      } else {
        els.typingText.textContent = `Varias personas están escribiendo`;
      }
      els.typingIndicator.classList.remove('hidden');
      scrollToBottom();
    } else {
      els.typingIndicator.classList.add('hidden');
    }
  }

  // 2. Indicador dinámico en la cabecera
  renderHeaderSubTyping(activeTypers);
}

function renderHeaderSubTyping(activeTypers) {
  if (!state.activeChat || !els.chatSub) return;
  const typers = activeTypers || Object.values(state.typingUsers).filter(t => {
    if (state.activeChat.kind === 'channel') return t.channelId === state.activeChat.id;
    if (state.activeChat.kind === 'direct') return t.directChatId === state.activeChat.id;
    return false;
  });

  if (typers.length > 0) {
    els.chatSub.className = 'typing-pulse-text';
    if (typers.length === 1) {
      els.chatSub.textContent = `✍️ ${typers[0].displayName} está escribiendo...`;
    } else {
      els.chatSub.textContent = `✍️ ${typers.length} personas están escribiendo...`;
    }
  } else {
    els.chatSub.className = '';
    // Restaurar subtítulo original
    if (state.activeChat.kind === 'channel') {
      const ch = state.channels.find(c => c.id === state.activeChat.id);
      const memberCount = (ch && ch.community && ch.community._count && ch.community._count.members) || 0;
      els.chatSub.textContent = ch ? `${ch.community?.name || 'Comunidad'} · ${memberCount} integrantes` : '';
    } else {
      const dm = state.directChats.find(d => d.id === state.activeChat.id);
      const recipient = dm ? dm.recipient : state.directory.find(u => u.id === state.activeChat.peerId);
      if (recipient) {
        const isOnline = recipient.status === 'ONLINE' || recipient.status === 'IDLE' || recipient.status === 'DND';
        els.chatSub.textContent = `${ROLE_LABELS[recipient.globalRole] || 'Miembro'} · ${STATUS_LABELS[recipient.status] || (isOnline ? 'En línea' : 'Desconectado')}`;
      }
    }
  }
}

// ---------- Sidebar ----------
function renderProfile() {
  const u = state.user;
  if (!u) return;
  setAvatar(els.meAvatar, u);
  els.meName.textContent = u.displayName;
  els.meRole.textContent = ROLE_LABELS[u.globalRole] || u.globalRole;
  const isAdmin = u.globalRole === 'ADMIN' || u.globalRole === 'SUPERADMIN';
  if (els.adminPanelBtn) {
    els.adminPanelBtn.classList.toggle('hidden', !isAdmin);
  }
}

async function openAdminPanelModal() {
  els.modalTitle.textContent = 'Gestión de Usuarios y Contraseñas Temporales';
  els.modalBody.innerHTML = '<div class="chat-empty">Cargando usuarios del sistema...</div>';
  els.modal.classList.remove('hidden');

  try {
    const res = await api('/admin/users?limit=100');
    const users = res.data || [];

    if (!users.length) {
      els.modalBody.innerHTML = '<div class="chat-empty">No se encontraron usuarios.</div>';
      return;
    }

    els.modalBody.innerHTML = `
      <div style="margin-bottom: 14px; font-size: 12.5px; color: var(--text-muted); line-height: 1.4;">
        Genera una <strong>contraseña temporal segura de 24 horas</strong> para un usuario que olvidó su clave o requiere restablecimiento. Al ingresar, el usuario estará obligado a crear su nueva contraseña.
      </div>
      <div id="admin-temp-pwd-result"></div>
      <div class="admin-users-list">
        ${users.map(u => `
          <div class="admin-user-row" data-user-id="${u.id}">
            <div class="admin-user-info">
              <strong>${esc(u.displayName)} (@${esc(u.username)})</strong>
              <span>${esc(u.email)} · <em>${ROLE_LABELS[u.globalRole] || u.globalRole}</em> ${u.mustChangePassword ? '· <span style="color:var(--danger);font-weight:600;">[Cambio de Clave Pendiente]</span>' : ''}</span>
            </div>
            <div class="admin-user-actions">
              <button type="button" class="btn-temp-pwd" data-user-id="${u.id}" data-user-name="${esc(u.displayName)}" data-user-email="${esc(u.email)}">
                🔑 Clave Temporal
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    els.modalBody.querySelectorAll('.btn-temp-pwd').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.userId;
        const uname = btn.dataset.userName;
        const uemail = btn.dataset.userEmail;
        if (!confirm(`¿Generar contraseña temporal para ${uname} (${uemail})?`)) return;

        btn.disabled = true;
        btn.textContent = 'Generando...';
        try {
          const result = await api(`/admin/users/${uid}/temp-password`, { method: 'POST' });
          const box = els.modalBody.querySelector('#admin-temp-pwd-result');
          box.innerHTML = `
            <div class="temp-pwd-alert">
              <strong>✓ Contraseña Temporal Generada para ${esc(result.targetUser.email)}</strong>
              <div class="temp-pwd-copy-box">
                <code id="temp-code">${esc(result.temporaryPassword)}</code>
                <button type="button" class="btn-copy" id="btn-copy-temp">Copiar Clave</button>
              </div>
              <span style="font-size: 11px; color: var(--text-muted);">Pásale esta contraseña al usuario. Al iniciar sesión, el sistema le obligará a crear una nueva clave con todos los requisitos de seguridad.</span>
            </div>
          `;
          box.querySelector('#btn-copy-temp').addEventListener('click', () => {
            navigator.clipboard.writeText(result.temporaryPassword);
            toast('¡Contraseña temporal copiada al portapapeles!');
          });
          toast(`Clave generada para ${uname}`);
        } catch (e) {
          toast(e.message);
        } finally {
          btn.disabled = false;
          btn.textContent = '🔑 Clave Temporal';
        }
      });
    });
  } catch (e) {
    els.modalBody.innerHTML = `<div class="chat-empty" style="color:var(--danger);">${esc(e.message)}</div>`;
  }
}

function canManageCommunity() {
  const role = state.community ? state.community.userRoleInCommunity : null;
  return role === 'COMMUNITY_OWNER' || role === 'COMMUNITY_ADMIN';
}

function renderList() {
  const query = els.searchInput ? els.searchInput.value.trim().toLowerCase() : '';
  if (els.searchClear) {
    els.searchClear.classList.toggle('hidden', !query);
  }

  els.newGroupBtn.classList.toggle('hidden', !(state.view === 'groups' && canManageCommunity()));
  
  if (state.view === 'direct') {
    els.listTitle.textContent = query ? 'Resultados en Mensajes' : 'Mensajes Recientes';
  } else if (state.view === 'groups') {
    els.listTitle.textContent = query ? 'Resultados en Grupos' : 'Grupos y Canales';
  } else {
    els.listTitle.textContent = query ? 'Resultados en Directorio' : 'Directorio de Contactos';
  }

  if (state.view === 'direct') {
    let peers = state.directory.filter(u => u.id !== state.user.id);
    
    // Si no hay búsqueda activa, solo mostrar las conversaciones con mensajes activos
    if (!query) {
      peers = peers.filter(p => {
        const dm = state.directChats.find(d => d.recipient && d.recipient.id === p.id);
        return dm && (dm.lastMessage || state.unreadCounts[p.id]);
      });
    } else {
      peers = peers.filter(p =>
        (p.displayName && p.displayName.toLowerCase().includes(query)) ||
        (p.username && p.username.toLowerCase().includes(query)) ||
        (p.email && p.email.toLowerCase().includes(query))
      );
    }

    if (!peers.length) {
      els.chatList.innerHTML = query
        ? `<div class="chat-empty">No se encontraron conversaciones con "${esc(query)}".<br>Prueba en la pestaña <strong>Directorio</strong>.</div>`
        : '<div class="chat-empty">No tienes mensajes recientes.<br>Ve a la pestaña <strong>Directorio</strong> o usa la barra de búsqueda para contactar a un compañero.</div>';
      return;
    }

    // Reordenar: Los chats con mensajes más recientes siempre suben a la cima
    peers.sort((a, b) => {
      const dmA = state.directChats.find(d => d.recipient && d.recipient.id === a.id);
      const dmB = state.directChats.find(d => d.recipient && d.recipient.id === b.id);
      const timeA = dmA?.updatedAt ? new Date(dmA.updatedAt).getTime() : 0;
      const timeB = dmB?.updatedAt ? new Date(dmB.updatedAt).getTime() : 0;
      return timeB - timeA;
    });

    els.chatList.innerHTML = peers.map(peer => {
      const dm = state.directChats.find(d => d.recipient && d.recipient.id === peer.id);
      const last = dm && dm.lastMessage ? dm.lastMessage : null;
      const active = state.activeChat && state.activeChat.kind === 'direct' && dm && state.activeChat.id === dm.id;
      const online = peer.status === 'ONLINE' || peer.status === 'IDLE' || peer.status === 'DND';
      const isTyping = Boolean(state.typingUsers[peer.id] || (dm && Object.values(state.typingUsers).some(t => t.directChatId === dm.id)));
      const preview = isTyping
        ? '<span class="typing-pulse-text">✍️ Escribiendo...</span>'
        : esc(last ? (last.messageType === 'TEXT' ? last.content : 'Adjunto') : (peer.customStatus || STATUS_LABELS[peer.status] || peer.bio || ''));
      const time = last ? fmtTime(last.createdAt) : '';
      const unread = state.unreadCounts[peer.id] || (dm ? state.unreadCounts[dm.id] : 0) || 0;
      const isRecent = state.recentChatId === peer.id || (dm && state.recentChatId === dm.id);

      return `
        <button type="button" class="chat-item ${active ? 'active' : ''} ${unread > 0 ? 'has-unread' : ''} ${isRecent ? 'animate-pulse-glow' : ''}" data-peer-id="${peer.id}" ${dm ? `data-chat-id="${dm.id}"` : ''}>
          <span class="avatar-wrap">
            ${avatarHtml(peer)}
            <span class="presence-dot ${online ? 'on' : ''}" title="${esc(STATUS_LABELS[peer.status] || '')}"></span>
          </span>
          <span class="chat-meta">
            <span class="chat-title">${esc(peer.displayName)}</span>
            <span class="chat-sub ${isTyping ? 'is-typing' : ''}">${preview}</span>
          </span>
          <span class="chat-right-meta">
            <span class="chat-time">${time}</span>
            ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}
          </span>
        </button>`;
    }).join('');
  } else if (state.view === 'groups') {
    let channels = [...state.channels];
    if (query) {
      channels = channels.filter(ch =>
        ch.name.toLowerCase().includes(query) ||
        (ch.community && ch.community.name.toLowerCase().includes(query))
      );
    }

    if (!channels.length) {
      els.chatList.innerHTML = '<div class="chat-empty">No se encontraron grupos ni canales.</div>';
      return;
    }

    // Reordenar canales por actividad reciente
    channels.sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });

    els.chatList.innerHTML = channels.map(ch => {
      const active = state.activeChat && state.activeChat.kind === 'channel' && state.activeChat.id === ch.id;
      const members = (ch.community._count && ch.community._count.members) || 0;
      const unread = state.unreadCounts[ch.id] || 0;
      const isRecent = state.recentChatId === ch.id;
      const channelTypers = Object.values(state.typingUsers).filter(t => t.channelId === ch.id);
      const isTyping = channelTypers.length > 0;
      const preview = isTyping
        ? `<span class="typing-pulse-text">✍️ ${channelTypers[0].displayName.split(' ')[0]} escribe...</span>`
        : esc(`${ch.community.name} · ${members} integrantes`);

      return `
        <button type="button" class="chat-item ${active ? 'active' : ''} ${unread > 0 ? 'has-unread' : ''} ${isRecent ? 'animate-pulse-glow' : ''}" data-chat-id="${ch.id}">
          <span class="avatar" style="background:var(--accent-2);color:#fff;">${esc(initials('#' + ch.name))}</span>
          <span class="chat-meta">
            <span class="chat-title"># ${esc(ch.name)}</span>
            <span class="chat-sub ${isTyping ? 'is-typing' : ''}">${preview}</span>
          </span>
          <span class="chat-right-meta">
            <span class="chat-time"></span>
            ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}
          </span>
        </button>`;
    }).join('');
  } else {
    // Vista Directorio Completo
    let peers = state.directory.filter(u => u.id !== state.user.id);
    if (query) {
      peers = peers.filter(p =>
        (p.displayName && p.displayName.toLowerCase().includes(query)) ||
        (p.username && p.username.toLowerCase().includes(query)) ||
        (p.email && p.email.toLowerCase().includes(query)) ||
        ((ROLE_LABELS[p.globalRole] || p.globalRole) && (ROLE_LABELS[p.globalRole] || p.globalRole).toLowerCase().includes(query))
      );
    }

    if (!peers.length) {
      els.chatList.innerHTML = `<div class="chat-empty">No se encontraron contactos en el directorio con "${esc(query)}".</div>`;
      return;
    }

    peers.sort((a, b) => a.displayName.localeCompare(b.displayName));

    els.chatList.innerHTML = peers.map(peer => {
      const online = peer.status === 'ONLINE' || peer.status === 'IDLE' || peer.status === 'DND';
      return `
        <button type="button" class="chat-item" data-peer-id="${peer.id}">
          <span class="avatar-wrap">
            ${avatarHtml(peer)}
            <span class="presence-dot ${online ? 'on' : ''}" title="${esc(STATUS_LABELS[peer.status] || '')}"></span>
          </span>
          <span class="chat-meta">
            <span class="chat-title">${esc(peer.displayName)}</span>
            <span class="chat-sub">${esc(peer.email)} · ${ROLE_LABELS[peer.globalRole] || peer.globalRole}</span>
          </span>
          <span class="chat-right-meta">
            <span class="role-chip" style="color:var(--accent-2);background:var(--chip);">Chatear</span>
          </span>
        </button>`;
    }).join('');
  }

  els.chatList.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.dataset.chatId) openChat({ kind: state.view === 'groups' ? 'channel' : 'direct', id: item.dataset.chatId });
      else if (item.dataset.peerId) {
        state.view = 'direct';
        syncView();
        openDirectWith(item.dataset.peerId);
      }
    });
  });
}

// ---------- Chats ----------
async function openDirectWith(peerId) {
  let dm = state.directChats.find(d => d.recipient && d.recipient.id === peerId);
  if (!dm) {
    try {
      const res = await api('/direct-chats', { method: 'POST', body: { recipientId: peerId } });
      const other = (res.directChat.members || []).find(m => m.userId !== state.user.id);
      dm = {
        id: res.directChat.id,
        recipient: other ? other.user : null,
        lastMessage: null,
        updatedAt: res.directChat.updatedAt,
      };
      state.directChats.unshift(dm);
    } catch (e) {
      toast(e.message);
      return;
    }
  }
  await openChat({ kind: 'direct', id: dm.id });
}

async function openChat(chat) {
  if (state.activeChat && state.activeChat.id !== chat.id) {
    leaveChatRoom(state.activeChat);
  }
  state.activeChat = chat;

  // Limpiar timers y estado de typing al cambiar de chat
  Object.keys(typingTimeouts).forEach(k => clearTimeout(typingTimeouts[k]));
  state.typingUsers = {};
  updateTypingUI();

  // Limpiar conteo de no leídos de esta conversación
  delete state.unreadCounts[chat.id];
  const dm = state.directChats.find(d => d.id === chat.id);
  if (dm && dm.recipient) {
    delete state.unreadCounts[dm.recipient.id];
  }
  if (state.recentChatId === chat.id || (dm && dm.recipient && state.recentChatId === dm.recipient.id)) {
    state.recentChatId = null;
  }

  await loadMessages(chat);
  connectChatRoom(chat);

  // Emitir lectura de mensajes
  if (state.socket && state.socket.connected) {
    const payload = chat.kind === 'channel' ? { channelId: chat.id } : { directChatId: chat.id };
    state.socket.emit('message:read', payload);
  }

  renderList();
  renderHeader(chat);
  renderMessages();
  els.emptyState.classList.add('hidden');
  els.messages.classList.remove('hidden');
  els.composer.classList.remove('hidden');
  els.chatHeader.classList.remove('hidden');
  scrollToBottom();
}

async function loadMessages(chat) {
  const path = chat.kind === 'channel'
    ? `/channels/${chat.id}/messages?limit=100`
    : `/direct-chats/${chat.id}/messages?limit=100`;
  const res = await api(path);
  state.messages = res.data || [];
}

function upsertMessage(msg) {
  const idx = state.messages.findIndex(m => m.id === msg.id);
  if (idx >= 0) state.messages[idx] = msg;
  else state.messages.push(msg);
}

function renderHeader(chat) {
  if (chat.kind === 'direct') {
    const dm = state.directChats.find(d => d.id === chat.id);
    const peer = dm ? dm.recipient : null;
    setAvatar(els.chatAvatar, peer);
    els.chatName.textContent = peer ? peer.displayName : 'Usuario';
    els.chatSub.dataset.base = peer ? `${ROLE_LABELS[peer.globalRole] || peer.globalRole} · ${STATUS_LABELS[peer.status] || 'Desconectado'}` : '';
    els.chatSub.textContent = els.chatSub.dataset.base;
    els.membersBtn.classList.add('hidden');
    els.deleteChatBtn.classList.add('hidden');
  } else {
    const ch = state.channels.find(c => c.id === chat.id);
    els.chatName.textContent = '# ' + (ch ? ch.name : 'canal');
    els.chatAvatar.textContent = esc(initials(ch ? ch.name : '#'));
    els.chatAvatar.style.backgroundImage = '';
    els.chatAvatar.style.cssText = 'background:var(--accent-2);color:#fff;';
    const members = (ch && ch.community && ch.community._count && ch.community._count.members) || 0;
    els.chatSub.dataset.base = ch && ch.community ? `${ch.community.name} · ${members} integrantes` : '';
    els.chatSub.textContent = els.chatSub.dataset.base;
    els.membersBtn.classList.remove('hidden');
    const canDelete = canManageCommunity();
    els.deleteChatBtn.classList.toggle('hidden', !canDelete);
  }
}

function statusHtml(deliveryStatus) {
  const status = deliveryStatus || 'SENT';
  if (status === 'READ') {
    return `<span class="msg-status status-read" title="Leído: Núcleo de energía verde"><span class="status-energy-core"></span></span>`;
  }
  if (status === 'DELIVERED') {
    return `<span class="msg-status status-delivered" title="Entregado: Núcleo de energía blanco en destino"><span class="status-energy-core"></span></span>`;
  }
  return `<span class="msg-status status-sent" title="Enviado: Luz tenue en tránsito"><span class="status-glow-dot"></span></span>`;
}

function renderMessages() {
  if (!state.messages.length) {
    els.messagesInner.innerHTML = '<div class="chat-empty">No hay mensajes todavía. ¡Empieza la conversación!</div>';
    return;
  }
  let lastDay = null;
  els.messagesInner.innerHTML = state.messages.map(m => {
    const day = dayLabel(m.createdAt);
    const sep = day !== lastDay ? `<div class="day-sep">${esc(day)}</div>` : '';
    lastDay = day;
    const mine = m.senderId === state.user.id;
    const sender = m.sender || {};
    const isRecentlyReceived = m.id === state.recentMsgId && !mine;
    const filesHtml = (m.attachments || []).map(f => {
      const url = fixFileUrl(f.fileUrl);
      const isImg = (f.mimeType && f.mimeType.startsWith('image/')) || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.originalName || '');
      return isImg
        ? `<img class="msg-image" src="${esc(url)}" alt="${esc(f.originalName)}" title="${esc(f.originalName)}" loading="lazy" onclick="window.open('${esc(url)}', '_blank')">`
        : `<a class="file-chip" href="${esc(url)}" target="_blank" rel="noopener">
             <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
             <span class="fname">${esc(f.originalName)}</span>
           </a>`;
    }).join('');
    const reactions = (m.reactions && m.reactions.length)
      ? `<div class="msg-reactions">${m.reactions.map(r => `<span class="reaction-chip" title="${esc(r.user ? r.user.displayName : '')}">${esc(r.emoji)}</span>`).join('')}</div>`
      : '';
    const edited = m.isEdited ? ' <span class="edited">(editado)</span>' : '';
    return `${sep}
      <div class="msg ${mine ? 'out' : 'in'}">
        ${mine ? '' : avatarHtml(sender)}
        <div class="bubble ${isRecentlyReceived ? 'bubble-received-anim' : ''}">
          ${state.activeChat.kind === 'channel' && !mine ? `<span class="bubble-sender">${esc(sender.displayName || 'Usuario')}</span>` : ''}
          ${m.content && m.messageType !== 'SYSTEM' ? `<div class="bubble-text">${esc(m.content)}${edited}</div>` : ''}
          ${filesHtml}
          ${reactions}
          <div class="bubble-footer">
            <span class="bubble-time">${fmtTime(m.createdAt)}</span>
            ${mine ? statusHtml(m.deliveryStatus) : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

function fixFileUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://localhost:3001/uploads/')) return url.replace('http://localhost:3001/uploads/', '/uploads/');
  if (url.startsWith('http://localhost:3000/uploads/')) return url.replace('http://localhost:3000/uploads/', '/uploads/');
  return url;
}

function scrollToBottom() {
  requestAnimationFrame(() => { els.messages.scrollTop = els.messages.scrollHeight; });
}

// ---------- Envío de mensajes ----------
async function sendMessage() {
  const text = els.input.value.trim();
  if ((!text && !pendingFiles.length) || !state.activeChat) return;

  let attachments = null;
  if (pendingFiles.length) {
    attachments = [];
    for (const a of pendingFiles) {
      try {
        const up = await uploadFile(a.file);
        attachments.push(up);
      } catch (e) {
        toast('No se pudo subir ' + a.file.name);
        return;
      }
    }
  }

  const content = text || (attachments && attachments.length ? attachments[0].originalName : '');
  const body = { content };
  if (state.activeChat.kind === 'channel') body.channelId = state.activeChat.id;
  else body.directChatId = state.activeChat.id;
  if (attachments && attachments.length) body.attachments = attachments;

  els.input.value = '';
  autoResize();
  clearPendingFiles();

  if (state.socket && state.socket.connected && state.activeChat) {
    const payload = state.activeChat.kind === 'channel'
      ? { channelId: state.activeChat.id }
      : { directChatId: state.activeChat.id };
    state.socket.emit('typing:stop', payload);
  }

  try {
    const msg = await api('/messages', { method: 'POST', body });
    upsertMessage(msg);
    renderMessages();
    renderList();
    scrollToBottom();
  } catch (e) {
    toast(e.message);
  }
}

async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  return api('/files/upload', { method: 'POST', body: fd, isForm: true });
}

function renderAttachments() {
  if (!pendingFiles.length) {
    els.attachmentsPreview.innerHTML = '';
    return;
  }
  els.attachmentsPreview.innerHTML = pendingFiles.map((a, i) => `
    <div class="attach-chip">
      ${a.isImage
        ? `<img src="${a.url}" alt="">`
        : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`}
      <span class="name">${esc(a.file.name)}</span>
      <button type="button" class="x" data-i="${i}" title="Quitar">&times;</button>
    </div>`).join('');
  els.attachmentsPreview.querySelectorAll('.x').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = +btn.dataset.i;
      if (pendingFiles[i] && pendingFiles[i].url) URL.revokeObjectURL(pendingFiles[i].url);
      pendingFiles.splice(i, 1);
      renderAttachments();
    });
  });
}

function clearPendingFiles() {
  pendingFiles.forEach(a => { if (a.url) URL.revokeObjectURL(a.url); });
  pendingFiles.length = 0;
  els.attachmentsPreview.innerHTML = '';
}

function autoResize() {
  els.input.style.height = 'auto';
  els.input.style.height = Math.min(els.input.scrollHeight, 140) + 'px';
}

// ---------- Modal: integrantes ----------
async function openMembersModal() {
  if (!state.activeChat || state.activeChat.kind !== 'channel') return;
  const ch = state.channels.find(c => c.id === state.activeChat.id);
  if (!ch) return;
  state.modalMode = 'members';
  els.modalTitle.textContent = `Integrantes · # ${ch.name}`;
  els.modalBody.innerHTML = '<div class="chat-empty">Cargando integrantes...</div>';
  els.modal.classList.remove('hidden');

  let members = ch.community.members;
  if (!members || !members.length) {
    try {
      const res = await api(`/communities/${ch.community.id}`);
      members = res.members;
      ch.community.members = members;
    } catch (e) {
      els.modalBody.innerHTML = `<div class="empty-note">${esc(e.message)}</div>`;
      return;
    }
  }

  const total = members.length;
  els.modalBody.innerHTML = members.map(m => {
    const u = m.user || {};
    const isSelf = u.id === state.user.id;
    const myRole = state.community && state.community.userRoleInCommunity;
    const canManage = myRole === 'COMMUNITY_OWNER' || myRole === 'COMMUNITY_ADMIN';
    const roleLabel = COMM_ROLE_LABELS[m.role] || m.role;
    return `
      <div class="member-row">
        <span class="avatar-wrap">${avatarHtml(u)}<span class="presence-dot ${u.status === 'ONLINE' || u.status === 'IDLE' || u.status === 'DND' ? 'on' : ''}"></span></span>
        <div class="member-row__info">
          <strong>${esc(u.displayName || 'Usuario')}${isSelf ? ' (tú)' : ''}</strong>
          <span>${esc(ROLE_LABELS[u.globalRole] || u.globalRole)}</span>
          ${m.nickname ? `<span class="nick">${esc(m.nickname)}</span>` : ''}
        </div>
        <div class="row-actions">
          ${m.role === 'COMMUNITY_OWNER' ? `<span class="role-chip admin">${esc(roleLabel)}</span>` : `<span class="role-chip">${esc(roleLabel)}</span>`}
        </div>
      </div>`;
  }).join('') +
  `<div class="empty-note">${total} integrante${total === 1 ? '' : 's'} en total · Roles del servidor.${canManage ? ' Eres administrador.' : ''}</div>`;
}

// ---------- Modal: cuenta ----------
function openAccountModal() {
  state.modalMode = 'account';
  const u = state.user;
  els.modalTitle.textContent = 'Mi cuenta';
  els.modalBody.innerHTML = `
    <div class="account-card">
      ${avatarHtml(u, 'avatar')}
      <strong>${esc(u.displayName)}</strong>
      <span class="acc-role">${esc(ROLE_LABELS[u.globalRole] || u.globalRole)}</span>
      <span class="role-chip admin">${esc(u.email)}</span>
    </div>
    <div class="form-field">
      <label>Usuario</label>
      <input type="text" value="${esc(u.username)}" readonly>
    </div>
    <div class="form-field">
      <label>Estado</label>
      <input type="text" value="${esc(STATUS_LABELS[u.status] || u.status)}" readonly>
    </div>
    ${u.bio ? `<div class="form-field"><label>Biografía</label><textarea readonly>${esc(u.bio)}</textarea></div>` : ''}
    <div class="empty-note">Los usuarios que se registran desde la pantalla de bienvenida aparecen automáticamente en la comunidad.</div>`;
  els.modal.classList.remove('hidden');
}

// ---------- Modal: crear grupo (canal) ----------
function openCreateModal() {
  if (!canManageCommunity()) {
    toast('Solo los administradores del servidor pueden crear grupos.');
    return;
  }
  state.modalMode = 'create';
  els.modalTitle.textContent = 'Crear nuevo grupo o canal';

  const peers = state.directory.filter(u => u.id !== state.user.id);

  els.modalBody.innerHTML = `
    <div class="form-field">
      <label>Nombre del grupo / canal</label>
      <input type="text" id="cg-name" placeholder="Ej. Equipo de Diseño y UX" maxlength="50">
    </div>
    <div class="form-field">
      <label>Descripción / Tema (opcional)</label>
      <input type="text" id="cg-desc" placeholder="Ej. Coordinación y prototipos de diseño" maxlength="200">
    </div>
    <div class="form-field">
      <label>Seleccionar integrantes para agregar al grupo:</label>
      <div class="member-checklist" id="cg-members-list">
        ${peers.length ? peers.map(p => `
          <label class="member-check-item">
            <input type="checkbox" value="${p.id}" checked>
            ${avatarHtml(p, 'avatar')}
            <div class="check-info">
              <strong>${esc(p.displayName)}</strong>
              <span>${esc(p.email)} · ${ROLE_LABELS[p.globalRole] || p.globalRole}</span>
            </div>
          </label>
        `).join('') : '<div class="empty-note">No hay otros usuarios registrados aún.</div>'}
      </div>
    </div>
    <button id="cg-create" class="btn-primary" style="margin-top: 10px;">Crear y Agregar Miembros</button>`;

  els.modalBody.querySelector('#cg-create').addEventListener('click', async () => {
    const name = els.modalBody.querySelector('#cg-name').value.trim();
    const topic = els.modalBody.querySelector('#cg-desc').value.trim();
    if (!name) { toast('Escribe un nombre para el grupo.'); return; }

    const checkedBoxes = els.modalBody.querySelectorAll('#cg-members-list input[type="checkbox"]:checked');
    const selectedMemberIds = Array.from(checkedBoxes).map(cb => cb.value);

    try {
      const res = await api(`/communities/${state.community.id}/channels`, {
        method: 'POST',
        body: { name, topic },
      });
      els.modal.classList.add('hidden');
      await loadAppData();
      renderAll();
      await openChat({ kind: 'channel', id: res.channel.id });
      toast(`Grupo "# ${res.channel.name}" creado con ${selectedMemberIds.length} miembros.`);
    } catch (e) {
      toast(e.message);
    }
  });
  els.modal.classList.remove('hidden');
}

// ---------- Archivos Compartidos en el Chat ----------
function openSharedFilesModal() {
  if (!state.activeChat) return;
  const name = els.chatName.textContent;
  els.modalTitle.textContent = `Archivos Compartidos · ${name}`;

  // Extraer todos los archivos de los mensajes actuales
  const files = [];
  (state.messages || []).forEach(m => {
    (m.attachments || []).forEach(att => {
      files.push({
        ...att,
        sender: m.sender || {},
        messageCreatedAt: m.createdAt,
      });
    });
  });

  if (!files.length) {
    els.modalBody.innerHTML = '<div class="chat-empty">No se han compartido archivos ni imágenes en esta conversación todavía.</div>';
    els.modal.classList.remove('hidden');
    return;
  }

  // Ordenar los más recientes primero
  files.reverse();

  els.modalBody.innerHTML = `
    <div style="margin-bottom: 12px; font-size: 12px; color: var(--text-muted);">
      ${files.length} archivo${files.length === 1 ? '' : 's'} compartido${files.length === 1 ? '' : 's'} en este chat:
    </div>
    <div class="shared-files-grid">
      ${files.map(f => {
        const url = fixFileUrl(f.fileUrl);
        const isImg = (f.mimeType && f.mimeType.startsWith('image/')) || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.originalName || '');
        const sizeStr = f.fileSizeBytes ? `${(f.fileSizeBytes / 1024).toFixed(1)} KB` : '';
        const senderName = f.sender.displayName || 'Usuario';
        return `
          <a class="shared-file-card" href="${esc(url)}" target="_blank" rel="noopener">
            <div class="shared-file-thumb">
              ${isImg
                ? `<img src="${esc(url)}" alt="${esc(f.originalName)}" loading="lazy">`
                : `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`}
            </div>
            <div class="shared-file-meta">
              <strong>${esc(f.originalName)}</strong>
              <span>Por ${esc(senderName)} · ${fmtTime(f.messageCreatedAt)} ${sizeStr ? `(${sizeStr})` : ''}</span>
            </div>
          </a>
        `;
      }).join('')}
    </div>
  `;
  els.modal.classList.remove('hidden');
}

// ---------- Eliminar Canal / Grupo Activo ----------
async function deleteActiveChat() {
  if (!state.activeChat) return;

  if (state.activeChat.kind === 'channel') {
    const ch = state.channels.find(c => c.id === state.activeChat.id);
    const chName = ch ? `# ${ch.name}` : 'este canal';
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el grupo ${chName}? Se borrarán todos sus mensajes.`)) {
      return;
    }

    try {
      await api(`/channels/${state.activeChat.id}`, { method: 'DELETE' });
      toast(`Grupo ${chName} eliminado exitosamente`);
      await loadAppData();
      closeChatIfNotInView();
      renderAll();
    } catch (e) {
      toast(e.message);
    }
  }
}

// ---------- Vista / switch ----------
function syncView() {
  els.segBtns.forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  els.viewSwitch.dataset.view = state.view;
  closeChatIfNotInView();
  renderList();
}

function closeChatIfNotInView() {
  if (state.activeChat) {
    const inView = state.view === 'direct'
      ? state.activeChat.kind === 'direct'
      : (state.view === 'groups' ? state.activeChat.kind === 'channel' : false);
    if (!inView && state.view !== 'directory') {
      leaveChatRoom(state.activeChat);
      state.activeChat = null;
      state.messages = [];
      clearPendingFiles();
      els.chatHeader.classList.add('hidden');
      els.membersBtn.classList.add('hidden');
      els.deleteChatBtn.classList.add('hidden');
      els.messages.classList.add('hidden');
      els.composer.classList.add('hidden');
      els.emptyState.classList.remove('hidden');
      els.emptyText.textContent = state.view === 'direct'
        ? 'Selecciona un integrante para conversar.'
        : 'Selecciona un grupo para ver sus conversaciones.';
    }
  }
}

// ---------- Render general ----------
function renderAll() {
  renderProfile();
  syncView();
  if (state.activeChat) renderHeader(state.activeChat);
}

// ---------- Init ----------
function init() {
  applyTheme(localStorage.getItem(STORE_KEY_THEME) || 'light');

  // Tema
  els.themeToggle.addEventListener('click', () => {
    applyTheme(document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });
  els.authThemeToggle.addEventListener('click', () => {
    applyTheme(document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });

  // Pestañas de autenticación
  els.authTabs.forEach(btn => btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    els.authTabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    els.authTabsBox.dataset.tab = tab;
    els.loginForm.classList.toggle('hidden', tab !== 'login');
    els.registerForm.classList.toggle('hidden', tab !== 'register');
    clearAuthError();
  }));

  // Formularios
  els.loginForm.addEventListener('submit', e => { e.preventDefault(); doLogin(); });
  els.registerForm.addEventListener('submit', e => { e.preventDefault(); doRegister(); });

  // Perfil y sesión
  els.profileOpen.addEventListener('click', () => openAccountModal());
  els.logoutBtn.addEventListener('click', () => logout());

  // Switch Mensajes / Grupos / Directorio
  els.segBtns.forEach(btn => btn.addEventListener('click', () => {
    state.view = btn.dataset.view;
    syncView();
  }));

  // Buscador en tiempo real
  if (els.searchInput) {
    els.searchInput.addEventListener('input', () => renderList());
  }
  if (els.searchClear) {
    els.searchClear.addEventListener('click', () => {
      els.searchInput.value = '';
      renderList();
      els.searchInput.focus();
    });
  }

  els.newGroupBtn.addEventListener('click', openCreateModal);

  els.membersBtn.addEventListener('click', () => {
    if (state.activeChat && state.activeChat.kind === 'channel') openMembersModal();
  });

  // Botones de cabecera de chat: Archivos compartidos y Eliminar
  if (els.sharedFilesBtn) {
    els.sharedFilesBtn.addEventListener('click', openSharedFilesModal);
  }
  if (els.deleteChatBtn) {
    els.deleteChatBtn.addEventListener('click', deleteActiveChat);
  }

  // Modal
  els.modalClose.addEventListener('click', () => els.modal.classList.add('hidden'));
  els.modal.addEventListener('click', e => { if (e.target === els.modal) els.modal.classList.add('hidden'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') els.modal.classList.add('hidden'); });

  // Composer
  els.sendBtn.addEventListener('click', sendMessage);
  els.input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  els.input.addEventListener('input', () => {
    autoResize();
    emitTyping();
  });

  // Adjuntos
  els.attachBtn.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', () => {
    for (const file of els.fileInput.files) {
      const isImage = file.type.startsWith('image/');
      pendingFiles.push({ file, url: isImage ? URL.createObjectURL(file) : null, isImage });
    }
    els.fileInput.value = '';
    renderAttachments();
  });

  // Toggle mostrar / ocultar contraseña
  document.querySelectorAll('.pwd-eye-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPwd = input.type === 'password';
      input.type = isPwd ? 'text' : 'password';
      const openIco = btn.querySelector('.eye-open');
      const closedIco = btn.querySelector('.eye-closed');
      if (openIco) openIco.classList.toggle('hidden', isPwd);
      if (closedIco) closedIco.classList.toggle('hidden', !isPwd);
    });
  });

  // Copia rápida de contraseña de prueba
  const quickCopy = document.getElementById('quick-copy-pwd');
  if (quickCopy) {
    quickCopy.addEventListener('click', () => {
      navigator.clipboard.writeText('Password123!');
      toast('Contraseña copiada al portapapeles');
    });
  }

  // Cambio forzoso de contraseña
  els.forcePwdNew.addEventListener('input', validatePasswordStrength);
  els.forcePwdConfirm.addEventListener('input', validatePasswordStrength);
  els.forcePwdForm.addEventListener('submit', doForceChangePassword);

  // Panel de administración
  if (els.adminPanelBtn) {
    els.adminPanelBtn.addEventListener('click', openAdminPanelModal);
  }

  // Sesión inicial
  if (state.token) {
    api('/auth/me')
      .then(({ user }) => {
        state.user = user;
        if (user.mustChangePassword) {
          showForcePasswordModal();
        } else {
          return enterApp();
        }
      })
      .catch(() => { state.token = null; localStorage.removeItem(STORE_KEY_TOKEN); showAuth(); });
  } else {
    showAuth();
  }
}

// ---------- Indicador "escribiendo..." ----------
let typingTimer = null;
let lastTypingSent = 0;
function emitTyping() {
  if (!state.socket || !state.socket.connected || !state.activeChat) return;
  const now = Date.now();
  if (now - lastTypingSent < 1500) return;
  lastTypingSent = now;
  const payload = state.activeChat.kind === 'channel'
    ? { channelId: state.activeChat.id }
    : { directChatId: state.activeChat.id };
  state.socket.emit('typing:start', payload);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    state.socket.emit('typing:stop', payload);
  }, 2000);
}

document.addEventListener('DOMContentLoaded', init);
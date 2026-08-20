// ============================================================
// SyBorx Comunity — lógica del boceto (datos simulados)
// ============================================================

const $ = sel => document.querySelector(sel);

const els = {
  profileOpen: $('#profile-open'),
  meAvatar: $('#me-avatar'),
  meName: $('#me-name'),
  meRole: $('#me-role'),
  themeToggle: $('#theme-toggle'),
  icoMoon: $('#ico-moon'),
  icoSun: $('#ico-sun'),
  profileMenu: $('#profile-menu'),
  profileMenuList: $('#profile-menu-list'),
  viewSwitch: $('#view-switch'),
  segBtns: document.querySelectorAll('#view-switch .seg-btn'),
  listTitle: $('#list-title'),
  newGroupBtn: $('#new-group-btn'),
  chatList: $('#chat-list'),
  chatHeader: $('#chat-header'),
  chatAvatar: $('#chat-avatar'),
  chatName: $('#chat-name'),
  chatSub: $('#chat-sub'),
  membersBtn: $('#members-btn'),
  emptyState: $('#empty-state'),
  messages: $('#messages'),
  messagesInner: $('#messages-inner'),
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
  currentUserId: localStorage.getItem(STORE_KEY_USER) || 'u1',
  view: 'direct',
  activeChatId: null,
  modalMode: null, // 'members' | 'create' | 'account'
  modalGroupId: null,
};

const pendingFiles = []; // { file, url, isImage }

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Usuario actual: el Gerente General (u1) es Admin nivel 1
function currentUser() {
  const m = memberById(state.currentUserId);
  return { ...m, globalRole: m.id === 'u1' ? 'admin1' : null };
}

// ---------- Utilidades ----------
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove('show'), 2400);
}

function avatarStyle(user) {
  return `background:${user.color};color:#fff;`;
}

function resolveChat(id) {
  const g = GROUPS.find(x => x.id === id);
  if (g) return { type: 'group', data: g };
  const d = DIRECT.find(x => x.id === id);
  return d ? { type: 'direct', data: d } : null;
}

const isGroupChat = id => GROUPS.some(g => g.id === id);
const isDirectChat = id => DIRECT.some(d => d.id === id);

function lastMessageOf(chat) {
  return chat.messages.length ? chat.messages[chat.messages.length - 1] : null;
}

function groupAdmin2(group) {
  const e = group.members.find(m => m.role === 'Administrador nivel 2');
  return e ? memberById(e.memberId) : null;
}

// ¿El usuario es el administrador nivel 2 de este grupo?
function isGroupAdmin2(user, group) {
  return groupRoleOf(group, user.id) === 'Administrador nivel 2';
}

// ---------- Tema ----------
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  els.icoMoon.classList.toggle('hidden', theme === 'dark');
  els.icoSun.classList.toggle('hidden', theme !== 'dark');
  localStorage.setItem(STORE_KEY_THEME, theme);
}

// ---------- Sidebar ----------
function renderProfile() {
  const u = currentUser();
  els.meAvatar.textContent = u.initials;
  els.meAvatar.style.cssText = avatarStyle(u);
  els.meName.textContent = u.name;
  els.meRole.textContent = isAdmin1(u) ? 'Administrador nivel 1 · Gerente' : u.job;
}

function renderProfileMenu() {
  els.profileMenuList.innerHTML = `
    <button type="button" id="menu-account">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span class="menu-role"><strong>Ver cuenta</strong></span>
    </button>
    <button type="button" id="menu-logout" class="danger">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      <span class="menu-role"><strong>Cerrar sesión</strong></span>
    </button>`;
  els.profileMenuList.querySelector('#menu-account').addEventListener('click', () => {
    els.profileMenu.classList.add('hidden');
    openAccountModal();
  });
  els.profileMenuList.querySelector('#menu-logout').addEventListener('click', () => {
    els.profileMenu.classList.add('hidden');
    logout();
  });
}

function openAccountModal() {
  state.modalMode = 'account';
  const u = currentUser();
  els.modalTitle.textContent = 'Mi cuenta';
  els.modalBody.innerHTML = `
    <div class="account-card">
      <span class="avatar" style="${avatarStyle(u)}">${u.initials}</span>
      <strong>${esc(u.name)}</strong>
      <span class="acc-role">${esc(u.job)}</span>
      <span class="role-chip admin">${isAdmin1(u) ? 'Administrador nivel 1' : 'Integrante de la comunidad'}</span>
    </div>
    <div class="form-field">
      <label>Correo</label>
      <input type="text" value="${esc(u.name.toLowerCase().split(' ')[0])}@syborx.dev" readonly>
    </div>
    <div class="form-field">
      <label>Comunidad</label>
      <input type="text" value="${esc(COMMUNITY.name)}" readonly>
    </div>
    <div class="form-field">
      <label>Acceso</label>
      <input type="text" value="${isAdmin1(u) ? 'Gestiona la comunidad y crea grupos' : 'Solo participa en conversaciones y grupos'}" readonly>
    </div>`;
  els.modal.classList.remove('hidden');
}

function logout() {
  state.currentUserId = 'u1';
  localStorage.setItem(STORE_KEY_USER, 'u1');
  state.activeChatId = null;
  clearPendingFiles();
  els.chatHeader.classList.add('hidden');
  els.membersBtn.classList.add('hidden');
  els.messages.classList.add('hidden');
  els.composer.classList.add('hidden');
  els.emptyState.classList.remove('hidden');
  renderAll();
  toast('Sesión cerrada');
}

function renderList() {
  const u = currentUser();
  els.newGroupBtn.classList.toggle('hidden', !isAdmin1(u));
  els.listTitle.textContent = state.view === 'direct' ? 'Comunidad' : 'Grupos';

  if (state.view === 'direct') {
    const peers = MEMBERS.filter(m => m.id !== state.currentUserId);
    if (!peers.length) {
      els.chatList.innerHTML = '<div class="chat-empty">No hay otros integrantes.</div>';
      return;
    }
    els.chatList.innerHTML = peers.map(peer => {
      const chat = DIRECT.find(d => d.peerId === peer.id);
      const last = lastMessageOf(chat || { messages: [] });
      const active = state.activeChatId === (chat ? chat.id : null);
      return `
        <button type="button" class="chat-item ${active ? 'active' : ''}" data-chat-id="${chat ? chat.id : ''}" data-peer-id="${peer.id}">
          <span class="avatar" style="${avatarStyle(peer)}">${peer.initials}</span>
          <span class="chat-meta">
            <span class="chat-title">${esc(peer.name)}</span>
            <span class="chat-sub">${esc(last ? last.text : peer.job)}</span>
          </span>
          <span class="chat-time">${last ? last.time : ''}</span>
        </button>`;
    }).join('');
  } else {
    if (!GROUPS.length) {
      els.chatList.innerHTML = '<div class="chat-empty">Aún no hay grupos.<br>Crea tu primer equipo de trabajo.</div>';
      return;
    }
    els.chatList.innerHTML = GROUPS.map(g => {
      const last = lastMessageOf(g);
      const admin2 = groupAdmin2(g);
      const active = state.activeChatId === g.id;
      return `
        <button type="button" class="chat-item ${active ? 'active' : ''}" data-chat-id="${g.id}">
          <span class="avatar" style="background:var(--accent-2);color:#fff;">${esc(g.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())}</span>
          <span class="chat-meta">
            <span class="chat-title">${esc(g.name)}</span>
            <span class="chat-sub">${esc(g.members.length)} integrantes${admin2 ? ' · Admin nv2: ' + esc(admin2.name) : ''}</span>
            ${admin2 ? `<span class="chat-role">Admin nivel 2: ${esc(admin2.name)}</span>` : ''}
          </span>
          <span class="chat-time">${last ? last.time : ''}</span>
        </button>`;
    }).join('');
  }

  els.chatList.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', () => {
      const chatId = item.dataset.chatId;
      if (chatId) openChat(chatId);
      else if (item.dataset.peerId) openDirectWith(item.dataset.peerId);
    });
  });
}

// ---------- Chats ----------
function openDirectWith(peerId) {
  let chat = DIRECT.find(d => d.peerId === peerId);
  if (!chat) {
    chat = { id: 'd-' + peerId, peerId, messages: [] };
    DIRECT.push(chat);
  }
  openChat(chat.id);
}

function openChat(chatId) {
  state.activeChatId = chatId;
  const chat = resolveChat(chatId);
  if (!chat) return;
  renderList();
  renderHeader(chat);
  renderMessages(chat);
  els.emptyState.classList.add('hidden');
  els.messages.classList.remove('hidden');
  els.composer.classList.remove('hidden');
  els.chatHeader.classList.remove('hidden');
  scrollToBottom();
}

function renderHeader(chat) {
  const u = currentUser();
  if (chat.type === 'direct') {
    const peer = memberById(chat.data.peerId);
    els.chatAvatar.textContent = peer.initials;
    els.chatAvatar.style.cssText = avatarStyle(peer);
    els.chatName.textContent = peer.name;
    els.chatSub.textContent = peer.job;
    els.membersBtn.classList.add('hidden');
  } else {
    const g = chat.data;
    els.chatAvatar.textContent = g.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    els.chatAvatar.style.cssText = 'background:var(--accent-2);color:#fff;';
    els.chatName.textContent = g.name;
    els.chatSub.textContent = `${g.description} · ${g.members.length} integrantes`;
    els.membersBtn.classList.remove('hidden');
  }
}

function renderMessages(chat) {
  const me = currentUser().id;
  if (!chat.data.messages.length) {
    els.messagesInner.innerHTML = '<div class="chat-empty">No hay mensajes todavía. ¡Empieza la conversación!</div>';
    return;
  }
  els.messagesInner.innerHTML = chat.data.messages.map(m => {
    const from = memberById(m.from);
    const mine = m.from === me;
    const filesHtml = (m.files && m.files.length)
      ? m.files.map(f => f.isImage
          ? `<img class="msg-image" src="${f.url}" alt="${esc(f.name)}" title="${esc(f.name)}">`
          : `<span class="file-chip">
               <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
               <span class="fname">${esc(f.name)}</span>
             </span>`).join('')
      : '';
    return `
      <div class="msg ${mine ? 'out' : 'in'}">
        ${mine ? '' : `<span class="avatar" style="${avatarStyle(from)}">${from.initials}</span>`}
        <div class="bubble">
          ${chat.type === 'group' && !mine ? `<span class="bubble-sender">${esc(from.name)}</span>` : ''}
          ${m.text ? `<div class="bubble-text">${esc(m.text)}</div>` : ''}
          ${filesHtml}
          <span class="bubble-time">${m.time}</span>
        </div>
      </div>`;
  }).join('');
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    els.messages.scrollTop = els.messages.scrollHeight;
  });
}

function sendMessage() {
  const text = els.input.value.trim();
  if ((!text && !pendingFiles.length) || !state.activeChatId) return;
  const chat = resolveChat(state.activeChatId);
  if (!chat) return;
  chat.data.messages.push({
    from: currentUser().id,
    text,
    time: nowTime(),
    files: pendingFiles.splice(0).map(a => ({ name: a.file.name, isImage: a.isImage, url: a.url })),
  });
  els.input.value = '';
  autoResize();
  renderAttachments();
  renderMessages(chat);
  renderList();
  scrollToBottom();
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

function nowTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ---------- Modal: integrantes y roles ----------
function openMembersModal(groupId) {
  state.modalMode = 'members';
  state.modalGroupId = groupId;
  const g = GROUPS.find(x => x.id === groupId);
  const u = currentUser();
  const manage = canManageGroup(u, g);

  els.modalTitle.textContent = `Integrantes · ${g.name}`;
  els.modalBody.innerHTML = '';

  g.members.forEach(member => {
    const memberUser = memberById(member.memberId);
    const isAdmin1Row = member.role === 'Administrador nivel 1';
    const isAdmin2Row = member.role === 'Administrador nivel 2';
    const isSelf = member.memberId === state.currentUserId;
    const adminChip = isAdmin1Row || isAdmin2Row ? ' admin' : '';
    // El admin nivel 1 gestiona todo (puede reasignar al admin nivel 2);
    // el admin nivel 2 solo roles de integrantes comunes, nunca al admin
    // nivel 1 ni la designación de administrador nivel 2.
    const canEdit = manage && !isAdmin1Row && (isAdmin1(u) || !isAdmin2Row);

    let roleWidget = `<span class="role-chip${adminChip}">${member.role}</span>`;
    let actions = '';

    if (canEdit) {
      const options = GROUP_ROLES
        .filter(r => r !== 'Administrador nivel 1')
        .filter(r => !(isGroupAdmin2(u, g) && r === 'Administrador nivel 2'))
        .map(r => `<option value="${r}" ${r === member.role ? 'selected' : ''}>${r}</option>`)
        .join('');
      roleWidget = `<select data-member="${member.memberId}">${options}</select>`;
    }

    if (manage) {
      const removable = !isSelf && !isAdmin1Row && (isAdmin1(u) || !isAdmin2Row);
      actions = removable
        ? `<button class="mini-btn danger" data-action="remove" data-member="${member.memberId}" title="Quitar del grupo">
             <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
           </button>` : '';
    }

    els.modalBody.insertAdjacentHTML('beforeend', `
      <div class="member-row" data-row="${member.memberId}">
        <span class="avatar" style="${avatarStyle(memberUser)}">${memberUser.initials}</span>
        <div class="member-row__info">
          <strong>${memberUser.name}${isSelf ? ' (tú)' : ''}</strong>
          <span>${memberUser.job}</span>
        </div>
        <div class="row-actions">
          ${roleWidget}
          ${actions}
        </div>
      </div>`);
  });

  // Agregar integrante (solo admins del grupo)
  if (manage) {
    const available = MEMBERS.filter(m => !g.members.some(mm => mm.memberId === m.id));
    els.modalBody.insertAdjacentHTML('beforeend', `
      <div class="form-field">
        <label>Agregar integrante al grupo</label>
        <div style="display:flex;gap:8px;">
          <select id="add-member-select" style="flex:1;">
            ${available.map(m => `<option value="${m.id}">${m.name} (${m.job})</option>`).join('')}
          </select>
          <button id="add-member-btn" class="btn-primary" style="width:auto;padding:10px 16px;" ${available.length ? '' : 'disabled'}>Agregar</button>
        </div>
      </div>`);
  } else if (!manage) {
    els.modalBody.insertAdjacentHTML('beforeend', '<div class="empty-note">Solo el administrador del grupo puede modificar integrantes y roles.</div>');
  }

  // Eventos
  els.modalBody.querySelectorAll('select[data-member]').forEach(sel => {
    sel.addEventListener('change', () => {
      const gx = GROUPS.find(x => x.id === state.modalGroupId);
      const mm = gx.members.find(mm => mm.memberId === sel.dataset.member);
      if (!mm) return;
      mm.role = sel.value;
      toast(`Rol de ${memberById(mm.memberId).name} → ${mm.role}`);
      openMembersModal(state.modalGroupId); // re-render
      renderList();
      renderHeader(resolveChat(state.activeChatId));
    });
  });
  const addBtn = els.modalBody.querySelector('#add-member-btn');
  if (addBtn) addBtn.addEventListener('click', () => {
    const sel = els.modalBody.querySelector('#add-member-select');
    const id = sel.value;
    if (!id) return;
    const gx = GROUPS.find(x => x.id === state.modalGroupId);
    gx.members.push({ memberId: id, role: 'Integrante' });
    toast(`${memberById(id).name} fue agregado a ${gx.name}`);
    openMembersModal(state.modalGroupId);
    renderList();
    renderHeader(resolveChat(state.activeChatId));
  });
  els.modalBody.querySelectorAll('button[data-action="remove"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const gx = GROUPS.find(x => x.id === state.modalGroupId);
      gx.members = gx.members.filter(mm => mm.memberId !== btn.dataset.member);
      toast(`${memberById(btn.dataset.member).name} fue quitado del grupo`);
      openMembersModal(state.modalGroupId);
      renderList();
      renderHeader(resolveChat(state.activeChatId));
    });
  });

  els.modal.classList.remove('hidden');
}

// ---------- Modal: crear grupo (Admin nivel 1) ----------
function openCreateModal() {
  state.modalMode = 'create';
  els.modalTitle.textContent = 'Crear grupo de trabajo';
  els.modalBody.innerHTML = `
    <div class="form-field">
      <label>Nombre del grupo</label>
      <input type="text" id="cg-name" placeholder="Ej. Núcleo Frontend" maxlength="30">
    </div>
    <div class="form-field">
      <label>Descripción</label>
      <input type="text" id="cg-desc" placeholder="Ej. Equipo de trabajo del frontend" maxlength="60">
    </div>
    <div class="form-field">
      <label>Integrantes</label>
      <div class="check-grid" id="cg-members">
        ${MEMBERS.filter(m => m.id !== state.currentUserId).map(m => `
          <label class="check-item">
            <input type="checkbox" value="${m.id}"> ${m.name}
          </label>`).join('')}
      </div>
    </div>
    <div class="form-field">
      <label>Administrador nivel 2 (dirige solo este grupo)</label>
      <select id="cg-admin"></select>
    </div>
    <button id="cg-create" class="btn-primary">Crear grupo</button>`;

  const membersBox = els.modalBody.querySelector('#cg-members');
  const adminSel = els.modalBody.querySelector('#cg-admin');
  const syncAdmin = () => {
    const checked = [...membersBox.querySelectorAll('input:checked')].map(i => i.value);
    adminSel.innerHTML = checked.map(id =>
      `<option value="${id}">${memberById(id).name}</option>`).join('') || '<option value="">Selecciona integrantes</option>';
  };
  membersBox.querySelectorAll('input').forEach(chk => {
    chk.addEventListener('change', () => {
      chk.closest('.check-item').classList.toggle('on', chk.checked);
      syncAdmin();
    });
  });
  syncAdmin();

  els.modalBody.querySelector('#cg-create').addEventListener('click', () => {
    const name = els.modalBody.querySelector('#cg-name').value.trim();
    const desc = els.modalBody.querySelector('#cg-desc').value.trim();
    const checked = [...membersBox.querySelectorAll('input:checked')].map(i => i.value);
    const admin = adminSel.value;
    if (!name || !checked.length || !admin) {
      toast('Completa el nombre, elige integrantes y un admin nivel 2.');
      return;
    }
    const gid = 'g' + (GROUPS.length + 1) + Date.now().toString().slice(-4);
    GROUPS.push({
      id: gid,
      name,
      description: desc || 'Equipo de trabajo',
      members: [
        { memberId: state.currentUserId, role: 'Administrador nivel 1' },
        { memberId: admin, role: 'Administrador nivel 2' },
        ...checked.filter(id => id !== admin).map(id => ({ memberId: id, role: 'Integrante' })),
      ],
      messages: [],
    });
    els.modal.classList.add('hidden');
    state.view = 'groups';
    syncView();
    openChat(gid);
    toast(`Grupo "${name}" creado. ${memberById(admin).name} es admin nivel 2.`);
  });
}

// ---------- Vista / switch ----------
function syncView() {
  els.segBtns.forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  els.viewSwitch.dataset.view = state.view;
  renderList();
}

function closeChatIfNotInView() {
  if (state.activeChatId) {
    const inView = state.view === 'direct'
      ? isDirectChat(state.activeChatId)
      : isGroupChat(state.activeChatId);
    if (!inView) {
      state.activeChatId = null;
      clearPendingFiles();
      els.chatHeader.classList.add('hidden');
      els.membersBtn.classList.add('hidden');
      els.messages.classList.add('hidden');
      els.composer.classList.add('hidden');
      els.emptyState.classList.remove('hidden');
    }
  }
}

// ---------- Composer ----------
function autoResize() {
  els.input.style.height = 'auto';
  els.input.style.height = Math.min(els.input.scrollHeight, 140) + 'px';
}

// ---------- Render general ----------
function renderAll() {
  renderProfile();
  renderProfileMenu();
  syncView();
  if (state.activeChatId) {
    const chat = resolveChat(state.activeChatId);
    if (chat) {
      renderHeader(chat);
      renderMessages(chat);
    }
  }
}

// ---------- Init ----------
function init() {
  applyTheme(localStorage.getItem(STORE_KEY_THEME) || 'light');

  els.themeToggle.addEventListener('click', () => {
    const next = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });

  els.profileOpen.addEventListener('click', e => {
    e.stopPropagation();
    els.profileMenu.classList.toggle('hidden');
  });
  document.addEventListener('click', e => {
    if (!els.profileMenu.contains(e.target) && !els.profileOpen.contains(e.target)) {
      els.profileMenu.classList.add('hidden');
    }
  });

  els.segBtns.forEach(btn => btn.addEventListener('click', () => {
    state.view = btn.dataset.view;
    closeChatIfNotInView();
    syncView();
  }));

  els.newGroupBtn.addEventListener('click', () => {
    if (isAdmin1(currentUser())) openCreateModal();
  });

  els.membersBtn.addEventListener('click', () => {
    if (state.activeChatId && isGroupChat(state.activeChatId)) {
      openMembersModal(state.activeChatId);
    }
  });

  els.modalClose.addEventListener('click', () => els.modal.classList.add('hidden'));
  els.modal.addEventListener('click', e => {
    if (e.target === els.modal) els.modal.classList.add('hidden');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') els.modal.classList.add('hidden');
  });

  els.sendBtn.addEventListener('click', sendMessage);
  els.input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  els.input.addEventListener('input', autoResize);

  els.attachBtn.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', () => {
    for (const file of els.fileInput.files) {
      const isImage = file.type.startsWith('image/');
      pendingFiles.push({ file, url: isImage ? URL.createObjectURL(file) : null, isImage });
    }
    els.fileInput.value = '';
    renderAttachments();
  });

  renderAll();
  // Abre la conversación más reciente por defecto para mostrar el diseño
  if (!state.activeChatId) openChat('d-u2');
}

document.addEventListener('DOMContentLoaded', init);
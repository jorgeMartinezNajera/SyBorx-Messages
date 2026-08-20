// ============================================================
// SyBorx Comunity — datos simulados
// ============================================================

const STORE_KEY_THEME = 'syborx_theme';
const STORE_KEY_USER = 'syborx_current_user';

const COMMUNITY = {
  id: 'com-1',
  name: 'SyBorx Comunity',
  description: 'Comunidad interna de desarrollo de SyBorx',
};

// Integrantes de la comunidad
const MEMBERS = [
  { id: 'u1', name: 'Jorge Ramírez', initials: 'JR', job: 'Gerente General', color: '#1B2A4A' },
  { id: 'u2', name: 'Laura Méndez', initials: 'LM', job: 'Líder Frontend', color: '#2E4A7A' },
  { id: 'u3', name: 'Carlos Peña', initials: 'CP', job: 'Desarrollador Backend', color: '#3A5BA0' },
  { id: 'u4', name: 'Ana Torres', initials: 'AT', job: 'Diseñadora UX/UI', color: '#8A6A4F' },
  { id: 'u5', name: 'David Cruz', initials: 'DC', job: 'QA / Tester', color: '#4C6B8A' },
  { id: 'u6', name: 'María León', initials: 'ML', job: 'DevOps', color: '#6B7A94' },
  { id: 'u7', name: 'Pedro Soto', initials: 'PS', job: 'Analista de datos', color: '#6B5B95' },
];

// Roles globales: 'admin1' = Gerente General (administra la comunidad),
// cualquier otro integrante no administra la comunidad.
const memberById = id => MEMBERS.find(m => m.id === id);
const isAdmin1 = user => user.globalRole === 'admin1';

// Grupos = equipos de trabajo. Cada miembro tiene un rol dentro del grupo.
const GROUPS = [
  {
    id: 'g1',
    name: 'Núcleo Frontend',
    description: 'Equipo de trabajo del frontend',
    members: [
      { memberId: 'u2', role: 'Administrador nivel 2' },
      { memberId: 'u4', role: 'Diseñadora' },
      { memberId: 'u3', role: 'Desarrollador' },
      { memberId: 'u5', role: 'QA' },
    ],
    messages: [
      { from: 'u2', text: 'Equipo, mañana a las 10:00 hacemos el deploy de la nueva versión de la web.', time: 'Lun 17:20' },
      { from: 'u4', text: 'Perfecto, ya dejé listos los assets del rediseño liquid glass.', time: 'Lun 17:26' },
      { from: 'u3', text: 'Yo tengo lista la integración de la API de pagos.', time: 'Lun 17:31' },
      { from: 'u5', text: 'Pasé las pruebas de regresión, todo quedó en verde.', time: 'Lun 17:45' },
      { from: 'u2', text: 'Excelente. Los roles ya están asignados en el panel de gestión.', time: 'Lun 17:50' },
      { from: 'u1', text: 'Buen trabajo equipo, reviso los avances antes del deploy.', time: 'Lun 18:05' },
    ],
  },
  {
    id: 'g2',
    name: 'Backend & APIs',
    description: 'Equipo de trabajo del backend',
    members: [
      { memberId: 'u3', role: 'Administrador nivel 2' },
      { memberId: 'u6', role: 'DevOps' },
      { memberId: 'u7', role: 'Analista' },
    ],
    messages: [
      { from: 'u3', text: 'Chicos, terminé el endpoint de autenticación con refresh tokens.', time: 'Mar 09:12' },
      { from: 'u6', text: 'Lo despliego hoy en el ambiente de pruebas.', time: 'Mar 09:20' },
      { from: 'u7', text: 'Dejé el reporte de rendimiento de la API de ayer.', time: 'Mar 09:34' },
      { from: 'u3', text: 'Gracias, lo reviso y les comento si hay ajustes.', time: 'Mar 09:41' },
    ],
  },
  {
    id: 'g3',
    name: 'Dirección',
    description: 'Equipo directivo de la comunidad',
    members: [
      { memberId: 'u1', role: 'Administrador nivel 1' },
      { memberId: 'u2', role: 'Coordinadora' },
      { memberId: 'u6', role: 'Coordinadora' },
    ],
    messages: [
      { from: 'u1', text: 'Vamos a alinear objetivos para el siguiente trimestre.', time: 'Mié 08:30' },
      { from: 'u2', text: 'Preparo la propuesta de nuevas tecnologías para el frontend.', time: 'Mié 08:44' },
      { from: 'u6', text: 'Aseguro la infraestructura para soportar el crecimiento.', time: 'Mié 08:52' },
    ],
  },
];

// Conversaciones 1 a 1 con integrantes de la comunidad
const DIRECT = [
  {
    id: 'd-u2',
    peerId: 'u2',
    messages: [
      { from: 'u2', text: 'Hola Jorge, ya quedó el prototipo del login con liquid glass.', time: '08:42' },
      { from: 'u1', text: 'Genial Laura, ¿puedo verlo antes de la reunión de hoy?', time: '08:45' },
      { from: 'u2', text: 'Claro, te comparto el link ahora mismo.', time: '08:47' },
      { from: 'u2', text: 'https://syborx.dev/proto-login', time: '08:48' },
      { from: 'u1', text: 'Perfecto, lo reviso en un momento. Buen trabajo.', time: '08:50' },
    ],
  },
  {
    id: 'd-u3',
    peerId: 'u3',
    messages: [
      { from: 'u3', text: 'Jorge, el servicio de pagos quedó documentado en Swagger.', time: 'Ayer 14:10' },
      { from: 'u1', text: 'Gracias Carlos. ¿Qué falta para el deploy?', time: 'Ayer 14:18' },
      { from: 'u3', text: 'Solo la aprobación de producción.', time: 'Ayer 14:20' },
    ],
  },
  {
    id: 'd-u4',
    peerId: 'u4',
    messages: [
      { from: 'u4', text: 'Te envié la nueva guía de estilos de la comunidad.', time: 'Ayer 11:05' },
      { from: 'u1', text: 'La reviso hoy, gracias Ana.', time: 'Ayer 11:12' },
    ],
  },
  {
    id: 'd-u5',
    peerId: 'u5',
    messages: [
      { from: 'u5', text: 'El plan de pruebas del sprint quedó cargado en el tablero.', time: 'Ayer 16:40' },
    ],
  },
  {
    id: 'd-u6',
    peerId: 'u6',
    messages: [
      { from: 'u6', text: 'Los monitores de producción están al día, todo estable.', time: 'Mar 10:05' },
    ],
  },
  {
    id: 'd-u7',
    peerId: 'u7',
    messages: [
      { from: 'u7', text: 'Te pasé el análisis de métricas de uso de la plataforma.', time: 'Lun 12:22' },
    ],
  },
];

// Rol del usuario dentro de cada grupo
function groupRoleOf(group, memberId) {
  const entry = group.members.find(m => m.memberId === memberId);
  return entry ? entry.role : null;
}

// Roles disponibles para asignar dentro de un grupo
const GROUP_ROLES = [
  'Administrador nivel 2',
  'Desarrollador',
  'Diseñador',
  'QA',
  'DevOps',
  'Analista',
  'Coordinador',
  'Integrante',
];

// ¿Puede este usuario gestionar el grupo?
//  - Admin nivel 1 (Gerente General): siempre.
//  - Admin nivel 2: solo el grupo donde fue designado, y no puede tocar al admin nivel 1
//    ni cambiar la designación de administrador nivel 2.
function canManageGroup(user, group) {
  if (isAdmin1(user)) return true;
  return groupRoleOf(group, user.id) === 'Administrador nivel 2';
}
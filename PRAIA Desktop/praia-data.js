/* ───────────────────────── PRAIA · mock data ─────────────────────────
 * Modelo derivado de las capturas de la app AppSheet actual.
 * Las tablas espejan los campos vistos: Estado, Fecha, Hora, Plataforma,
 * Issue, Apartamento, Huesped, UltimaActualizacion, Agente.
 * Se añaden campos pensados para desktop: prioridad, descripción,
 * comentarios, sla, asignado, etc.
 * ────────────────────────────────────────────────────────────────────── */

const PRAIA_DATA = (() => {

  /* ───── Catálogos ───── */
  const BUILDINGS = [
    { id: '7834', name: 'Edificio 7834', address: 'Av. del Mar 7834', units: 5 },
    { id: '7830', name: 'Edificio 7830', address: 'Av. del Mar 7830', units: 4 },
    { id: '7820', name: 'Edificio 7820', address: 'Av. del Mar 7820', units: 6 },
  ];

  const APARTMENTS = [
    { id: '7834-1', building: '7834', beds: 2, baths: 1, capacity: 4 },
    { id: '7834-2', building: '7834', beds: 2, baths: 2, capacity: 4 },
    { id: '7834-3', building: '7834', beds: 3, baths: 2, capacity: 6 },
    { id: '7834-4', building: '7834', beds: 2, baths: 1, capacity: 4 },
    { id: '7834-5', building: '7834', beds: 1, baths: 1, capacity: 2 },
    { id: '7830-1', building: '7830', beds: 2, baths: 1, capacity: 4 },
    { id: '7830-2', building: '7830', beds: 3, baths: 2, capacity: 6 },
    { id: '7830-3', building: '7830', beds: 2, baths: 2, capacity: 4 },
    { id: '7830-4', building: '7830', beds: 2, baths: 1, capacity: 4 },
    { id: '7820-1', building: '7820', beds: 1, baths: 1, capacity: 2 },
    { id: '7820-2', building: '7820', beds: 2, baths: 1, capacity: 4 },
    { id: '7820-3', building: '7820', beds: 3, baths: 2, capacity: 6 },
    { id: '7820-4', building: '7820', beds: 2, baths: 2, capacity: 4 },
    { id: '7820-5', building: '7820', beds: 1, baths: 1, capacity: 2 },
    { id: '7820-6', building: '7820', beds: 2, baths: 1, capacity: 4 },
  ];

  const AGENTS = [
    { id: 'luis', name: 'Luis Mendoza',  role: 'Operaciones',  shift: 'Mañana', initials: 'LM', color: 'oklch(0.62 0.12 220)' },
    { id: 'maria', name: 'María Pérez',  role: 'Supervisora',  shift: 'Mañana', initials: 'MP', color: 'oklch(0.62 0.12 25)' },
    { id: 'jose',  name: 'José Castillo', role: 'Operaciones', shift: 'Tarde',  initials: 'JC', color: 'oklch(0.62 0.12 155)' },
    { id: 'ana',   name: 'Ana Rivas',     role: 'Limpieza',    shift: 'Mañana', initials: 'AR', color: 'oklch(0.62 0.12 70)' },
    { id: 'diego', name: 'Diego Soto',    role: 'Mantenimiento', shift: 'Tarde', initials: 'DS', color: 'oklch(0.62 0.12 300)' },
    { id: 'carla', name: 'Carla Ortega',  role: 'Operaciones', shift: 'Noche',  initials: 'CO', color: 'oklch(0.62 0.12 340)' },
  ];

  const PLATFORMS = [
    { id: 'guesty',   label: 'Guesty',    color: 'oklch(0.55 0.12 280)' },
    { id: 'airbnb',   label: 'Airbnb',    color: 'oklch(0.60 0.18 25)'  },
    { id: 'booking',  label: 'Booking',   color: 'oklch(0.50 0.16 250)' },
    { id: 'phone',    label: 'Phone',     color: 'oklch(0.50 0.05 80)'  },
    { id: 'whatsapp', label: 'WhatsApp',  color: 'oklch(0.55 0.14 145)' },
    { id: 'walkin',   label: 'Walk-in',   color: 'oklch(0.50 0.06 200)' },
    { id: 'email',    label: 'Email',     color: 'oklch(0.50 0.08 240)' },
  ];

  const ISSUE_TYPES = [
    { id: 'limpieza',   label: 'Limpieza',     icon: '✶', category: 'housekeeping' },
    { id: 'mold',       label: 'Mold',         icon: '◇', category: 'maintenance' },
    { id: 'personas',   label: '# Personas',   icon: '○', category: 'policy' },
    { id: 'plomeria',   label: 'Plomería',     icon: '◆', category: 'maintenance' },
    { id: 'ac',         label: 'A/C',          icon: '◈', category: 'maintenance' },
    { id: 'wifi',       label: 'Wi-Fi',        icon: '◉', category: 'tech' },
    { id: 'ruido',      label: 'Ruido',        icon: '◐', category: 'policy' },
    { id: 'llaves',     label: 'Llaves',       icon: '◑', category: 'access' },
    { id: 'tv',         label: 'TV',           icon: '▣', category: 'tech' },
    { id: 'cocina',     label: 'Cocina',       icon: '▤', category: 'maintenance' },
    { id: 'checkin',    label: 'Check-in',     icon: '▷', category: 'guest' },
    { id: 'checkout',   label: 'Check-out',    icon: '▶', category: 'guest' },
    { id: 'inventario', label: 'Inventario',   icon: '▦', category: 'housekeeping' },
  ];

  const STATUSES = [
    { id: 'abierto',    label: 'Abierto',    color: 'oklch(0.55 0.16 25)',  bg: 'oklch(0.96 0.025 25)'  },
    { id: 'proceso',    label: 'En Proceso', color: 'oklch(0.55 0.13 70)',  bg: 'oklch(0.96 0.035 70)'  },
    { id: 'espera',     label: 'En Espera',  color: 'oklch(0.50 0.05 270)', bg: 'oklch(0.96 0.012 270)' },
    { id: 'cerrado',    label: 'Cerrado',    color: 'oklch(0.50 0.10 155)', bg: 'oklch(0.96 0.025 155)' },
  ];

  const PRIORITIES = [
    { id: 'alta',   label: 'Alta',   color: 'oklch(0.55 0.16 25)' },
    { id: 'media',  label: 'Media',  color: 'oklch(0.60 0.13 70)' },
    { id: 'baja',   label: 'Baja',   color: 'oklch(0.55 0.04 220)' },
  ];

  const GUESTS = [
    'Ana Castillo','Pedro Ramírez','Sofía Morales','James Wilson','Camila Vega',
    'Luca Romano','Emma Schmidt','Ricardo Núñez','Isabella Costa','Marc Dubois',
    'Yuki Tanaka','Olivia Brown','Mateo Vargas','Hanna Lindqvist','Tomás Aguirre',
    'Elena Petrova','Andrés Castaño','Lucía Fernández','Noah Müller','Valentina Rojas',
  ];

  /* ───── Helpers ───── */
  const PRNG = (seed) => {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  };
  const rand = PRNG(20260524);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  const NOW = new Date('2026-05-24T18:30:00');
  const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600 * 1000);

  const fmtDate = (d) => `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  const fmtTime = (d) => d.toTimeString().slice(0,8);
  const fmtDateTime = (d) => `${fmtDate(d)} ${fmtTime(d)}`;

  /* ───── Tickets ───── */
  const sampleDescriptions = {
    limpieza: ['Toallas no cambiadas en baño principal','Cabello en las sábanas — pedir cambio completo','Polvo en superficies; visita rápida'],
    mold:     ['Manchas negras en techo del baño','Olor a humedad en clóset','Mancha visible cerca del aire'],
    personas: ['Reserva para 2 — confirmado check-in con 5 personas','Vecino reporta más personas que las contratadas','Auditoría detecta exceso de capacidad'],
    plomeria: ['Goteo constante en lavamanos','Inodoro tapado','Ducha sin presión'],
    ac:       ['No enfría — termostato en 16°','Hace ruido alto al encender','Gotea sobre la cama'],
    wifi:     ['Sin señal en habitación 2','Velocidad < 5 Mbps','Router reinicia cada 30 min'],
    ruido:    ['Vecinos reportan fiesta a las 2am','Música alta — segunda queja del día','Niños corriendo arriba'],
    llaves:   ['Cliente perdió la llave','Cerradura no abre con código','Llave de respaldo no funciona'],
    tv:       ['Smart TV no conecta a Netflix','Pantalla negra al encender','Control remoto sin pilas'],
    cocina:   ['Estufa no enciende quemador 2','Microondas no calienta','Refrigerador hace ruido'],
    checkin:  ['Late check-in solicitado','Cliente no encuentra el lockbox','Confirmar instrucciones a huésped'],
    checkout: ['Late check-out hasta 3pm','Cliente dejó equipaje','Pendiente revisión post-checkout'],
    inventario:['Faltan toallas','Cápsulas de café agotadas','Cobija extra solicitada'],
  };

  function makeTicket(i) {
    const issueT = pick(ISSUE_TYPES);
    const apt = pick(APARTMENTS);
    const plat = pick(PLATFORMS);
    const guest = pick(GUESTS);
    const ag = pick(AGENTS);

    // Distribución de estado: 25% abierto, 30% proceso, 10% espera, 35% cerrado
    const r = rand();
    let status;
    if (r < 0.25) status = STATUSES[0];
    else if (r < 0.55) status = STATUSES[1];
    else if (r < 0.65) status = STATUSES[2];
    else status = STATUSES[3];

    // Prioridad: alta para mold/plomeria/ac/llaves/personas; baja para inventario/checkout
    let prio;
    if (['mold','plomeria','ac','llaves','personas'].includes(issueT.id)) prio = PRIORITIES[Math.random() < 0.5 ? 0 : 1];
    else if (['inventario','checkout'].includes(issueT.id)) prio = PRIORITIES[2];
    else prio = pick(PRIORITIES);

    const ageHours = Math.floor(rand() * 96);
    const createdAt = hoursAgo(ageHours);
    const updatedAt = status.id === 'cerrado'
      ? hoursAgo(Math.max(0, ageHours - Math.floor(rand()*ageHours)))
      : (rand() < 0.6 ? hoursAgo(Math.max(0, ageHours - Math.floor(rand()*ageHours))) : createdAt);

    const closedAt = status.id === 'cerrado' ? updatedAt : null;
    const resolveMins = closedAt ? Math.round((closedAt - createdAt) / 60000) : null;

    const desc = sampleDescriptions[issueT.id]?.[i % 3] || 'Sin descripción detallada.';

    // SLA: alta=4h, media=12h, baja=24h
    const slaHours = prio.id === 'alta' ? 4 : prio.id === 'media' ? 12 : 24;
    const slaDeadline = new Date(createdAt.getTime() + slaHours * 3600 * 1000);

    const comments = [];
    if (status.id !== 'abierto') {
      comments.push({
        id: `c-${i}-1`,
        author: ag.id,
        ts: hoursAgo(Math.max(0, ageHours - 1)),
        text: 'Ticket recibido. Voy en camino.'
      });
    }
    if (['cerrado','espera'].includes(status.id) && rand() < 0.7) {
      comments.push({
        id: `c-${i}-2`,
        author: ag.id,
        ts: hoursAgo(Math.max(0, ageHours - 2)),
        text: status.id === 'cerrado' ? 'Resuelto en sitio. Cliente conforme.' : 'A la espera de respuesta del huésped.'
      });
    }

    return {
      id: `TK-${(1000 + i).toString()}`,
      status: status.id,
      priority: prio.id,
      platform: plat.id,
      issue: issueT.id,
      apartment: apt.id,
      guest,
      agent: ag.id,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      closedAt: closedAt ? closedAt.toISOString() : null,
      resolveMins,
      slaDeadline: slaDeadline.toISOString(),
      description: desc,
      comments,
    };
  }

  const TICKETS = Array.from({ length: 48 }, (_, i) => makeTicket(i));

  /* ───── Lookups ───── */
  const byId = (arr) => Object.fromEntries(arr.map(x => [x.id, x]));

  return {
    BUILDINGS,
    APARTMENTS,
    AGENTS,
    PLATFORMS,
    ISSUE_TYPES,
    STATUSES,
    PRIORITIES,
    TICKETS,
    NOW,
    lookups: {
      apartments: byId(APARTMENTS),
      agents: byId(AGENTS),
      platforms: byId(PLATFORMS),
      issues: byId(ISSUE_TYPES),
      statuses: byId(STATUSES),
      priorities: byId(PRIORITIES),
      buildings: byId(BUILDINGS),
    },
    fmt: { fmtDate, fmtTime, fmtDateTime,
      // Time ago: hace 2h, hace 3d
      ago(iso) {
        const d = new Date(iso);
        const diff = (NOW - d) / 1000;
        if (diff < 60) return 'ahora';
        if (diff < 3600) return `hace ${Math.floor(diff/60)}m`;
        if (diff < 86400) return `hace ${Math.floor(diff/3600)}h`;
        const days = Math.floor(diff/86400);
        return `hace ${days}d`;
      },
      // Pretty duration: "1h 24m"
      duration(mins) {
        if (mins == null) return '—';
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins/60), m = mins % 60;
        return `${h}h ${m}m`;
      }
    },
  };
})();

// Expose globally for the React app
window.PRAIA_DATA = PRAIA_DATA;

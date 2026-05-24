/* ───────────────── PRAIA · App root ───────────────── */

const { useState: useS_A, useEffect: useE_A, useMemo: useM_A, useCallback: useC_A } = React;
const { Sidebar, TopBar, Drawer, CommandPalette, Toast } = window.PraiaUI;
const PD_A = window.PRAIA_DATA;

/* ────────────── Tweaks defaults ────────────── */
const PRAIA_TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "teal",
  "density": "comfy",
  "theme": "light",
  "sidebar": "expanded"
}/*EDITMODE-END*/;

const ACCENT_MAP = {
  teal:  { ink: 'oklch(0.32 0.08 220)', mid: 'oklch(0.55 0.10 220)', soft: 'oklch(0.94 0.025 220)' },
  coral: { ink: 'oklch(0.40 0.10 35)',  mid: 'oklch(0.60 0.14 35)',  soft: 'oklch(0.94 0.035 35)'  },
  sand:  { ink: 'oklch(0.40 0.08 75)',  mid: 'oklch(0.60 0.10 75)',  soft: 'oklch(0.95 0.035 75)'  },
  indigo:{ ink: 'oklch(0.32 0.10 280)', mid: 'oklch(0.55 0.12 280)', soft: 'oklch(0.94 0.028 280)' },
};

function App() {
  const [view, setView] = useS_A('inicio');
  const [tickets, setTickets] = useS_A(PD_A.TICKETS);
  const [selectedTicket, setSelectedTicket] = useS_A(null);
  const [newTicketOpen, setNewTicketOpen] = useS_A(false);
  const [cmdOpen, setCmdOpen] = useS_A(false);
  const [externalFilters, setExternalFilters] = useS_A(null);
  const [toast, setToast] = useS_A(null);
  const [tweaks, setTweaksState] = useS_A(PRAIA_TWEAKS_DEFAULTS);
  const [editMode, setEditMode] = useS_A(false);

  /* ────────────── Edit-mode protocol ────────────── */
  useE_A(() => {
    function onMsg(e) {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setEditMode(true);
      if (d.type === '__deactivate_edit_mode') setEditMode(false);
    }
    window.addEventListener('message', onMsg);
    // Announce availability
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  function setTweak(keyOrObj, value) {
    const patch = typeof keyOrObj === 'object' ? keyOrObj : { [keyOrObj]: value };
    setTweaksState(t => ({ ...t, ...patch }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
  }
  function dismissEdit() {
    setEditMode(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  }

  /* ────────────── Keyboard shortcuts ────────────── */
  useE_A(() => {
    function onKey(e) {
      const tag = (e.target.tagName || '').toLowerCase();
      const editing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
        return;
      }
      if (editing) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setNewTicketOpen(true); }
      if (e.key === 'g' || e.key === 'G') {
        // wait for next key
        const handler = (e2) => {
          window.removeEventListener('keydown', handler, true);
          if (e2.key === 'i') setView('inicio');
          if (e2.key === 't') setView('tickets');
          if (e2.key === 'a') setView('apartments');
          if (e2.key === 'p') setView('agents');
          if (e2.key === 'm') setView('metrics');
          e2.preventDefault();
        };
        window.addEventListener('keydown', handler, true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ────────────── Ticket mutations ────────────── */
  const onMutate = useC_A((action) => {
    switch (action.type) {
      case 'open-new':
        setNewTicketOpen(true); break;
      case 'create':
        setTickets(ts => [action.ticket, ...ts]);
        setToast('Ticket creado: ' + action.ticket.id);
        break;
      case 'update':
        setTickets(ts => ts.map(t => t.id === action.id ? { ...t, ...action.patch } : t));
        setToast('Ticket ' + action.id + ' actualizado');
        break;
      case 'comment':
        setTickets(ts => ts.map(t => t.id === action.id
          ? { ...t, comments: [...t.comments, action.comment], updatedAt: new Date().toISOString() }
          : t));
        break;
      case 'bulk-status':
        setTickets(ts => ts.map(t => action.ids.includes(t.id)
          ? { ...t, status: action.value, updatedAt: new Date().toISOString() }
          : t));
        setToast(`${action.ids.length} tickets → ${PD_A.lookups.statuses[action.value].label}`);
        break;
      case 'bulk-assign':
        setTickets(ts => ts.map(t => action.ids.includes(t.id)
          ? { ...t, agent: action.value, updatedAt: new Date().toISOString() }
          : t));
        setToast(`${action.ids.length} tickets asignados a ${PD_A.lookups.agents[action.value].name}`);
        break;
      case 'bulk-delete':
        setTickets(ts => ts.filter(t => !action.ids.includes(t.id)));
        setToast(`${action.ids.length} tickets eliminados`);
        break;
    }
  }, []);

  /* ────────────── Cmdk actions ────────────── */
  const onCmdAction = useC_A((a) => {
    if (a.type === 'nav') setView(a.to);
    if (a.type === 'new-ticket') setNewTicketOpen(true);
    if (a.type === 'export-csv') setToast('Exportación CSV iniciada · 0 errores');
    if (a.type === 'filter-mine') { setView('tickets'); setExternalFilters({ mine: true }); }
    if (a.type === 'filter-status') { setView('tickets'); setExternalFilters({ status: a.value }); }
    if (a.type === 'filter-prio') { setView('tickets'); setExternalFilters({ priority: a.value }); }
    if (a.type === 'filter-apt') { setView('tickets'); setExternalFilters({ apartment: a.value }); }
  }, []);

  const onSelectTicket = useC_A((id) => setSelectedTicket(id), []);
  const onNav = useC_A((to, extFilters) => {
    setView(to);
    if (extFilters) setExternalFilters(extFilters);
  }, []);

  /* ────────────── Counts for sidebar badge ────────────── */
  const counts = useM_A(() => {
    const c = { abierto: 0, proceso: 0, espera: 0, cerrado: 0 };
    tickets.forEach(t => { c[t.status]++; });
    return c;
  }, [tickets]);

  /* ────────────── Apply theme tokens ────────────── */
  useE_A(() => {
    const root = document.documentElement;
    const ac = ACCENT_MAP[tweaks.accent] || ACCENT_MAP.teal;
    root.style.setProperty('--accent', ac.mid);
    root.style.setProperty('--accent-ink', ac.ink);
    root.style.setProperty('--accent-soft', ac.soft);
    root.classList.toggle('theme-dark', tweaks.theme === 'dark');
    root.classList.toggle('density-compact', tweaks.density === 'compact');
    root.classList.toggle('sidebar-collapsed', tweaks.sidebar === 'collapsed');
  }, [tweaks]);

  /* ────────────── View titles ────────────── */
  const titles = {
    inicio:     { title: 'Inicio',       sub: 'Tu día de un vistazo' },
    tickets:    { title: 'Tickets',      sub: `${tickets.length} totales · ${counts.abierto + counts.proceso} activos` },
    apartments: { title: 'Apartamentos', sub: `${PD_A.APARTMENTS.length} unidades · ${PD_A.BUILDINGS.length} edificios` },
    agents:     { title: 'Agentes',      sub: `${PD_A.AGENTS.length} miembros · 3 turnos activos` },
    metrics:    { title: 'Métricas',     sub: 'Analítica y tendencias' },
    inbox:      { title: 'Bandeja',      sub: 'Notificaciones y menciones' },
    reports:    { title: 'Reportes',     sub: 'Plantillas y exportes programados' },
    settings:   { title: 'Ajustes',      sub: 'Configuración del workspace' },
  };
  const t = titles[view] || titles.inicio;

  return (
    <div className={`praia-shell ${tweaks.sidebar === 'collapsed' ? 'collapsed' : ''}`}>
      <Sidebar current={view} onNav={onNav} counts={counts} collapsed={tweaks.sidebar === 'collapsed'} />

      <main className="praia-main">
        <TopBar title={t.title} subtitle={t.sub} onCmd={() => setCmdOpen(true)}>
          <button className="btn-ghost mono" onClick={() => setTweak('sidebar', tweaks.sidebar === 'collapsed' ? 'expanded' : 'collapsed')} title="Colapsar/expandir">
            {tweaks.sidebar === 'collapsed' ? '⇥' : '⇤'}
          </button>
          <button className="btn-primary" onClick={() => setNewTicketOpen(true)}>
            <span className="mono">+</span> Nuevo
          </button>
        </TopBar>

        <div className="praia-content">
          {view === 'inicio' && (
            <DashboardView tickets={tickets} onSelectTicket={onSelectTicket} onNav={onNav} />
          )}
          {view === 'tickets' && (
            <TicketsView
              tickets={tickets}
              onSelectTicket={onSelectTicket}
              onMutate={onMutate}
              externalFilters={externalFilters}
              onClearExternal={() => setExternalFilters(null)}
              dense={tweaks.density === 'compact'}
            />
          )}
          {view === 'apartments' && (
            <ApartmentsView tickets={tickets} onSelectTicket={onSelectTicket} onNav={onNav} />
          )}
          {view === 'agents' && (
            <AgentsView tickets={tickets} onSelectTicket={onSelectTicket} />
          )}
          {view === 'metrics' && (
            <MetricsView tickets={tickets} />
          )}
          {(view === 'inbox' || view === 'reports' || view === 'settings') && (
            <PlaceholderView name={view} />
          )}
        </div>
      </main>

      {/* Ticket detail drawer */}
      <Drawer open={!!selectedTicket} onClose={() => setSelectedTicket(null)}>
        {selectedTicket && (
          <TicketDrawer
            ticketId={selectedTicket}
            tickets={tickets}
            onClose={() => setSelectedTicket(null)}
            onMutate={onMutate}
          />
        )}
      </Drawer>

      {/* New ticket modal */}
      <NewTicketModal
        open={newTicketOpen}
        onClose={() => setNewTicketOpen(false)}
        onCreate={(t) => onMutate({ type: 'create', ticket: t })}
      />

      {/* Command palette */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onAction={onCmdAction}
        currentView={view}
      />

      {/* Toast */}
      <Toast message={toast} onClose={() => setToast(null)} />

      {/* Tweaks panel */}
      {editMode && (
        <TweaksPanel onClose={dismissEdit}>
          <TweakSection title="Aspecto">
            <TweakRadio
              label="Tema"
              value={tweaks.theme}
              onChange={v => setTweak('theme', v)}
              options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]}
            />
            <TweakColor
              label="Acento"
              value={tweaks.accent}
              onChange={v => setTweak('accent', v)}
              options={[
                { value: 'teal',   color: 'oklch(0.55 0.10 220)' },
                { value: 'coral',  color: 'oklch(0.60 0.14 35)' },
                { value: 'sand',   color: 'oklch(0.60 0.10 75)' },
                { value: 'indigo', color: 'oklch(0.55 0.12 280)' },
              ]}
            />
            <TweakRadio
              label="Densidad"
              value={tweaks.density}
              onChange={v => setTweak('density', v)}
              options={[{ value: 'comfy', label: 'Cómodo' }, { value: 'compact', label: 'Compacto' }]}
            />
            <TweakRadio
              label="Sidebar"
              value={tweaks.sidebar}
              onChange={v => setTweak('sidebar', v)}
              options={[{ value: 'expanded', label: 'Expandido' }, { value: 'collapsed', label: 'Colapsado' }]}
            />
          </TweakSection>
          <TweakSection title="Atajos">
            <div className="tweaks-shortcut-list">
              <div className="tw-row"><kbd className="mono">⌘K</kbd> <span>Command palette</span></div>
              <div className="tw-row"><kbd className="mono">N</kbd> <span>Nuevo ticket</span></div>
              <div className="tw-row"><kbd className="mono">G T</kbd> <span>Ir a tickets</span></div>
              <div className="tw-row"><kbd className="mono">G I</kbd> <span>Ir a inicio</span></div>
              <div className="tw-row"><kbd className="mono">G A</kbd> <span>Apartamentos</span></div>
              <div className="tw-row"><kbd className="mono">G P</kbd> <span>Personas (agentes)</span></div>
              <div className="tw-row"><kbd className="mono">G M</kbd> <span>Métricas</span></div>
            </div>
          </TweakSection>
        </TweaksPanel>
      )}

      {/* CMDK hint */}
      <div className="cmdk-hint mono" onClick={() => setCmdOpen(true)}>
        Tip · <kbd>⌘K</kbd> para buscar
      </div>
    </div>
  );
}

function PlaceholderView({ name }) {
  const titles = {
    inbox:   { title: 'Bandeja', sub: 'Notificaciones del equipo, menciones y SLA pendientes.', steps: ['Notificaciones en tiempo real', 'Filtros por tipo', 'Acciones rápidas inline'] },
    reports: { title: 'Reportes', sub: 'Plantillas de PDF/Excel y envíos programados.', steps: ['Reporte semanal por agente', 'Reporte por edificio', 'Export a contabilidad'] },
    settings:{ title: 'Ajustes', sub: 'Workspace, roles, integraciones y branding.', steps: ['Equipos y permisos', 'Integraciones (Guesty, WhatsApp)', 'API tokens', 'Auditoría'] },
  };
  const t = titles[name];
  return (
    <div className="placeholder-view">
      <div className="placeholder-card">
        <div className="ph-mark mono">[ en construcción ]</div>
        <h3>{t.title}</h3>
        <p>{t.sub}</p>
        <ul>
          {t.steps.map(s => <li key={s}>{s}</li>)}
        </ul>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);

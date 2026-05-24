/* ───────────────── PRAIA · Live app (con API real) ───────────────── */

const { useState: useS_LA, useEffect: useE_LA, useMemo: useM_LA, useCallback: useC_LA } = React;
const { Sidebar, TopBar, Drawer, CommandPalette, Toast } = window.PraiaUI;

const PRAIA_TWEAKS_DEFAULTS_LA = /*EDITMODE-BEGIN*/{
  "accent": "teal",
  "density": "comfy",
  "theme": "light",
  "sidebar": "expanded"
} /*EDITMODE-END*/;

const ACCENT_MAP_LA = {
  teal: { ink: 'oklch(0.32 0.08 220)', mid: 'oklch(0.55 0.10 220)', soft: 'oklch(0.94 0.025 220)' },
  coral: { ink: 'oklch(0.40 0.10 35)', mid: 'oklch(0.60 0.14 35)', soft: 'oklch(0.94 0.035 35)' },
  sand: { ink: 'oklch(0.40 0.08 75)', mid: 'oklch(0.60 0.10 75)', soft: 'oklch(0.95 0.035 75)' },
  indigo: { ink: 'oklch(0.32 0.10 280)', mid: 'oklch(0.55 0.12 280)', soft: 'oklch(0.94 0.028 280)' }
};

/* ═══════════════════════ Root ═══════════════════════ */
function RootApp() {
  const [phase, setPhase] = useS_LA('booting'); // booting · login · loading · ready · error · demo
  const [config, setConfig] = useS_LA(null);
  const [bootError, setBootError] = useS_LA(null);
  const [showOnboarding, setShowOnboarding] = useS_LA(false);
  const [tweaks, setTweaksState] = useS_LA(PRAIA_TWEAKS_DEFAULTS_LA);
  const [editMode, setEditMode] = useS_LA(false);

  /* ─── Boot: ver si hay config y datos ─── */
  useE_LA(() => {
    const cfg = window.PRAIA_API.getConfig();
    if (cfg && cfg.user) {
      bootstrap(cfg);
    } else {
      setPhase('login');
    }
  }, []);

  async function bootstrap(cfg) {
    setPhase('loading');
    setConfig(cfg);
    try {
      const data = await window.PRAIA_API.bootstrap();
      // Reemplaza PRAIA_DATA con la data real
      patchPraiaData(data);
      setPhase('ready');
    } catch (e) {
      setBootError(e.message);
      setPhase('error');
    }
  }

  function patchPraiaData(data) {
    const D = window.PRAIA_DATA;
    // Sheet es source of truth — reemplazar SIEMPRE con la data del API, incluso vacía
    D.TICKETS = (data.tickets || []).map((t) => {
      const normalized = normalizeTicket(t);
      // Detectar automáticamente cuál columna es el apartamento (apartment, apto, apt, apartamento)
      if (!normalized.apartment) {
        if (t.apto) normalized.apartment = t.apto;else
        if (t.apt) normalized.apartment = t.apt;else
        if (t.apartamento) normalized.apartment = t.apartamento;
      }
      return normalized;
    });

    const apts = data.apartments || [];
    D.APARTMENTS = apts.map((a) => ({
      ...a,
      beds: Number(a.beds) || 0,
      baths: Number(a.baths) || 0,
      capacity: Number(a.capacity) || 0
    }));
    D.lookups.apartments = Object.fromEntries(D.APARTMENTS.map((a) => [a.id, a]));
    // Reconstruir BUILDINGS desde APARTMENTS
    const buildingsMap = {};
    D.APARTMENTS.forEach((a) => {
      if (!buildingsMap[a.building]) {
        buildingsMap[a.building] = { id: a.building, name: `Edificio ${a.building}`, address: a.address || '', units: 0 };
      }
      buildingsMap[a.building].units++;
    });
    D.BUILDINGS = Object.values(buildingsMap);
    D.lookups.buildings = buildingsMap;

    const ags = data.agents || [];
    D.AGENTS = ags.map((a) => ({
      ...a,
      initials: (a.name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase(),
      color: a.color || 'oklch(0.55 0.10 220)'
    }));
    D.lookups.agents = Object.fromEntries(D.AGENTS.map((a) => [a.id, a]));

    const issues = data.issues || [];
    D.ISSUE_TYPES = issues.map((i) => ({
      ...i,
      id: i.id || i.label?.toLowerCase(),
      label: i.label || i.id,
      icon: i.icon || '•',
      category: i.category || 'other',
    }));
    D.lookups.issues = Object.fromEntries(D.ISSUE_TYPES.map((i) => [i.id, i]));

    const plats = data.platforms || [];
    D.PLATFORMS = plats.map((p) => ({
      ...p,
      id: p.id || p.label?.toLowerCase(),
      label: p.label || p.id,
      color: p.color || 'oklch(0.55 0.10 220)',
    }));
    D.lookups.platforms = Object.fromEntries(D.PLATFORMS.map((p) => [p.id, p]));
  }

  function normalizeTicket(t) {
    return {
      ...t,
      createdAt: toISO(t.createdAt),
      updatedAt: toISO(t.updatedAt),
      closedAt: t.closedAt ? toISO(t.closedAt) : null,
      slaDeadline: toISO(t.slaDeadline),
      resolveMins: t.closedAt && t.createdAt ?
      Math.round((new Date(t.closedAt) - new Date(t.createdAt)) / 60000) :
      null,
      comments: []
    };
  }
  function toISO(v) {
    if (!v) return null;
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'string') {
      // Si ya es ISO, parse y vuelve; si no, asume Sheet date
      const d = new Date(v);
      return isNaN(d) ? v : d.toISOString();
    }
    return String(v);
  }

  async function handleLogin(email, password) {
    const user = await window.PRAIA_API.login(email, password);
    const cfg = window.PRAIA_API.getConfig();
    await bootstrap(cfg);
    return user;
  }

  function handleDemo() {
    setConfig({ apiUrl: null, email: null, user: { id: 'demo', email: 'demo@praia.com', name: 'Demo User', role: 'admin' } });
    setPhase('ready');
  }

  function handleLogout() {
    window.PRAIA_API.logout();
    setConfig(null);
    setPhase('login');
    // Restaurar mock data en caso de relogin
    window.location.reload();
  }

  /* ─── Edit-mode protocol ─── */
  useE_LA(() => {
    function onMsg(e) {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setEditMode(true);
      if (d.type === '__deactivate_edit_mode') setEditMode(false);
    }
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  function setTweak(keyOrObj, value) {
    const patch = typeof keyOrObj === 'object' ? keyOrObj : { [keyOrObj]: value };
    setTweaksState((t) => ({ ...t, ...patch }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
  }
  function dismissEdit() {
    setEditMode(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  }

  /* ─── Apply theme tokens ─── */
  useE_LA(() => {
    const root = document.documentElement;
    const ac = ACCENT_MAP_LA[tweaks.accent] || ACCENT_MAP_LA.teal;
    root.style.setProperty('--accent', ac.mid);
    root.style.setProperty('--accent-ink', ac.ink);
    root.style.setProperty('--accent-soft', ac.soft);
    root.classList.toggle('theme-dark', tweaks.theme === 'dark');
    root.classList.toggle('density-compact', tweaks.density === 'compact');
    root.classList.toggle('sidebar-collapsed', tweaks.sidebar === 'collapsed');
  }, [tweaks]);

  /* ─── Render ─── */
  if (phase === 'booting') {
    return <BootSplash />;
  }
  if (phase === 'login') {
    return <LoginScreen onLogin={handleLogin} onDemo={handleDemo} />;
  }
  if (phase === 'loading') {
    return <BootSplash text="Cargando datos desde tu Sheet..." />;
  }
  if (phase === 'error') {
    return <ErrorScreen error={bootError} onRetry={() => bootstrap(config)} onLogout={handleLogout} />;
  }

  return <ConnectedApp
    config={config}
    liveMode={!!config?.apiUrl}
    onLogout={handleLogout}
    tweaks={tweaks}
    setTweak={setTweak}
    editMode={editMode}
    dismissEdit={dismissEdit} />;

}

/* ═══════════════════════ Login screen ═══════════════════════ */
function LoginScreen({ onLogin, onDemo }) {
  const [email, setEmail] = useS_LA('');
  const [password, setPassword] = useS_LA('');
  const [loading, setLoading] = useS_LA(false);
  const [error, setError] = useS_LA(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-mark">
            <svg viewBox="0 0 32 32" width="36" height="36">
              <defs>
                <linearGradient id="lg-praia" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.75 0.10 220)" />
                  <stop offset="100%" stopColor="oklch(0.45 0.10 220)" />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="15" fill="url(#lg-praia)" />
              <path d="M 3 22 Q 9 18 16 22 T 29 22 L 29 29 L 3 29 Z" fill="oklch(0.99 0.005 80)" opacity="0.85" />
              <circle cx="23" cy="9" r="2.5" fill="oklch(0.99 0.005 80)" opacity="0.9" />
            </svg>
          </div>
          <h1>PRAIA</h1>
          <p className="login-sub">Inicia sesión</p>
        </div>

        <div className="login-form">
          <div className="praia-field">
            <label className="mono">Email</label>
            <input
              className="praia-input"
              type="email"
              placeholder="tu-email@dominio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading} />
            
          </div>
          <div className="praia-field">
            <label className="mono">Contraseña</label>
            <input
              className="praia-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              autoComplete="current-password"
              disabled={loading} />
            
          </div>

          {error &&
          <div className="login-error">
              <span className="mono">⚠</span> {error}
            </div>
          }

          <button className="btn-primary login-submit" disabled={loading || !email || !password} onClick={submit}>
            {loading ? 'Iniciando...' : 'Entrar →'}
          </button>
        </div>
      </div>

      <div className="login-footer mono">
        PRAIA · v2
      </div>
    </div>);

}

/* ═══════════════════════ Boot splash ═══════════════════════ */
function BootSplash({ text = 'Iniciando PRAIA...' }) {
  return (
    <div className="boot-splash">
      <div className="boot-mark">
        <svg viewBox="0 0 32 32" width="48" height="48">
          <defs>
            <linearGradient id="bs-praia" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.75 0.10 220)" />
              <stop offset="100%" stopColor="oklch(0.45 0.10 220)" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill="url(#bs-praia)" />
        </svg>
      </div>
      <div className="boot-spinner" />
      <p className="boot-text mono">{text}</p>
    </div>);

}

/* ═══════════════════════ Error screen ═══════════════════════ */
function ErrorScreen({ error, onRetry, onLogout }) {
  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <h1 style={{ color: 'var(--crit)' }}>⚠</h1>
          <p className="login-sub">No se pudo conectar</p>
        </div>
        <div className="login-form">
          <div className="login-error">
            <strong>Error:</strong> {error}
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            Verifica que la URL <code className="mono inline">/exec</code> sea correcta, que tu email esté en la hoja <code className="mono inline">Users</code> con <code className="mono inline">active=TRUE</code>, y que el deploy esté configurado con "Anyone" en "Who has access".
          </p>
          <button className="btn-primary login-submit" onClick={onRetry}>Reintentar</button>
          <button className="btn-ghost login-demo" onClick={onLogout}>Cambiar configuración</button>
        </div>
      </div>
    </div>);

}

/* ═══════════════════════ Connected App ═══════════════════════ */
function ConnectedApp({ config, liveMode, onLogout, tweaks, setTweak, editMode, dismissEdit }) {
  const PD = window.PRAIA_DATA;
  const [view, setView] = useS_LA('inicio');
  const [viewParams, setViewParams] = useS_LA({});
  const [showOnboarding, setShowOnboarding] = useS_LA(false);
  const [tickets, setTickets] = useS_LA(PD.TICKETS);
  const [selectedTicket, setSelectedTicket] = useS_LA(null);
  const [newTicketOpen, setNewTicketOpen] = useS_LA(false);
  const [cmdOpen, setCmdOpen] = useS_LA(false);
  const [externalFilters, setExternalFilters] = useS_LA(null);
  const [toast, setToast] = useS_LA(null);
  const [syncStatus, setSyncStatus] = useS_LA('idle'); // idle · syncing · error

  const currentUser = config?.user;

  /* ─── Keyboard shortcuts ─── */
  useE_LA(() => {
    function onKey(e) {
      const tag = (e.target.tagName || '').toLowerCase();
      const editing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();setCmdOpen((v) => !v);return;
      }
      if (editing) return;
      if (e.key === 'n' || e.key === 'N') {e.preventDefault();setNewTicketOpen(true);}
      if (e.key === 'g' || e.key === 'G') {
        const handler = (e2) => {
          window.removeEventListener('keydown', handler, true);
          if (e2.key === 'i') setView('inicio');
          if (e2.key === 't') setView('tickets');
          if (e2.key === 'a') setView('apartments');
          if (e2.key === 'p') setView('agents');
          if (e2.key === 'm') setView('metrics');
          if (e2.key === 'l') setView('audit');
          e2.preventDefault();
        };
        window.addEventListener('keydown', handler, true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ─── Mutations: optimistic + API ─── */
  const onMutate = useC_LA(async (action) => {
    switch (action.type) {
      case 'open-new':
        setNewTicketOpen(true);
        return;

      case 'create':{
          const optimistic = { ...action.ticket };
          setTickets((ts) => [optimistic, ...ts]);
          setToast('Ticket creado: ' + optimistic.id);
          if (liveMode) {
            setSyncStatus('syncing');
            try {
              const saved = await window.PRAIA_API.post('create', { ticket: action.ticket });
              // Reemplaza el optimistic con el real (que viene con id final)
              setTickets((ts) => ts.map((t) => t.id === optimistic.id ? { ...saved, comments: [] } : t));
              setSyncStatus('idle');
            } catch (e) {
              setToast('⚠ No se pudo guardar: ' + e.message);
              setTickets((ts) => ts.filter((t) => t.id !== optimistic.id));
              setSyncStatus('error');
            }
          }
          return;
        }

      case 'update':{
          setTickets((ts) => ts.map((t) => t.id === action.id ? { ...t, ...action.patch } : t));
          setToast('Ticket ' + action.id + ' actualizado');
          if (liveMode) {
            setSyncStatus('syncing');
            try {
              await window.PRAIA_API.post('update', { id: action.id, patch: action.patch });
              setSyncStatus('idle');
            } catch (e) {
              setToast('⚠ No se pudo guardar: ' + e.message);
              setSyncStatus('error');
            }
          }
          return;
        }

      case 'comment':{
          setTickets((ts) => ts.map((t) => t.id === action.id ?
          { ...t, comments: [...(t.comments || []), action.comment], updatedAt: new Date().toISOString() } :
          t));
          if (liveMode) {
            try {await window.PRAIA_API.post('comment', { id: action.id, comment: action.comment });}
            catch (e) {setToast('⚠ Comentario no sincronizado: ' + e.message);}
          }
          return;
        }

      case 'bulk-status':{
          setTickets((ts) => ts.map((t) => action.ids.includes(t.id) ?
          { ...t, status: action.value, updatedAt: new Date().toISOString() } : t));
          setToast(`${action.ids.length} tickets → ${PD.lookups.statuses[action.value]?.label}`);
          if (liveMode) {
            try {await window.PRAIA_API.post('bulk-status', { ids: action.ids, value: action.value });}
            catch (e) {setToast('⚠ Bulk no sincronizado: ' + e.message);}
          }
          return;
        }

      case 'bulk-assign':{
          setTickets((ts) => ts.map((t) => action.ids.includes(t.id) ?
          { ...t, agent: action.value, updatedAt: new Date().toISOString() } : t));
          setToast(`${action.ids.length} tickets asignados a ${PD.lookups.agents[action.value]?.name}`);
          if (liveMode) {
            try {await window.PRAIA_API.post('bulk-assign', { ids: action.ids, value: action.value });}
            catch (e) {setToast('⚠ Bulk no sincronizado: ' + e.message);}
          }
          return;
        }

      case 'bulk-delete':{
          const toDelete = action.ids;
          setTickets((ts) => ts.filter((t) => !toDelete.includes(t.id)));
          setToast(`${toDelete.length} tickets eliminados`);
          if (liveMode) {
            try {await window.PRAIA_API.post('bulk-delete', { ids: toDelete });}
            catch (e) {setToast('⚠ Eliminación no sincronizada: ' + e.message);}
          }
          return;
        }
    }
  }, [liveMode]);

  /* ─── Cmdk ─── */
  const onCmdAction = useC_LA((a) => {
    if (a.type === 'nav') setView(a.to);
    if (a.type === 'new-ticket') setNewTicketOpen(true);
    if (a.type === 'export-csv') setToast('Exportación CSV (próxima iteración)');
    if (a.type === 'filter-mine') {setView('tickets');setExternalFilters({ mine: true });}
    if (a.type === 'filter-status') {setView('tickets');setExternalFilters({ status: a.value });}
    if (a.type === 'filter-prio') {setView('tickets');setExternalFilters({ priority: a.value });}
    if (a.type === 'filter-apt') {setView('tickets');setExternalFilters({ apartment: a.value });}
  }, []);

  const onSelectTicket = useC_LA((id) => setSelectedTicket(id), []);
  const onNav = useC_LA((to, extFilters) => {
    if (to === 'apartment-detail') {
      setView('apartment-detail');
      setViewParams(extFilters);
    } else {
      setView(to);
      if (extFilters) setExternalFilters(extFilters);
    }
  }, []);

  const counts = useM_LA(() => {
    const c = { abierto: 0, proceso: 0, espera: 0, cerrado: 0 };
    tickets.forEach((t) => {if (c[t.status] != null) c[t.status]++;});
    return c;
  }, [tickets]);

  const titles = {
    inicio: { title: 'Inicio', sub: 'Tu día de un vistazo' },
    tickets: { title: 'Tickets', sub: `${tickets.length} totales · ${counts.abierto + counts.proceso} activos` },
    apartments: { title: 'Apartamentos', sub: `${PD.APARTMENTS.length} unidades · ${PD.BUILDINGS.length} edificios` },
    agents: { title: 'Agentes', sub: `${PD.AGENTS.length} miembros` },
    metrics: { title: 'Métricas', sub: 'Analítica y tendencias' },
    audit: { title: 'Auditoría', sub: 'Quién hizo qué y cuándo' },
    team: { title: 'Equipo', sub: 'Miembros y permisos' }
  };
  const t = titles[view] || titles.inicio;

  return (
    <div className={`praia-shell ${tweaks.sidebar === 'collapsed' ? 'collapsed' : ''}`}>
      <SidebarLive
        current={view}
        onNav={onNav}
        counts={counts}
        collapsed={tweaks.sidebar === 'collapsed'}
        currentUser={currentUser}
        liveMode={liveMode}
        syncStatus={syncStatus}
        onLogout={onLogout} />
      

      <main className="praia-main">
        <TopBar title={t.title} subtitle={t.sub} onCmd={() => setCmdOpen(true)}>
          <ConnectionBadge liveMode={liveMode} syncStatus={syncStatus} />
          <button className="btn-ghost mono" onClick={() => setTweak('sidebar', tweaks.sidebar === 'collapsed' ? 'expanded' : 'collapsed')}>
            {tweaks.sidebar === 'collapsed' ? '⇥' : '⇤'}
          </button>
          {liveMode && <button className="btn-ghost-sm mono" onClick={onLogout} title="Cerrar sesión">sesión · {currentUser?.name?.split(' ')[0]}</button>}
          <button className="btn-primary" onClick={() => setNewTicketOpen(true)}>
            <span className="mono">+</span> Nuevo
          </button>
        </TopBar>

        <div className="praia-content">
          {view === 'inicio' && <DashboardView tickets={tickets} onSelectTicket={onSelectTicket} onNav={onNav} currentUser={currentUser} />}
          {view === 'tickets' && <TicketsView
            tickets={tickets}
            onSelectTicket={onSelectTicket}
            onMutate={onMutate}
            externalFilters={externalFilters}
            onClearExternal={() => setExternalFilters(null)}
            dense={tweaks.density === 'compact'} />
          }
          {view === 'apartments' && <ApartmentsView tickets={tickets} onSelectTicket={onSelectTicket} onNav={onNav} />}
          {view === 'apartment-detail' && <ApartmentDetailView tickets={tickets} aptId={viewParams.aptId} onSelectTicket={onSelectTicket} onNav={onNav} onBack={() => setView('apartments')} />}
          {view === 'agents' && <AgentsView tickets={tickets} onSelectTicket={onSelectTicket} currentUser={currentUser} onNav={onNav} />}
          {view === 'agent-detail' && <AgentDetailView tickets={tickets} agentId={viewParams.agentId} onSelectTicket={onSelectTicket} onNav={onNav} onBack={() => setView('agents')} />}
          {view === 'metrics' && <MetricsView tickets={tickets} />}
          {view === 'audit' && <AuditView liveMode={liveMode} currentUser={currentUser} />}
          {view === 'team' && <TeamView liveMode={liveMode} currentUser={currentUser} onToast={setToast} />}
        </div>
      </main>

      {/* FAB - Floating Action Button */}
      <button className="fab-new-ticket" onClick={() => setNewTicketOpen(true)} title="Nuevo ticket (N)">+</button>

      {/* Onboarding overlay */}
      {showOnboarding && <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />}

      <Drawer open={!!selectedTicket} onClose={() => setSelectedTicket(null)}>
        {selectedTicket &&
        <TicketDrawer
          ticketId={selectedTicket}
          tickets={tickets}
          onClose={() => setSelectedTicket(null)}
          onMutate={onMutate} />

        }
      </Drawer>

      <NewTicketModal
        open={newTicketOpen}
        onClose={() => setNewTicketOpen(false)}
        onCreate={(t) => onMutate({ type: 'create', ticket: t })}
        currentUser={currentUser} />
      

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onAction={onCmdAction} currentView={view} />
      <Toast message={toast} onClose={() => setToast(null)} />

      {editMode &&
      <TweaksPanel onClose={dismissEdit}>
          <TweakSection title="Aspecto">
            <TweakRadio label="Tema" value={tweaks.theme} onChange={(v) => setTweak('theme', v)}
          options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]} />
            <TweakColor label="Acento" value={tweaks.accent} onChange={(v) => setTweak('accent', v)}
          options={[
          { value: 'teal', color: 'oklch(0.55 0.10 220)' },
          { value: 'coral', color: 'oklch(0.60 0.14 35)' },
          { value: 'sand', color: 'oklch(0.60 0.10 75)' },
          { value: 'indigo', color: 'oklch(0.55 0.12 280)' }]
          } />
            <TweakRadio label="Densidad" value={tweaks.density} onChange={(v) => setTweak('density', v)}
          options={[{ value: 'comfy', label: 'Cómodo' }, { value: 'compact', label: 'Compacto' }]} />
          </TweakSection>
          <TweakSection title="Sesión">
            <div className="tw-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <div className="mono small">Conectado como</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{currentUser?.name}</div>
              <div className="mono small">{currentUser?.email} · {currentUser?.role}</div>
              <button className="btn-ghost-sm mono" onClick={onLogout} style={{ marginTop: 8 }}>Cerrar sesión</button>
            </div>
          </TweakSection>
        </TweaksPanel>
      }
    </div>);

}

/* ═══════════════════════ Sidebar Live (extended) ═══════════════════════ */
function SidebarLive({ current, onNav, counts, collapsed, currentUser, liveMode, syncStatus, onLogout }) {
  const items = [
  { id: 'inicio', label: 'Inicio', icon: 'H', kbd: 'G I' },
  { id: 'tickets', label: 'Tickets', icon: 'T', kbd: 'G T', badge: counts.abierto + counts.proceso },
  { id: 'apartments', label: 'Apartamentos', icon: 'A', kbd: 'G A' },
  { id: 'agents', label: 'Agentes', icon: 'P', kbd: 'G P' },
  { id: 'metrics', label: 'Métricas', icon: 'M', kbd: 'G M' }];

  const admin = [
  { id: 'audit', label: 'Auditoría', icon: 'L', kbd: 'G L' },
  { id: 'team', label: 'Equipo', icon: 'E' }];


  return (
    <nav className={`praia-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <defs>
              <linearGradient id="praiagrad-live" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.75 0.10 220)" />
                <stop offset="100%" stopColor="oklch(0.45 0.10 220)" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="11" fill="url(#praiagrad-live)" />
            <path d="M 3 16 Q 7 13 12 16 T 21 16 L 21 21 L 3 21 Z" fill="oklch(0.99 0.005 80)" opacity="0.8" />
            <circle cx="17" cy="7" r="2" fill="oklch(0.99 0.005 80)" opacity="0.9" />
          </svg>
        </div>
        {!collapsed &&
        <div className="brand-text">
            <div className="brand-name">PRAIA</div>
            <div className="brand-sub mono">{liveMode ? 'live · sheets' : 'demo data'}</div>
          </div>
        }
      </div>

      <div className="nav-group">
        {!collapsed && <div className="nav-label">Principal</div>}
        {items.map((it) =>
        <button key={it.id} className={`nav-item ${current === it.id ? 'active' : ''}`} onClick={() => onNav(it.id)} title={collapsed ? it.label : ''}>
            <span className="nav-icon mono">{it.icon}</span>
            {!collapsed && <span className="nav-label-text">{it.label}</span>}
            {!collapsed && it.badge != null && it.badge > 0 && <span className="nav-badge">{it.badge}</span>}
            {!collapsed && it.kbd && <span className="nav-kbd mono">{it.kbd}</span>}
          </button>
        )}
      </div>

      <div className="nav-group">
        {!collapsed && <div className="nav-label">Administración</div>}
        {admin.map((it) =>
        <button key={it.id} className={`nav-item ${current === it.id ? 'active' : ''}`} onClick={() => onNav(it.id)} title={collapsed ? it.label : ''}>
            <span className="nav-icon mono">{it.icon}</span>
            {!collapsed && <span className="nav-label-text">{it.label}</span>}
            {!collapsed && it.kbd && <span className="nav-kbd mono">{it.kbd}</span>}
          </button>
        )}
      </div>

      <div className="nav-spacer" />

      {liveMode &&
      <div className="nav-footer">
          <ProfileMenu user={currentUser} onLogout={onLogout} />
        </div>
      }
    </nav>);

}

/* Profile dropdown menu */
function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="profile-menu-wrapper">
      <button className="profile-menu-btn" onClick={() => setOpen(!open)} title={user?.name}>
        <div className="profile-avatar" style={user?.photo ? { backgroundImage: `url(${user.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', background: 'oklch(0.55 0.10 220)' } : { background: 'oklch(0.55 0.10 220)' }}>
          {!user?.photo && (user?.name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        {!open && <span className="profile-caret">▼</span>}
      </button>
      {open &&
      <div className="profile-menu-popup">
          <div className="profile-popup-head">
            <div className="profile-avatar" style={user?.photo ? { width: 44, height: 44, fontSize: 14, backgroundImage: `url(${user.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', background: 'oklch(0.55 0.10 220)' } : { width: 44, height: 44, fontSize: 14, background: 'oklch(0.55 0.10 220)' }}>
              {!user?.photo && (user?.name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <div className="profile-name">{user?.name}</div>
              <div className="profile-email mono">{user?.email}</div>
              <div className="profile-role mono">{user?.role || 'agent'} · {user?.shift || '—'}</div>
            </div>
          </div>
          <div className="profile-menu-divider" />
          <div className="profile-menu-divider" />
          <button className="profile-menu-item danger" onClick={() => {setOpen(false);onLogout();}}>
            <span className="icon">↪</span> Cerrar sesión
          </button>
        </div>
      }
    </div>);

}

function ConnectionBadge({ liveMode, syncStatus }) {
  if (!liveMode) {
    return <span className="conn-badge demo mono"><span className="demo-dot" /> demo</span>;
  }
  if (syncStatus === 'syncing') return <span className="conn-badge syncing mono"><span className="sync-spin" /> sync</span>;
  if (syncStatus === 'error') return <span className="conn-badge error mono"><span className="error-dot" /> error</span>;
  return <span className="conn-badge live mono"><span className="status-dot" /> live</span>;
}

/* ═══════════════════════ Onboarding ═══════════════════════ */
function OnboardingOverlay({ onComplete }) {
  const [step, setStep] = React.useState(0);
  
  const steps = [
    {
      title: '👋 Bienvenido a PRAIA',
      desc: 'Tu plataforma de gestión de tickets para apartamentos. Vamos a hacer un recorrido rápido.',
      hint: 'Presiona siguiente para continuar'
    },
    {
      title: '🎫 Crear tickets',
      desc: 'Usa el botón + flotante (abajo a la derecha) para crear un nuevo ticket en cualquier momento. Define apartamento, tipo de issue, prioridad y descripción.',
      hint: 'Los tickets se sincronizan automáticamente con tu Sheet'
    },
    {
      title: '📋 Vista de tickets',
      desc: 'Aquí ves todos tus tickets. Filtra por estado, prioridad, plataforma o agente. Haz click en uno para ver detalles y comentarios.',
      hint: 'Usa G+T para ir rápido a esta vista'
    },
    {
      title: '🏢 Apartamentos',
      desc: 'Ve el estado de cada apartamento: cuántos tickets abiertos, críticos y resueltos. Haz click para ver el histórico completo.',
      hint: 'Usa G+A para ir rápido a esta vista'
    },
    {
      title: '👥 Agentes (solo admin)',
      desc: 'Si eres admin, ves el rendimiento de tu equipo: tickets resueltos, SLA cumplido, tiempo medio. Haz click en un agente para ver su histórico.',
      hint: 'Usa G+P para ir rápido a esta vista'
    },
    {
      title: '⚡ Atajos de teclado',
      desc: 'Presiona ? para ver todos los atajos. Los principales: G+I (Inicio), G+T (Tickets), G+A (Apartamentos), N (Nuevo ticket).',
      hint: 'Aprenderlos acelera tu flujo de trabajo'
    },
    {
      title: '🎯 ¡Listo!',
      desc: 'Ya estás listo para usar PRAIA. Si tienes dudas, vuelve a este tutorial desde el menú de perfil (abajo a la izquierda).',
      hint: 'Presiona finalizar para empezar'
    }
  ];
  
  const current = steps[step];
  const isLast = step === steps.length - 1;
  
  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <div className="onboarding-progress">
            <div className="onboarding-step-indicator">Paso {step + 1} de {steps.length}</div>
            <div className="onboarding-bar">
              <div className="onboarding-bar-fill" style={{ width: ((step + 1) / steps.length * 100) + '%' }} />
            </div>
          </div>
          <button className="onboarding-close" onClick={onComplete}>×</button>
        </div>
        
        <div className="onboarding-body">
          <div className="onboarding-icon">{current.title.split(' ')[0]}</div>
          <h2 className="onboarding-title">{current.title.split(' ').slice(1).join(' ')}</h2>
          <p className="onboarding-desc">{current.desc}</p>
          <p className="onboarding-hint">{current.hint}</p>
        </div>
        
        <div className="onboarding-footer">
          <button className="btn-ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>← Anterior</button>
          <button className="btn-primary" onClick={() => isLast ? onComplete() : setStep(step + 1)}>
            {isLast ? 'Finalizar' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<RootApp />);
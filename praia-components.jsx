/* ───────────────────────── PRAIA · components ─────────────────────────
 * Shared atomic UI: Sidebar, TopBar, Badge, Avatar, Drawer, KPICard,
 * Sparkline, FilterChip, etc. All assume the design tokens in the host
 * stylesheet.
 * ────────────────────────────────────────────────────────────────────── */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const D = window.PRAIA_DATA;

/* ────────────── Tiny utilities ────────────── */
function classNames(...xs) { return xs.filter(Boolean).join(' '); }

/* ────────────── Avatar (initials disc) ────────────── */
function Avatar({ agent, size = 28 }) {
  if (!agent) return null;
  return (
    <span
      className="praia-avatar"
      style={{
        width: size, height: size,
        background: agent.color,
        fontSize: size * 0.42,
      }}
      title={agent.name}
    >
      {agent.initials}
    </span>
  );
}

/* ────────────── Status pill ────────────── */
function StatusPill({ statusId, dense }) {
  const s = D.lookups.statuses[statusId];
  if (!s) return null;
  return (
    <span
      className={classNames('praia-status', dense && 'dense')}
      style={{ color: s.color, background: s.bg, borderColor: 'transparent' }}
    >
      <span className="dot" style={{ background: s.color }}></span>
      {s.label}
    </span>
  );
}

/* ────────────── Priority indicator ────────────── */
function PriorityBars({ priorityId }) {
  const p = D.lookups.priorities[priorityId];
  if (!p) return null;
  const level = priorityId === 'alta' ? 3 : priorityId === 'media' ? 2 : 1;
  return (
    <span className="praia-prio" title={`Prioridad ${p.label}`}>
      {[1,2,3].map(i => (
        <span
          key={i}
          className="bar"
          style={{
            background: i <= level ? p.color : 'oklch(0.90 0.005 80)',
            height: 4 + i * 3,
          }}
        />
      ))}
    </span>
  );
}

/* ────────────── Platform chip ────────────── */
function PlatformChip({ platformId }) {
  const p = D.lookups.platforms[platformId];
  if (!p) return null;
  return (
    <span className="praia-platform" style={{ color: p.color }}>
      <span className="square" style={{ background: p.color }}></span>
      {p.label}
    </span>
  );
}

/* ────────────── Issue chip ────────────── */
function IssueChip({ issueId }) {
  const i = D.lookups.issues[issueId];
  if (!i) return null;
  return (
    <span className="praia-issue">
      <span className="ic">{i.icon}</span> {i.label}
    </span>
  );
}

/* ────────────── Apartment chip ────────────── */
function ApartmentChip({ aptId }) {
  const apt = D.lookups.apartments[aptId];
  const label = apt ? apt.id : aptId;
  return <span className="praia-apt mono" title={apt?.building}>{label}</span>;
}

/* ────────────── SLA indicator ────────────── */
function SLAIndicator({ ticket }) {
  if (ticket.status === 'cerrado') {
    return <span className="praia-sla ok mono">✓ {D.fmt.duration(ticket.resolveMins)}</span>;
  }
  const deadline = new Date(ticket.slaDeadline);
  const diff = (deadline - D.NOW) / 60000; // mins
  if (diff <= 0) return <span className="praia-sla danger mono">vencido · +{D.fmt.duration(Math.abs(Math.round(diff)))}</span>;
  if (diff < 60) return <span className="praia-sla warn mono">{Math.round(diff)}m</span>;
  return <span className="praia-sla mono">{D.fmt.duration(Math.round(diff))}</span>;
}

/* ────────────── Sidebar ────────────── */
function Sidebar({ current, onNav, counts, collapsed }) {
  const items = [
    { id: 'inicio',     label: 'Inicio',       icon: 'H', kbd: 'G I' },
    { id: 'tickets',    label: 'Tickets',      icon: 'T', kbd: 'G T', badge: counts.abierto + counts.proceso },
    { id: 'apartments', label: 'Apartamentos', icon: 'A', kbd: 'G A' },
    { id: 'agents',     label: 'Agentes',      icon: 'P', kbd: 'G P' },
    { id: 'metrics',    label: 'Métricas',     icon: 'M', kbd: 'G M' },
  ];
  const secondary = [
    { id: 'inbox',      label: 'Bandeja',     icon: 'I' },
    { id: 'reports',    label: 'Reportes',    icon: 'R' },
    { id: 'settings',   label: 'Ajustes',     icon: 'S' },
  ];

  return (
    <nav className={classNames('praia-sidebar', collapsed && 'collapsed')}>
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <defs>
              <linearGradient id="praiagrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.75 0.10 220)" />
                <stop offset="100%" stopColor="oklch(0.45 0.10 220)" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="11" fill="url(#praiagrad)" />
            <path d="M 3 16 Q 7 13 12 16 T 21 16 L 21 21 L 3 21 Z" fill="oklch(0.99 0.005 80)" opacity="0.8"/>
            <circle cx="17" cy="7" r="2" fill="oklch(0.99 0.005 80)" opacity="0.9"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="brand-text">
            <div className="brand-name">PRAIA</div>
            <div className="brand-sub mono">tickets · v2</div>
          </div>
        )}
      </div>

      <div className="nav-group">
        {!collapsed && <div className="nav-label">Principal</div>}
        {items.map(it => (
          <button
            key={it.id}
            className={classNames('nav-item', current === it.id && 'active')}
            onClick={() => onNav(it.id)}
            title={collapsed ? it.label : ''}
          >
            <span className="nav-icon mono">{it.icon}</span>
            {!collapsed && <span className="nav-label-text">{it.label}</span>}
            {!collapsed && it.badge != null && it.badge > 0 && (
              <span className="nav-badge">{it.badge}</span>
            )}
            {!collapsed && it.kbd && <span className="nav-kbd mono">{it.kbd}</span>}
          </button>
        ))}
      </div>

      <div className="nav-group">
        {!collapsed && <div className="nav-label">Workspace</div>}
        {secondary.map(it => (
          <button
            key={it.id}
            className={classNames('nav-item', current === it.id && 'active')}
            onClick={() => onNav(it.id)}
            title={collapsed ? it.label : ''}
          >
            <span className="nav-icon mono">{it.icon}</span>
            {!collapsed && <span className="nav-label-text">{it.label}</span>}
          </button>
        ))}
      </div>

      <div className="nav-spacer" />

      <div className="nav-footer">
        {!collapsed ? (
          <>
            <div className="nav-user">
              <Avatar agent={D.AGENTS[1]} size={28} />
              <div className="nav-user-meta">
                <div className="nav-user-name">María Pérez</div>
                <div className="nav-user-role mono">Supervisora · Mañana</div>
              </div>
            </div>
            <div className="nav-status mono">
              <span className="status-dot live" /> sincronizado · hace 12s
            </div>
          </>
        ) : (
          <Avatar agent={D.AGENTS[1]} size={32} />
        )}
      </div>
    </nav>
  );
}

/* ────────────── TopBar ────────────── */
function TopBar({ title, subtitle, children, onCmd }) {
  return (
    <header className="praia-topbar">
      <div className="topbar-titleblock">
        <h1>{title}</h1>
        {subtitle && <p className="mono">{subtitle}</p>}
      </div>
      <div className="topbar-actions">
        <button className="cmd-trigger" onClick={onCmd}>
          <span className="mono">⌕</span>
          <span>Buscar o ejecutar comando…</span>
          <kbd className="mono">⌘K</kbd>
        </button>
        {children}
      </div>
    </header>
  );
}

/* ────────────── KPI Card ────────────── */
function KPICard({ label, value, delta, sparkline, accent, sub }) {
  return (
    <div className="kpi-card">
      <div className="kpi-head">
        <span className="kpi-label">{label}</span>
        {delta != null && (
          <span className={classNames('kpi-delta mono', delta >= 0 ? 'up' : 'down')}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="kpi-value-row">
        <div className="kpi-value" style={{ color: accent }}>{value}</div>
        {sparkline && <Sparkline data={sparkline} color={accent} />}
      </div>
      {sub && <div className="kpi-sub mono">{sub}</div>}
    </div>
  );
}

/* ────────────── Sparkline ────────────── */
function Sparkline({ data, color = 'currentColor', width = 80, height = 28 }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const last = data[data.length - 1];
  const lx = width;
  const ly = height - ((last - min) / range) * (height - 4) - 2;
  return (
    <svg width={width} height={height} className="praia-spark">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.2" fill={color} />
    </svg>
  );
}

/* ────────────── Bar chart (horizontal) ────────────── */
function BarChart({ data, color = 'oklch(0.55 0.10 220)', maxBars = 8, accentMap }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const top = data.slice(0, maxBars);
  return (
    <div className="praia-barchart">
      {top.map((d, i) => (
        <div key={i} className="bar-row">
          <div className="bar-label">{d.label}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(d.value / max) * 100}%`, background: (accentMap && accentMap[d.id]) || color }}
            />
          </div>
          <div className="bar-value mono">{d.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ────────────── Donut chart ────────────── */
function Donut({ slices, size = 140 }) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} className="praia-donut">
      <g transform={`translate(${size/2}, ${size/2}) rotate(-90)`}>
        <circle r={r} fill="none" stroke="oklch(0.94 0.005 80)" strokeWidth="14" />
        {slices.map((s, i) => {
          const len = (s.value / total) * c;
          const seg = (
            <circle
              key={i}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return seg;
        })}
      </g>
      <text x={size/2} y={size/2 - 4} textAnchor="middle" className="donut-num">{total}</text>
      <text x={size/2} y={size/2 + 14} textAnchor="middle" className="donut-label">total</text>
    </svg>
  );
}

/* ────────────── Drawer ────────────── */
function Drawer({ open, onClose, children, width = 520 }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && open) onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={classNames('praia-drawer-backdrop', open && 'open')} onClick={onClose} />
      <aside className={classNames('praia-drawer', open && 'open')} style={{ width }}>
        {children}
      </aside>
    </>
  );
}

/* ────────────── Command Palette ────────────── */
function CommandPalette({ open, onClose, onAction, currentView }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setQ('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && open) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const commands = useMemo(() => [
    { id: 'nav-inicio',  group: 'Ir a', label: 'Inicio',       hint: 'Dashboard',     action: () => onAction({ type:'nav', to:'inicio' }) },
    { id: 'nav-tickets', group: 'Ir a', label: 'Tickets',      hint: 'Lista',         action: () => onAction({ type:'nav', to:'tickets' }) },
    { id: 'nav-apts',    group: 'Ir a', label: 'Apartamentos', hint: 'Por edificio',  action: () => onAction({ type:'nav', to:'apartments' }) },
    { id: 'nav-agents',  group: 'Ir a', label: 'Agentes',      hint: 'Equipo',        action: () => onAction({ type:'nav', to:'agents' }) },
    { id: 'nav-metrics', group: 'Ir a', label: 'Métricas',     hint: 'Analítica',     action: () => onAction({ type:'nav', to:'metrics' }) },
    { id: 'new-ticket',  group: 'Acción', label: 'Nuevo ticket',   hint: 'Crear',     kbd: 'N',  action: () => onAction({ type:'new-ticket' }) },
    { id: 'export-csv',  group: 'Acción', label: 'Exportar a CSV', hint: 'Vista actual', action: () => onAction({ type:'export-csv' }) },
    { id: 'filter-mine', group: 'Filtro', label: 'Solo mis tickets', hint: 'María Pérez', action: () => onAction({ type:'filter-mine' }) },
    { id: 'filter-open', group: 'Filtro', label: 'Solo abiertos', action: () => onAction({ type:'filter-status', value:'abierto' }) },
    { id: 'filter-high', group: 'Filtro', label: 'Prioridad alta', action: () => onAction({ type:'filter-prio', value:'alta' }) },
    ...D.APARTMENTS.slice(0,8).map(a => ({
      id: 'apt-' + a.id, group: 'Apartamento', label: a.id, hint: `Edificio ${a.building}`,
      action: () => onAction({ type:'filter-apt', value: a.id })
    })),
  ], [onAction]);

  const filtered = commands.filter(c =>
    !q || c.label.toLowerCase().includes(q.toLowerCase()) || c.group.toLowerCase().includes(q.toLowerCase())
  );

  const groups = {};
  filtered.forEach(c => { (groups[c.group] = groups[c.group] || []).push(c); });

  if (!open) return null;

  return (
    <div className="praia-cmdk-backdrop" onClick={onClose}>
      <div className="praia-cmdk" onClick={e => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <span className="cmdk-prefix mono">⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar tickets, apartamentos, comandos…"
            className="cmdk-input"
            onKeyDown={e => {
              if (e.key === 'Enter' && filtered[0]) { filtered[0].action(); onClose(); }
            }}
          />
          <kbd className="mono">esc</kbd>
        </div>
        <div className="cmdk-results">
          {Object.entries(groups).map(([g, items]) => (
            <div key={g} className="cmdk-group">
              <div className="cmdk-group-label mono">{g}</div>
              {items.map(c => (
                <button
                  key={c.id}
                  className="cmdk-item"
                  onClick={() => { c.action(); onClose(); }}
                >
                  <span className="cmdk-item-label">{c.label}</span>
                  {c.hint && <span className="cmdk-item-hint mono">{c.hint}</span>}
                  {c.kbd && <kbd className="mono">{c.kbd}</kbd>}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="cmdk-empty mono">sin resultados para "{q}"</div>
          )}
        </div>
        <div className="cmdk-footer mono">
          <span>↵ ejecutar</span><span>↑↓ navegar</span><span>esc cerrar</span>
        </div>
      </div>
    </div>
  );
}

/* ────────────── Empty state ────────────── */
function EmptyState({ title, sub, action }) {
  return (
    <div className="praia-empty">
      <div className="empty-mark mono">∅</div>
      <h4>{title}</h4>
      {sub && <p>{sub}</p>}
      {action}
    </div>
  );
}

/* ────────────── Toast / Snackbar ────────────── */
function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="praia-toast">
      <span className="dot" />
      <span>{message}</span>
    </div>
  );
}

/* ────────────── Export to window ────────────── */
Object.assign(window, {
  PraiaUI: {
    classNames, Avatar, StatusPill, PriorityBars, PlatformChip, IssueChip,
    ApartmentChip, SLAIndicator, Sidebar, TopBar, KPICard, Sparkline,
    BarChart, Donut, Drawer, CommandPalette, EmptyState, Toast,
  },
});

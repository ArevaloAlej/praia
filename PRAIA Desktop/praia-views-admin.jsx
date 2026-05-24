/* ───────────────── PRAIA · Audit & Team views ───────────────── */

const { useState: useS_AD, useEffect: useE_AD, useMemo: useM_AD } = React;
const { Avatar: Av_AD, EmptyState: ES_AD, classNames: cn_AD } = window.PraiaUI;
const PD_AD = window.PRAIA_DATA;

/* ════════════════ Audit View ════════════════ */
function AuditView({ liveMode, currentUser }) {
  const [entries, setEntries] = useS_AD([]);
  const [loading, setLoading] = useS_AD(true);
  const [error, setError] = useS_AD(null);
  const [filters, setFilters] = useS_AD({ actor: 'all', action: 'all', table: 'all', query: '' });

  async function load() {
    setLoading(true); setError(null);
    try {
      if (liveMode && window.PRAIA_API) {
        const data = await window.PRAIA_API.get('audit');
        setEntries(data || []);
      } else {
        // Demo fallback — generar audit log sintético
        setEntries(generateMockAudit());
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useE_AD(() => { load(); }, [liveMode]);

  const filtered = useM_AD(() => {
    let xs = entries;
    if (filters.actor !== 'all') xs = xs.filter(e => e.actor === filters.actor);
    if (filters.action !== 'all') xs = xs.filter(e => e.action === filters.action);
    if (filters.table !== 'all') xs = xs.filter(e => e.table === filters.table);
    if (filters.query) {
      const q = filters.query.toLowerCase();
      xs = xs.filter(e =>
        (e.rowId || '').toLowerCase().includes(q) ||
        (e.actorName || '').toLowerCase().includes(q) ||
        (e.delta || '').toLowerCase().includes(q)
      );
    }
    return xs;
  }, [entries, filters]);

  const actors = [...new Set(entries.map(e => e.actor).filter(Boolean))];
  const actions = [...new Set(entries.map(e => e.action).filter(Boolean))];
  const tables = [...new Set(entries.map(e => e.table).filter(Boolean))];

  return (
    <div className="view-audit">
      <div className="audit-header">
        <div className="audit-meta">
          <div className="audit-count">
            <span className="audit-num">{entries.length}</span>
            <span className="audit-lbl mono">entradas totales</span>
          </div>
          <div className="audit-status mono">
            {liveMode ? (
              <><span className="live-dot" /> data en vivo · {new Date().toLocaleTimeString()}</>
            ) : (
              <><span className="demo-dot" /> demo data</>
            )}
          </div>
        </div>
        <button className="btn-ghost mono" onClick={load} disabled={loading}>
          {loading ? '↻ cargando...' : '↻ refrescar'}
        </button>
      </div>

      <div className="audit-filters">
        <div className="filter-search">
          <span className="mono">⌕</span>
          <input
            placeholder="Buscar por ID, actor, campo..."
            value={filters.query}
            onChange={e => setFilters(f => ({ ...f, query: e.target.value }))}
          />
        </div>
        <select className="praia-select mono" value={filters.actor} onChange={e => setFilters(f => ({ ...f, actor: e.target.value }))}>
          <option value="all">Todos los actores</option>
          {actors.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="praia-select mono" value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
          <option value="all">Toda acción</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="praia-select mono" value={filters.table} onChange={e => setFilters(f => ({ ...f, table: e.target.value }))}>
          <option value="all">Toda tabla</option>
          {tables.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {error && (
        <div className="audit-error mono">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && entries.length === 0 ? (
        <div className="audit-loading mono">cargando auditoría...</div>
      ) : filtered.length === 0 ? (
        <ES_AD title="Sin entradas" sub="No hay registros que coincidan con los filtros." />
      ) : (
        <div className="audit-feed">
          {filtered.map(e => (
            <AuditEntry key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuditEntry({ entry }) {
  const verbClass = (entry.action || '').toLowerCase();
  let delta = null;
  try { delta = entry.delta ? JSON.parse(entry.delta) : null; } catch { /* */ }

  return (
    <div className="audit-entry">
      <div className="audit-ts mono">{fmtTimestamp(entry.ts)}</div>
      <div className="audit-actor">
        <div className="audit-actor-disc" title={entry.actor}>
          {(entry.actorName || entry.actor || '?').slice(0,2).toUpperCase()}
        </div>
        <div className="audit-actor-name">
          <strong>{entry.actorName || entry.actor}</strong>
          <span className="mono small">{entry.actor}</span>
        </div>
      </div>
      <div className="audit-content">
        <div className="audit-line">
          <span className={`audit-verb ${verbClass}`}>{entry.action}</span>
          <span className="audit-table mono">{entry.table}</span>
          {entry.rowId && <span className="audit-rowid mono">{entry.rowId}</span>}
        </div>
        {delta && Object.keys(delta).length > 0 && (
          <div className="audit-delta">
            {Object.entries(delta).map(([field, change]) => (
              <span key={field} className="delta-item">
                <span className="delta-field mono">{field}</span>
                <span className="delta-from mono">{String(change.from ?? '∅')}</span>
                <span className="delta-arrow mono">→</span>
                <span className="delta-to mono">{String(change.to ?? '∅')}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function fmtTimestamp(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
  } catch { return iso; }
}

/* Generador de audit demo si no hay backend conectado */
function generateMockAudit() {
  const actors = PD_AD.AGENTS.map(a => ({ email: a.id + '@praia.com', name: a.name }));
  const tables = ['Tickets', 'Tickets', 'Tickets', 'Users', 'Tickets'];
  const actions = ['CREATE', 'UPDATE', 'UPDATE', 'UPDATE', 'DELETE', 'COMMENT', 'LOGIN'];
  const fields = ['status', 'priority', 'agent', 'description'];
  const out = [];
  for (let i = 0; i < 32; i++) {
    const a = actors[i % actors.length];
    const action = actions[i % actions.length];
    const ts = new Date(Date.now() - i * (1000 * 60 * Math.floor(2 + Math.random() * 30))).toISOString();
    let delta = '';
    if (action === 'UPDATE') {
      const f = fields[i % fields.length];
      const fromTo = f === 'status'
        ? { from: 'abierto', to: 'proceso' }
        : f === 'priority' ? { from: 'media', to: 'alta' }
        : f === 'agent' ? { from: 'luis', to: 'maria' }
        : { from: 'Descripción anterior', to: 'Descripción actualizada' };
      delta = JSON.stringify({ [f]: fromTo });
    }
    out.push({
      id: 'audit-' + i,
      ts,
      actor: a.email,
      actorName: a.name,
      action,
      table: tables[i % tables.length],
      rowId: action === 'LOGIN' ? '' : ('TK-' + (1020 + i)),
      delta,
      payload: '',
    });
  }
  return out;
}

/* ════════════════ Team View ════════════════ */
function TeamView({ liveMode, currentUser, onToast }) {
  const [users, setUsers] = useS_AD([]);
  const [loading, setLoading] = useS_AD(true);
  const [error, setError] = useS_AD(null);
  const [showInvite, setShowInvite] = useS_AD(false);

  async function load() {
    setLoading(true); setError(null);
    try {
      if (liveMode && window.PRAIA_API) {
        // No GET users endpoint en el backend — esto requeriría agregar uno.
        // Por ahora mostramos los agents y dejamos la fila "agregar"
        // como instrucción a editar directamente la hoja Users.
        const agents = await window.PRAIA_API.get('agents');
        setUsers(agents.map(a => ({
          id: a.id, name: a.name, email: a.id + '@praia.com',
          role: a.role, shift: a.shift, active: a.active !== false,
        })));
      } else {
        setUsers(PD_AD.AGENTS.map(a => ({
          id: a.id, name: a.name, email: a.id + '@praia.com',
          role: a.role, shift: a.shift, active: true,
        })));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useE_AD(() => { load(); }, [liveMode]);

  const isAdmin = currentUser && currentUser.role === 'admin';

  return (
    <div className="view-team">
      <div className="team-header">
        <div>
          <h3 className="team-title">Equipo &amp; permisos</h3>
          <p className="team-sub mono">
            {users.length} miembros · {users.filter(u => u.active).length} activos
            {liveMode ? <> · <span className="live-dot" /> en vivo</> : <> · demo data</>}
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowInvite(true)}>
            <span className="mono">+</span> Invitar miembro
          </button>
        )}
      </div>

      {error && <div className="audit-error mono"><strong>Error:</strong> {error}</div>}

      <div className="team-grid">
        {users.map(u => (
          <TeamCard key={u.id} user={u} canEdit={isAdmin} onToast={onToast} />
        ))}
      </div>

      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onToast={onToast} />
      )}

      <div className="team-instructions">
        <h4>Cómo agregar o quitar miembros</h4>
        <ol>
          <li>Abre tu Sheet <strong>"Tickets"</strong> → hoja <strong>Users</strong>.</li>
          <li>Para <strong>agregar</strong>: nueva fila con <code className="mono inline">id · email · nombre · role · shift · TRUE</code>.</li>
          <li>Para <strong>quitar acceso</strong>: cambia <code className="mono inline">active</code> a <code className="mono inline">FALSE</code>. La fila se preserva para auditoría.</li>
          <li>Los cambios aplican inmediatamente — no requiere redeploy.</li>
        </ol>
        <p className="team-note mono">
          Próxima iteración: edición inline desde esta pantalla (necesita agregar endpoints <code>GET users</code> y <code>POST user</code> al backend).
        </p>
      </div>
    </div>
  );
}

function TeamCard({ user, canEdit, onToast }) {
  return (
    <div className={cn_AD('team-card', !user.active && 'inactive')}>
      <div className="tc-head">
        <div className="tc-avatar" style={{ background: roleColor(user.role) }}>
          {user.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()}
        </div>
        <div className="tc-meta">
          <div className="tc-name">{user.name}</div>
          <div className="tc-email mono">{user.email}</div>
        </div>
        {!user.active && <span className="tc-badge inactive mono">INACTIVO</span>}
      </div>
      <div className="tc-grid">
        <div><span className="tc-l mono">Rol</span><span className="tc-v">{user.role}</span></div>
        <div><span className="tc-l mono">Turno</span><span className="tc-v">{user.shift || '—'}</span></div>
      </div>
      {canEdit && (
        <div className="tc-actions">
          <button className="btn-ghost-sm mono">editar</button>
          <button className={cn_AD('btn-ghost-sm mono', user.active && 'danger')}>
            {user.active ? 'desactivar' : 'reactivar'}
          </button>
        </div>
      )}
    </div>
  );
}

function roleColor(role) {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return 'oklch(0.55 0.16 25)';
  if (r === 'supervisor' || r === 'supervisora') return 'oklch(0.55 0.12 280)';
  if (r === 'limpieza') return 'oklch(0.55 0.10 145)';
  if (r === 'mantenimiento') return 'oklch(0.55 0.13 70)';
  return 'oklch(0.55 0.10 220)';
}

function InviteModal({ onClose, onToast }) {
  const [form, setForm] = useS_AD({ email: '', name: '', role: 'agent', shift: 'Mañana' });

  function submit() {
    if (!form.email.includes('@') || form.name.length < 2) return;
    // En la versión actual, este flujo no escribe directo —
    // muestra instrucciones al admin para agregar a la Sheet manualmente.
    onToast(`Para invitar a ${form.name}, agrégalo a la hoja Users con email ${form.email}`);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 480 }}>
        <header className="modal-head">
          <div>
            <h3>Invitar miembro</h3>
            <p className="mono small">se agregará a la hoja Users de tu Sheet</p>
          </div>
          <button className="icon-btn" onClick={onClose}>×</button>
        </header>
        <div className="modal-body">
          <div className="praia-field">
            <label className="mono">Email del miembro</label>
            <input
              className="praia-input"
              type="email"
              placeholder="nombre@dominio.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="praia-field">
            <label className="mono">Nombre completo</label>
            <input
              className="praia-input"
              placeholder="Nombre Apellido"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="praia-field">
            <label className="mono">Rol</label>
            <div className="chip-radio">
              {['admin', 'supervisor', 'agent', 'viewer'].map(r => (
                <button
                  key={r}
                  className={cn_AD('chip-r', form.role === r && 'active')}
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                >{r}</button>
              ))}
            </div>
          </div>
          <div className="praia-field">
            <label className="mono">Turno</label>
            <div className="chip-radio">
              {['Mañana', 'Tarde', 'Noche'].map(s => (
                <button
                  key={s}
                  className={cn_AD('chip-r', form.shift === s && 'active')}
                  onClick={() => setForm(f => ({ ...f, shift: s }))}
                >{s}</button>
              ))}
            </div>
          </div>
          <div className="callout warn" style={{ margin: '8px 0 0' }}>
            <strong>Nota:</strong> en esta versión, agregar el miembro requiere editar la hoja <code className="mono inline">Users</code> manualmente. Próxima iteración: lo haré inline aquí cuando agreguemos endpoints de usuarios al backend.
          </div>
        </div>
        <footer className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <div style={{ flex: 1 }} />
          <button className="btn-primary" onClick={submit}>Ver instrucciones</button>
        </footer>
      </div>
    </div>
  );
}

Object.assign(window, { AuditView, TeamView });

/* ───────────────── PRAIA · Tickets view + Drawer + NewTicket ───────────────── */

const { useState: useState_T, useMemo: useMemo_T, useEffect: useEffect_T, useRef: useRef_T } = React;
const { Avatar, StatusPill, PriorityBars, PlatformChip, IssueChip, ApartmentChip,
        SLAIndicator, Drawer, EmptyState, classNames: cn } = window.PraiaUI;
const PD = window.PRAIA_DATA;

/* ════════════════ Tickets view ════════════════ */
function TicketsView({ tickets, onSelectTicket, onMutate, externalFilters, onClearExternal, dense }) {
  const [filters, setFilters] = useState_T({
    status: 'all', priority: 'all', platform: 'all', issue: 'all', agent: 'all', apartment: 'all',
    query: '', mine: false,
  });
  const [sort, setSort] = useState_T({ key: 'createdAt', dir: 'desc' });
  const [selected, setSelected] = useState_T(new Set());
  const [savedView, setSavedView] = useState_T('todos');

  // Apply external filter requests coming from cmdk
  useEffect_T(() => {
    if (!externalFilters) return;
    setFilters(f => ({ ...f, ...externalFilters }));
    onClearExternal();
  }, [externalFilters]);

  const filtered = useMemo_T(() => {
    let xs = tickets;
    if (filters.status !== 'all') xs = xs.filter(t => t.status === filters.status);
    if (filters.priority !== 'all') xs = xs.filter(t => t.priority === filters.priority);
    if (filters.platform !== 'all') xs = xs.filter(t => t.platform === filters.platform);
    if (filters.issue !== 'all') xs = xs.filter(t => t.issue === filters.issue);
    if (filters.agent !== 'all') xs = xs.filter(t => t.agent === filters.agent);
    if (filters.apartment !== 'all') xs = xs.filter(t => t.apartment === filters.apartment);
    if (filters.mine) xs = xs.filter(t => t.agent === 'maria');
    if (filters.query) {
      const q = filters.query.toLowerCase();
      xs = xs.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.guest.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.apartment.toLowerCase().includes(q)
      );
    }
    const { key, dir } = sort;
    xs = [...xs].sort((a, b) => {
      let va = a[key], vb = b[key];
      if (key === 'createdAt' || key === 'updatedAt') { va = new Date(va); vb = new Date(vb); }
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return xs;
  }, [tickets, filters, sort]);

  const toggleSelect = (id) => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const toggleAll = () => setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)));

  function sortBy(key) {
    setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
  }
  function sortArrow(key) {
    if (sort.key !== key) return null;
    return <span className="sort-arrow mono">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
  }

  /* Saved views */
  const views = [
    { id: 'todos',    label: 'Todos',         filter: { status:'all', priority:'all', mine:false } },
    { id: 'abiertos', label: 'Abiertos',      filter: { status:'abierto' } },
    { id: 'proceso',  label: 'En proceso',    filter: { status:'proceso' } },
    { id: 'criticos', label: 'Críticos',      filter: { priority:'alta', status:'abierto' } },
    { id: 'mios',     label: 'Mis tickets',   filter: { mine:true } },
    { id: 'hoy',      label: 'Hoy',           filter: {} },
  ];
  function applyView(v) {
    setSavedView(v.id);
    setFilters(f => ({ ...f, status:'all', priority:'all', mine:false, ...v.filter }));
  }

  const counts = {
    abierto: tickets.filter(t => t.status === 'abierto').length,
    proceso: tickets.filter(t => t.status === 'proceso').length,
    espera: tickets.filter(t => t.status === 'espera').length,
    cerrado: tickets.filter(t => t.status === 'cerrado').length,
  };

  return (
    <div className="view-tickets">
      {/* Saved views row */}
      <div className="tickets-tabs">
        {views.map(v => (
          <button
            key={v.id}
            className={cn('tab', savedView === v.id && 'active')}
            onClick={() => applyView(v)}
          >
            {v.label}
            {v.id === 'abiertos' && <span className="tab-count">{counts.abierto}</span>}
            {v.id === 'proceso'  && <span className="tab-count">{counts.proceso}</span>}
            {v.id === 'criticos' && <span className="tab-count danger">{tickets.filter(t=>t.priority==='alta'&&t.status==='abierto').length}</span>}
          </button>
        ))}
        <div className="tabs-spacer" />
        <button className="tab tab-ghost mono" title="Crear nueva vista">+ vista</button>
      </div>

      {/* Filter bar */}
      <div className="tickets-filterbar">
        <div className="filter-search">
          <span className="mono">⌕</span>
          <input
            placeholder="Buscar por ID, huésped, apartamento, descripción…"
            value={filters.query}
            onChange={e => setFilters(f => ({ ...f, query: e.target.value }))}
          />
          {filters.query && <button className="search-clear mono" onClick={()=>setFilters(f=>({...f,query:''}))}>×</button>}
        </div>
        <Select value={filters.status}    onChange={v=>setFilters(f=>({...f,status:v}))} options={[{value:'all',label:'Estado'}, ...PD.STATUSES.map(s=>({value:s.id,label:s.label}))]} />
        <Select value={filters.priority}  onChange={v=>setFilters(f=>({...f,priority:v}))} options={[{value:'all',label:'Prioridad'}, ...PD.PRIORITIES.map(p=>({value:p.id,label:p.label}))]} />
        <Select value={filters.platform}  onChange={v=>setFilters(f=>({...f,platform:v}))} options={[{value:'all',label:'Plataforma'}, ...PD.PLATFORMS.map(p=>({value:p.id,label:p.label}))]} />
        <Select value={filters.issue}     onChange={v=>setFilters(f=>({...f,issue:v}))} options={[{value:'all',label:'Issue'}, ...PD.ISSUE_TYPES.map(i=>({value:i.id,label:i.label}))]} />
        <Select value={filters.agent}     onChange={v=>setFilters(f=>({...f,agent:v}))} options={[{value:'all',label:'Agente'}, ...PD.AGENTS.map(a=>({value:a.id,label:a.name}))]} />
        <div className="filter-spacer" />
        <button className="btn-ghost mono" title="Exportar CSV">↓ CSV</button>
        <button className="btn-primary" onClick={() => onMutate({ type: 'open-new' })}>
          <span className="mono">+</span> Nuevo ticket
        </button>
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips filters={filters} setFilters={setFilters} />

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <div className="bulk-info">
            <strong>{selected.size}</strong> seleccionado{selected.size>1?'s':''}
            <button className="link-btn mono" onClick={()=>setSelected(new Set())}>limpiar</button>
          </div>
          <div className="bulk-actions">
            <button className="btn-ghost" onClick={()=>{onMutate({type:'bulk-status', ids:[...selected], value:'proceso'}); setSelected(new Set());}}>
              Marcar en proceso
            </button>
            <button className="btn-ghost" onClick={()=>{onMutate({type:'bulk-status', ids:[...selected], value:'cerrado'}); setSelected(new Set());}}>
              Cerrar
            </button>
            <button className="btn-ghost" onClick={()=>{onMutate({type:'bulk-assign', ids:[...selected], value:'luis'}); setSelected(new Set());}}>
              Asignar a Luis
            </button>
            <button className="btn-danger-ghost" onClick={()=>{onMutate({type:'bulk-delete', ids:[...selected]}); setSelected(new Set());}}>
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="results-row mono">
        <span>{filtered.length} de {tickets.length} tickets</span>
        <span className="results-dot">·</span>
        <span>orden por {sort.key === 'createdAt' ? 'creación' : sort.key} {sort.dir === 'desc' ? '↓' : '↑'}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Sin tickets que mostrar"
          sub="Ajusta los filtros o crea uno nuevo."
          action={<button className="btn-primary" onClick={()=>onMutate({type:'open-new'})}>+ Nuevo ticket</button>}
        />
      ) : (
        <div className={cn('praia-table-wrap', dense && 'dense')}>
          <table className="praia-table">
            <thead>
              <tr>
                <th className="th-check">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length>0} onChange={toggleAll} />
                </th>
                <th onClick={()=>sortBy('id')} className="sortable">ID {sortArrow('id')}</th>
                <th onClick={()=>sortBy('status')} className="sortable">Estado {sortArrow('status')}</th>
                <th onClick={()=>sortBy('priority')} className="sortable">Prio {sortArrow('priority')}</th>
                <th onClick={()=>sortBy('apartment')} className="sortable">Apto {sortArrow('apartment')}</th>
                <th onClick={()=>sortBy('issue')} className="sortable">Issue {sortArrow('issue')}</th>
                <th onClick={()=>sortBy('platform')} className="sortable">Plataforma {sortArrow('platform')}</th>
                <th>Huésped</th>
                <th onClick={()=>sortBy('agent')} className="sortable">Agente {sortArrow('agent')}</th>
                <th onClick={()=>sortBy('createdAt')} className="sortable">Creado {sortArrow('createdAt')}</th>
                <th>SLA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <TicketRow
                  key={t.id}
                  ticket={t}
                  selected={selected.has(t.id)}
                  onToggleSelect={() => toggleSelect(t.id)}
                  onSelect={() => onSelectTicket(t.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* Active filter chips */
function ActiveFilterChips({ filters, setFilters }) {
  const chips = [];
  if (filters.status !== 'all') chips.push({ key:'status', label: 'Estado: ' + PD.lookups.statuses[filters.status].label });
  if (filters.priority !== 'all') chips.push({ key:'priority', label: 'Prioridad: ' + PD.lookups.priorities[filters.priority].label });
  if (filters.platform !== 'all') chips.push({ key:'platform', label: 'Plataforma: ' + PD.lookups.platforms[filters.platform].label });
  if (filters.issue !== 'all') chips.push({ key:'issue', label: 'Issue: ' + PD.lookups.issues[filters.issue].label });
  if (filters.agent !== 'all') chips.push({ key:'agent', label: 'Agente: ' + PD.lookups.agents[filters.agent].name });
  if (filters.apartment !== 'all') chips.push({ key:'apartment', label: 'Apto: ' + filters.apartment });
  if (filters.mine) chips.push({ key:'mine', label:'Mis tickets' });
  if (chips.length === 0) return null;
  return (
    <div className="filter-chips">
      {chips.map(c => (
        <span key={c.key} className="filter-chip">
          {c.label}
          <button onClick={()=>setFilters(f=>({...f, [c.key]: c.key==='mine' ? false : 'all'}))} className="mono">×</button>
        </span>
      ))}
      <button className="link-btn mono" onClick={()=>setFilters({status:'all',priority:'all',platform:'all',issue:'all',agent:'all',apartment:'all',query:'',mine:false})}>
        limpiar todo
      </button>
    </div>
  );
}

/* Select component */
function Select({ value, onChange, options }) {
  return (
    <select className="praia-select mono" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* Table row */
function TicketRow({ ticket, selected, onToggleSelect, onSelect }) {
  const agent = PD.lookups.agents[ticket.agent];
  return (
    <tr className={cn(selected && 'selected')} onClick={onSelect}>
      <td className="td-check" onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={onToggleSelect} />
      </td>
      <td className="mono td-id">{ticket.id}</td>
      <td><StatusPill statusId={ticket.status} dense /></td>
      <td><PriorityBars priorityId={ticket.priority} /></td>
      <td><ApartmentChip aptId={ticket.apartment} /></td>
      <td><IssueChip issueId={ticket.issue} /></td>
      <td><PlatformChip platformId={ticket.platform} /></td>
      <td className="td-guest">{ticket.guest}</td>
      <td><div className="td-agent"><Avatar agent={agent} size={22} /><span>{agent?.name.split(' ')[0]}</span></div></td>
      <td className="mono td-time">{PD.fmt.ago(ticket.createdAt)}</td>
      <td><SLAIndicator ticket={ticket} /></td>
    </tr>
  );
}

/* ════════════════ Ticket Drawer ════════════════ */
function TicketDrawer({ ticketId, tickets, onClose, onMutate }) {
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return null;
  const apt = PD.lookups.apartments[ticket.apartment];
  const ag = PD.lookups.agents[ticket.agent];

  const [comment, setComment] = useState_T('');

  function changeStatus(newStatus) {
    onMutate({ type: 'update', id: ticket.id, patch: { status: newStatus, updatedAt: new Date().toISOString() }});
  }
  function changeAgent(newAg) {
    onMutate({ type: 'update', id: ticket.id, patch: { agent: newAg, updatedAt: new Date().toISOString() }});
  }
  function addComment() {
    if (!comment.trim()) return;
    onMutate({
      type: 'comment',
      id: ticket.id,
      comment: { id: 'c-' + Date.now(), author: 'maria', ts: new Date().toISOString(), text: comment.trim() }
    });
    setComment('');
  }

  return (
    <div className="ticket-drawer-content">
      <header className="drawer-header">
        <div className="drawer-id">
          <span className="mono small">{ticket.id}</span>
          <StatusPill statusId={ticket.status} />
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar">×</button>
      </header>

      <div className="drawer-title-row">
        <IssueChip issueId={ticket.issue} />
        <PriorityBars priorityId={ticket.priority} />
      </div>
      <h2 className="drawer-title">{ticket.description}</h2>

      <div className="drawer-meta">
        <div><span className="lbl mono">Apartamento</span><span className="val"><ApartmentChip aptId={ticket.apartment} /> · {apt?.beds} hab · {apt?.capacity} pax</span></div>
        <div><span className="lbl mono">Plataforma</span><span className="val"><PlatformChip platformId={ticket.platform} /></span></div>
        <div><span className="lbl mono">Huésped</span><span className="val">{ticket.guest}</span></div>
        <div><span className="lbl mono">Creado</span><span className="val">{PD.fmt.fmtDateTime(new Date(ticket.createdAt))}</span></div>
        <div><span className="lbl mono">Actualizado</span><span className="val">{PD.fmt.ago(ticket.updatedAt)}</span></div>
        <div><span className="lbl mono">SLA</span><span className="val"><SLAIndicator ticket={ticket} /></span></div>
      </div>

      <section className="drawer-section">
        <div className="section-head">
          <h4>Asignación</h4>
        </div>
        <div className="assign-row">
          {PD.AGENTS.map(a => (
            <button
              key={a.id}
              className={cn('assign-chip', a.id === ticket.agent && 'active')}
              onClick={() => changeAgent(a.id)}
              title={a.role}
            >
              <Avatar agent={a} size={22} />
              <span>{a.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="drawer-section">
        <div className="section-head">
          <h4>Cambiar estado</h4>
        </div>
        <div className="status-flow">
          {PD.STATUSES.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                className={cn('status-step', s.id === ticket.status && 'active')}
                style={s.id === ticket.status ? { color: s.color, borderColor: s.color, background: s.bg } : {}}
                onClick={() => changeStatus(s.id)}
              >
                {s.label}
              </button>
              {i < PD.STATUSES.length - 1 && <span className="status-arrow mono">→</span>}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="drawer-section">
        <div className="section-head">
          <h4>Actividad &amp; comentarios</h4>
          <span className="mono small">{ticket.comments.length} mensajes</span>
        </div>
        <ul className="comments-list">
          <li className="comment">
            <div className="comment-meta mono"><strong>sistema</strong> · {PD.fmt.ago(ticket.createdAt)}</div>
            <div className="comment-body">Ticket creado vía <strong>{PD.lookups.platforms[ticket.platform]?.label}</strong>.</div>
          </li>
          {ticket.comments.map(c => {
            const author = PD.lookups.agents[c.author];
            return (
              <li key={c.id} className="comment">
                <div className="comment-meta">
                  <Avatar agent={author} size={18} />
                  <strong>{author?.name}</strong>
                  <span className="mono small">{PD.fmt.ago(c.ts)}</span>
                </div>
                <div className="comment-body">{c.text}</div>
              </li>
            );
          })}
        </ul>
        <div className="comment-compose">
          <Avatar agent={PD.AGENTS[1]} size={24} />
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Escribir comentario…"
            onKeyDown={e => { if (e.key === 'Enter') addComment(); }}
          />
          <button className="btn-primary" disabled={!comment.trim()} onClick={addComment}>Enviar</button>
        </div>
      </section>

      <footer className="drawer-footer">
        <button className="btn-danger-ghost">Eliminar ticket</button>
        <button className="btn-ghost">Ver historial</button>
      </footer>
    </div>
  );
}

/* ════════════════ New Ticket Modal ════════════════ */
function NewTicketModal({ open, onClose, onCreate, currentUser }) {
  const STORAGE_KEY = 'praia.newticket.form';
  
  const getInitialForm = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    
    // Default al PRIMER apartamento disponible en el Sheet, no hardcoded
    const firstApt = PD.APARTMENTS?.[0]?.id || '7834-1';
    return {
      apartment: firstApt, platform: 'guesty', issue: 'limpieza',
      priority: 'media', agent: currentUser?.id || 'luis', guest: '', description: '',
    };
  };

  const [form, setForm] = useState_T(getInitialForm());
  const [step, setStep] = useState_T(1);

  // Guardar en localStorage cada vez que cambia el form
  useEffect_T(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  useEffect_T(() => {
    if (open) {
      setStep(1);
      // Cargar del localStorage cuando se abre
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setForm(JSON.parse(saved));
        } catch {}
      }
    }
  }, [open]);

  if (!open) return null;

  const canNext1 = form.apartment && form.platform && form.guest.trim().length > 1;
  const canCreate = canNext1 && form.description.trim().length > 4;

  function submit() {
    const ticket = {
      ...form,
      id: 'TK-' + (1050 + Math.floor(Math.random()*900)),
      status: 'abierto',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      closedAt: null,
      resolveMins: null,
      slaDeadline: new Date(Date.now() + (form.priority === 'alta' ? 4 : form.priority === 'media' ? 12 : 24) * 3600 * 1000).toISOString(),
      comments: [],
    };
    console.log('🎫 CREATING TICKET:', { apartment: form.apartment, issue: form.issue, agent: form.agent });
    onCreate(ticket);
    // Limpiar solo guest y description, mantener todo lo demás
    const nextForm = { ...form, guest: '', description: '' };
    setForm(nextForm);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextForm));
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <h3>Nuevo ticket</h3>
            <p className="mono small">Paso {step} de 2 — {step === 1 ? 'contexto' : 'detalles'}</p>
          </div>
          <button className="icon-btn" onClick={onClose}>×</button>
        </header>

        <div className="modal-progress">
          <div className={cn('mp-step', step >= 1 && 'active')}>1 · Contexto</div>
          <div className="mp-line" />
          <div className={cn('mp-step', step >= 2 && 'active')}>2 · Detalles</div>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <>
              <Field label="Apartamento">
                <Select
                  value={form.apartment}
                  onChange={v => setForm(f => ({ ...f, apartment: v }))}
                  options={PD.APARTMENTS.map(a => ({ value: a.id, label: `${a.id} — Ed. ${a.building} · ${a.beds} hab` }))}
                />
              </Field>
              <Field label="Plataforma">
                <div className="chip-radio">
                  {PD.PLATFORMS.map(p => (
                    <button
                      key={p.id}
                      className={cn('chip-r', form.platform === p.id && 'active')}
                      onClick={() => setForm(f => ({ ...f, platform: p.id }))}
                      style={form.platform === p.id ? { borderColor: p.color, color: p.color } : {}}
                    >
                      <span className="square" style={{ background: p.color }} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Huésped">
                <input
                  className="praia-input"
                  placeholder="Nombre del huésped"
                  value={form.guest}
                  onChange={e => setForm(f => ({ ...f, guest: e.target.value }))}
                />
                {form.guest && form.guest.length < 2 && <small className="field-error">Mínimo 2 caracteres</small>}
              </Field>
            </>
          )}
          {step === 2 && (
            <>
              <Field label="Tipo de issue">
                <div className="chip-radio">
                  {PD.ISSUE_TYPES.map(i => (
                    <button
                      key={i.id}
                      className={cn('chip-r', form.issue === i.id && 'active')}
                      onClick={() => setForm(f => ({ ...f, issue: i.id }))}
                    >
                      <span className="mono">{i.icon}</span> {i.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Prioridad">
                <div className="chip-radio">
                  {PD.PRIORITIES.map(p => (
                    <button
                      key={p.id}
                      className={cn('chip-r', form.priority === p.id && 'active')}
                      onClick={() => setForm(f => ({ ...f, priority: p.id }))}
                      style={form.priority === p.id ? { borderColor: p.color, color: p.color } : {}}
                    >
                      <span className="square" style={{ background: p.color }} /> {p.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Asignar a">
                <div className="field-text mono" style={{padding:'8px 12px', background:'var(--bg-sunken)', borderRadius:6, color:'var(--ink-2)'}}>
                  {form.agent ? PD.lookups.agents[form.agent]?.name : '(se asignará a tu usuario)'}
                </div>
              </Field>
              <Field label="Descripción">
                <textarea
                  className="praia-textarea"
                  rows={3}
                  placeholder="Describe el problema con detalle…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
                {form.description && form.description.length < 5 && <small className="field-error">Cuéntame un poco más</small>}
              </Field>
            </>
          )}
        </div>

        <footer className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <div style={{flex:1}} />
          {step === 2 && <button className="btn-ghost" onClick={() => setStep(1)}>← Atrás</button>}
          {step === 1 && (
            <button className="btn-primary" disabled={!canNext1} onClick={() => setStep(2)}>
              Siguiente →
            </button>
          )}
          {step === 2 && (
            <button className="btn-primary" disabled={!canCreate} onClick={submit}>
              Crear ticket
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="praia-field">
      <label className="mono">{label}</label>
      {children}
    </div>
  );
}

Object.assign(window, {
  TicketsView, TicketDrawer, NewTicketModal,
});

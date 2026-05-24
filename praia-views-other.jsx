/* ───────────────── PRAIA · Apartments / Agents / Metrics views ───────────────── */

const { useState: useS_O, useMemo: useM_O } = React;
const { Avatar: Av_O, StatusPill: SP_O, PriorityBars: PB_O, IssueChip: IC_O,
  ApartmentChip: AC_O, PlatformChip: PC_O, SLAIndicator: SI_O,
  Sparkline: SK_O, BarChart: BC_O, Donut: DN_O,
  classNames: cn_O, EmptyState: ES_O } = window.PraiaUI;
const PD_O = window.PRAIA_DATA;

/* ════════════════ Apartments View ════════════════ */
function ApartmentsView({ tickets, onSelectTicket, onNav }) {
  const [building, setBuilding] = useS_O('all');

  const apts = useM_O(() => {
    const filteredApts = building === 'all' ?
    PD_O.APARTMENTS :
    PD_O.APARTMENTS.filter((a) => a.building === building);
    return filteredApts.map((a) => {
      const ts = tickets.filter((t) => t.apartment === a.id);
      const open = ts.filter((t) => t.status !== 'cerrado').length;
      const closed = ts.filter((t) => t.status === 'cerrado').length;
      const critical = ts.filter((t) => t.priority === 'alta' && t.status !== 'cerrado').length;
      const lastTicket = ts.sort((x, y) => new Date(y.updatedAt) - new Date(x.updatedAt))[0];
      return { ...a, total: ts.length, open, closed, critical, lastTicket };
    }).sort((a, b) => b.open - a.open || b.total - a.total);
  }, [tickets, building]);

  const byBuilding = useM_O(() => {
    return PD_O.BUILDINGS.map((b) => {
      const aptsInBuilding = PD_O.APARTMENTS.filter(a => a.building === b.id);
      const ts = tickets.filter((t) => aptsInBuilding.some(a => a.id === t.apartment));
      return { ...b, total: ts.length, open: ts.filter((x) => x.status !== 'cerrado').length };
    });
  }, [tickets]);

  return (
    <div className="view-apartments">
      {/* Building selector */}
      <div className="building-row">
        <button
          className={cn_O('building-card', building === 'all' && 'active')}
          onClick={() => setBuilding('all')}>
          
          <div className="b-head">
            <span className="b-label mono">TODOS</span>
            <span className="b-count">{PD_O.APARTMENTS.length} apt</span>
          </div>
          <div className="b-value">{tickets.length}</div>
          <div className="b-sub mono">tickets totales</div>
        </button>
        {byBuilding.map((b) =>
        <button
          key={b.id}
          className={cn_O('building-card', building === b.id && 'active')}
          onClick={() => setBuilding(b.id)}>
          
            <div className="b-head">
              <span className="b-label mono">{b.id}</span>
              <span className="b-count">{b.units} apt</span>
            </div>
            <div className="b-value">{b.total}</div>
            <div className="b-sub mono">{b.open} activos · {b.address}</div>
          </button>
        )}
      </div>

      {/* Apartment grid */}
      <div className="apt-grid">
        {apts.map((a) =>
        <ApartmentCard key={a.id} apt={a} onSelectTicket={onSelectTicket} onNav={onNav} />
        )}
      </div>
    </div>);

}

function ApartmentCard({ apt, onSelectTicket, onNav }) {
  const heat = apt.open > 3 ? 'hot' : apt.open > 1 ? 'warm' : apt.open > 0 ? 'cool' : 'idle';
  return (
    <div className={cn_O('apt-card', `heat-${heat}`)} onClick={() => onNav('apartment-detail', { aptId: apt.id })}>
      <div className="apt-card-head">
        <div className="apt-id-block">
          <span className="apt-id mono">{apt.id}</span>
          <span className="apt-info mono">{apt.beds} hab · {apt.baths} baños · {apt.capacity} pax</span>
        </div>
        <div className="apt-heat">
          <span className={cn_O('heat-dot', `heat-${heat}`)} />
        </div>
      </div>

      <div className="apt-stats">
        <div className="apt-stat">
          <div className="apt-stat-value">{apt.open}</div>
          <div className="apt-stat-label mono">abiertos</div>
        </div>
        <div className="apt-stat">
          <div className="apt-stat-value">{apt.critical}</div>
          <div className="apt-stat-label mono">críticos</div>
        </div>
        <div className="apt-stat">
          <div className="apt-stat-value">{apt.closed}</div>
          <div className="apt-stat-label mono">resueltos</div>
        </div>
      </div>

      {apt.lastTicket ?
      <button className="apt-last" onClick={(e) => { e.stopPropagation(); onSelectTicket(apt.lastTicket.id); }}>
          <div className="apt-last-head">
            <IC_O issueId={apt.lastTicket.issue} />
            <SP_O statusId={apt.lastTicket.status} dense />
          </div>
          <div className="apt-last-body">{apt.lastTicket.description}</div>
          <div className="apt-last-meta mono">
            {PD_O.fmt.ago(apt.lastTicket.updatedAt)} · {PD_O.lookups.agents[apt.lastTicket.agent]?.name.split(' ')[0]}
          </div>
        </button> :

      <div className="apt-last empty mono">sin tickets registrados</div>
      }
    </div>);

}

/* ════════════════ Apartment Detail View ════════════════ */
function ApartmentDetailView({ tickets, aptId, onSelectTicket, onNav, onBack }) {
  const apt = PD_O.lookups.apartments[aptId];
  if (!apt) return <div className="view-empty">Apartamento no encontrado</div>;

  const aptTickets = tickets.filter(t => t.apartment === aptId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const stats = {
    total: aptTickets.length,
    open: aptTickets.filter(t => t.status === 'abierto').length,
    proc: aptTickets.filter(t => t.status === 'proceso').length,
    espera: aptTickets.filter(t => t.status === 'espera').length,
    closed: aptTickets.filter(t => t.status === 'cerrado').length,
    critical: aptTickets.filter(t => t.priority === 'alta' && t.status !== 'cerrado').length,
  };

  return (
    <div className="view-apt-detail">
      <div className="view-header">
        <button className="btn-back" onClick={onBack}>← Volver</button>
        <div>
          <h2>{apt.id}</h2>
          <p className="mono small">{apt.beds} hab · {apt.baths} baños · {apt.capacity} pax — {apt.address}</p>
        </div>
      </div>

      <div className="apt-detail-stats">
        <div className="stat-box">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">tickets totales</div>
        </div>
        <div className="stat-box active">
          <div className="stat-value">{stats.open + stats.proc}</div>
          <div className="stat-label">activos</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.critical}</div>
          <div className="stat-label">críticos</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.closed}</div>
          <div className="stat-label">resueltos</div>
        </div>
      </div>

      <div className="apt-detail-list">
        <h3 className="section-title">Histórico de tickets ({aptTickets.length})</h3>
        {aptTickets.length === 0 ? (
          <div className="empty-state mono">Sin tickets aún para este apartamento</div>
        ) : (
          <ul className="ticket-list">
            {aptTickets.map(t => {
              const ag = PD_O.lookups.agents[t.agent];
              return (
                <li key={t.id} className="ticket-row" onClick={() => onSelectTicket(t.id)}>
                  <div className="ticket-col-id">
                    <span className="mono">{t.id}</span>
                  </div>
                  <div className="ticket-col-issue">
                    <IC_O issueId={t.issue} />
                  </div>
                  <div className="ticket-col-status">
                    <SP_O statusId={t.status} />
                  </div>
                  <div className="ticket-col-priority">
                    {t.priority === 'alta' && <span className="priority-badge crit">Alta</span>}
                    {t.priority === 'media' && <span className="priority-badge warn">Media</span>}
                    {t.priority === 'baja' && <span className="priority-badge">Baja</span>}
                  </div>
                  <div className="ticket-col-desc">{t.description}</div>
                  <div className="ticket-col-agent">{ag?.name.split(' ')[0] || 'N/A'}</div>
                  <div className="ticket-col-date mono">{PD_O.fmt.ago(t.updatedAt)}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ════════════════ Agents View ════════════════ */
function AgentsView({ tickets, onSelectTicket, currentUser, onNav }) {
  // Restricción: solo admins pueden ver todos los agentes
  // Verifica SOLO el campo access_level
  const userAccessLevel = currentUser?.access_level || 'user';
  console.log('🔐 AgentsView - currentUser:', currentUser);
  console.log('🔐 access_level value:', userAccessLevel);
  const canViewAllAgents = userAccessLevel === 'admin';
  
  if (!canViewAllAgents) {
    return (
      <div className="view-empty">
        <h3>Acceso restringido</h3>
        <p>Solo administradores pueden ver el rendimiento del equipo.</p>
        <p style={{fontSize: '12px', color: 'var(--ink-4)', marginTop: '12px'}}>Tu access_level: <strong>{userAccessLevel}</strong></p>
      </div>
    );
  }

  const agentStats = useM_O(() => {
    return PD_O.AGENTS.map((a) => {
      const ts = tickets.filter((t) => t.agent === a.id);
      const closed = ts.filter((t) => t.status === 'cerrado');
      const open = ts.filter((t) => t.status !== 'cerrado').length;
      const avgResolve = closed.length ?
      Math.round(closed.reduce((acc, t) => acc + (t.resolveMins || 0), 0) / closed.length) :
      0;
      const onTime = closed.filter((t) => new Date(t.closedAt) <= new Date(t.slaDeadline)).length;
      const slaPct = closed.length ? Math.round(onTime / closed.length * 100) : 0;
      const critical = ts.filter((t) => t.priority === 'alta').length;
      return { ...a, total: ts.length, open, closed: closed.length, avgResolve, slaPct, critical };
    }).sort((a, b) => b.closed - a.closed);
  }, [tickets]);

  return (
    <div className="view-agents">
      {/* Leaderboard */}
      <div className="agents-leaderboard">
        <div className="lb-head">
          <h3>Rendimiento del equipo</h3>
          <div className="lb-period mono">últimos 7 días</div>
        </div>
        <table className="lb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agente</th>
              <th>Rol</th>
              <th>Activos</th>
              <th>Resueltos</th>
              <th>SLA cumplido</th>
              <th>T. medio</th>
              <th>Carga</th>
            </tr>
          </thead>
          <tbody>
            {agentStats.map((a, i) =>
            <tr key={a.id} onClick={() => onNav('agent-detail', { agentId: a.id })} className="clickable">
                <td className="lb-rank mono">{(i + 1).toString().padStart(2, '0')}</td>
                <td>
                  <div className="lb-agent">
                    <Av_O agent={a} size={32} />
                    <div>
                      <div className="lb-name">{a.name}</div>
                      <div className="lb-shift mono">{a.shift}</div>
                    </div>
                  </div>
                </td>
                <td className="lb-role mono">{a.role}</td>
                <td className="lb-num mono">{a.open}</td>
                <td className="lb-num mono">{a.closed}</td>
                <td>
                  <div className="lb-sla">
                    <div className="lb-sla-bar">
                      <div className="lb-sla-fill" style={{
                      width: `${a.slaPct}%`,
                      background: a.slaPct >= 80 ? 'var(--ok)' : a.slaPct >= 60 ? 'var(--warn)' : 'var(--crit)'
                    }} />
                    </div>
                    <span className="mono">{a.slaPct}%</span>
                  </div>
                </td>
                <td className="lb-num mono">{PD_O.fmt.duration(a.avgResolve)}</td>
                <td>
                  <LoadGauge value={a.open} max={Math.max(...agentStats.map((x) => x.open), 1)} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Agent cards detail */}
      <div className="agents-grid">
        {agentStats.map((a) =>
        <AgentCard key={a.id} agent={a} tickets={tickets.filter((t) => t.agent === a.id)} onSelectTicket={onSelectTicket} onNav={onNav} />
        )}
      </div>
    </div>);

}

function LoadGauge({ value, max }) {
  const cells = 10;
  const filled = Math.round(value / max * cells);
  return (
    <div className="load-gauge">
      {Array.from({ length: cells }).map((_, i) =>
      <span
        key={i}
        className={cn_O('load-cell', i < filled && 'active')}
        style={i < filled ? {
          background: filled > 7 ? 'var(--crit)' : filled > 4 ? 'var(--warn)' : 'var(--ok)'
        } : {}} />

      )}
    </div>);

}

function AgentCard({ agent, tickets, onSelectTicket, onNav }) {
  const activeTickets = tickets.filter((t) => t.status !== 'cerrado').slice(0, 3);
  return (
    <div className="agent-card">
      <div className="ag-head">
        <Av_O agent={agent} size={44} />
        <div className="ag-name-block">
          <div className="ag-name">{agent.name}</div>
          <div className="ag-meta mono">{agent.role} · {agent.shift}</div>
        </div>
        <button className="btn-ghost-sm mono">…</button>
      </div>
      <div className="ag-mini-stats">
        <div><div className="ms-v">{agent.open}</div><div className="ms-l mono">activos</div></div>
        <div><div className="ms-v">{agent.closed}</div><div className="ms-l mono">resueltos</div></div>
        <div><div className="ms-v">{agent.slaPct}%</div><div className="ms-l mono">SLA</div></div>
      </div>
      <div className="ag-active-list">
        <div className="ag-active-head mono">activos · top 3</div>
        {activeTickets.length === 0 ?
        <div className="ag-empty mono">sin tickets activos</div> :
        activeTickets.map((t) =>
        <button key={t.id} className="ag-active-row" onClick={() => onSelectTicket(t.id)}>
            <SP_O statusId={t.status} dense />
            <AC_O aptId={t.apartment} />
            <span className="ag-active-issue">{PD_O.lookups.issues[t.issue]?.label}</span>
            <span className="ag-active-time mono">{PD_O.fmt.ago(t.createdAt)}</span>
          </button>
        )}
      </div>
    </div>);

}

/* ════════════════ Metrics View ════════════════ */
function MetricsView({ tickets }) {
  // Trend: tickets per day for last 14 days
  const trendData = useM_O(() => {
    const days = 14;
    const created = Array(days).fill(0);
    const closed = Array(days).fill(0);
    tickets.forEach((t) => {
      const cD = Math.floor((PD_O.NOW - new Date(t.createdAt)) / 86400000);
      if (cD >= 0 && cD < days) created[days - 1 - cD]++;
      if (t.closedAt) {
        const dD = Math.floor((PD_O.NOW - new Date(t.closedAt)) / 86400000);
        if (dD >= 0 && dD < days) closed[days - 1 - dD]++;
      }
    });
    return { created, closed };
  }, [tickets]);

  // Resolution time distribution
  const resolveDistribution = useM_O(() => {
    const buckets = [
    { id: '<1h', label: '< 1h', min: 0, max: 60 },
    { id: '1-4h', label: '1–4h', min: 60, max: 240 },
    { id: '4-12h', label: '4–12h', min: 240, max: 720 },
    { id: '12-24h', label: '12–24h', min: 720, max: 1440 },
    { id: '>24h', label: '> 24h', min: 1440, max: Infinity }];

    return buckets.map((b) => ({
      ...b,
      value: tickets.filter((t) => t.resolveMins != null && t.resolveMins >= b.min && t.resolveMins < b.max).length
    }));
  }, [tickets]);

  const total = tickets.length;
  const closed = tickets.filter((t) => t.status === 'cerrado').length;
  const closeRate = total ? Math.round(closed / total * 100) : 0;

  const max14 = Math.max(...trendData.created, ...trendData.closed, 1);

  return (
    <div className="view-metrics">
      <div className="metrics-grid">

        {/* Trend chart */}
        <div className="metric-card span-2">
          <div className="card-head">
            <div>
              <h4>Tendencia · creados vs cerrados</h4>
              <p className="mono small">últimos 14 días</p>
            </div>
            <div className="trend-legend">
              <span className="leg-item"><span className="dot" style={{ background: 'var(--crit)' }} /> creados</span>
              <span className="leg-item"><span className="dot" style={{ background: 'var(--ok)' }} /> cerrados</span>
            </div>
          </div>
          <div className="trend-chart">
            <svg viewBox="0 0 700 220" preserveAspectRatio="none" className="trend-svg">
              {/* gridlines */}
              {[0, 1, 2, 3, 4].map((i) =>
              <line key={i} x1="0" y1={i * 55} x2="700" y2={i * 55}
              stroke="oklch(0.93 0.005 80)" strokeWidth="1" strokeDasharray="3 5" />
              )}
              {/* created area */}
              <Polyline data={trendData.created} max={max14} color="var(--crit)" fill="oklch(0.96 0.025 25)" />
              {/* closed line */}
              <Polyline data={trendData.closed} max={max14} color="var(--ok)" fill="oklch(0.96 0.025 155)" />
            </svg>
            <div className="trend-axis mono">
              {trendData.created.map((_, i) =>
              <span key={i}>{i % 2 === 0 ? `D-${13 - i}` : ''}</span>
              )}
            </div>
          </div>
        </div>

        {/* Resolve distribution */}
        <div className="metric-card">
          <div className="card-head">
            <h4>Tiempo de resolución</h4>
            <span className="mono small">{closed} cerrados</span>
          </div>
          <BC_O data={resolveDistribution} color="var(--accent)" />
        </div>

        {/* Key metrics */}
        <div className="metric-card">
          <div className="card-head">
            <h4>Indicadores clave</h4>
          </div>
          <div className="key-metrics">
            <KeyMetric label="Tasa de cierre" value={`${closeRate}%`} bar={closeRate} barColor="var(--ok)" />
            <KeyMetric label="SLA cumplido" value="78%" bar={78} barColor="var(--accent)" />
            <KeyMetric label="Re-aperturas" value="4%" bar={4} barColor="var(--warn)" tone="reverse" />
            <KeyMetric label="Satisfacción" value="4.6 / 5" bar={92} barColor="var(--ok)" />
          </div>
        </div>

        {/* Top issues over time */}
        <div className="metric-card">
          <div className="card-head">
            <h4>Issues más comunes</h4>
          </div>
          <BC_O
            data={Object.entries(tickets.reduce((acc, t) => {acc[t.issue] = (acc[t.issue] || 0) + 1;return acc;}, {})).
            map(([id, value]) => ({ id, label: PD_O.lookups.issues[id]?.label, value })).
            sort((a, b) => b.value - a.value).
            slice(0, 6)
            }
            color="oklch(0.55 0.10 280)" />
          
        </div>

        {/* By status donut */}
        <div className="metric-card">
          <div className="card-head">
            <h4>Distribución por estado</h4>
          </div>
          <div className="donut-wrap">
            <DN_O slices={PD_O.STATUSES.map((s) => ({
              id: s.id, label: s.label,
              value: tickets.filter((t) => t.status === s.id).length,
              color: s.color
            }))} />
            <div className="donut-legend">
              {PD_O.STATUSES.map((s) =>
              <div key={s.id} className="legend-item">
                  <span className="dot" style={{ background: s.color }} />
                  <span className="lbl">{s.label}</span>
                  <span className="val mono">{tickets.filter((t) => t.status === s.id).length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>);

}

function Polyline({ data, max, color, fill }) {
  const W = 700,H = 220;
  const step = W / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${H - v / max * (H - 20) - 8}`);
  const linePts = pts.join(' ');
  const areaPts = `0,${H} ${linePts} ${W},${H}`;
  return (
    <g>
      <polygon points={areaPts} fill={fill} opacity="0.55" />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) =>
      <circle key={i} cx={i * step} cy={H - v / max * (H - 20) - 8} r="2.5" fill={color} />
      )}
    </g>);

}

function KeyMetric({ label, value, bar, barColor }) {
  return (
    <div className="key-metric">
      <div className="km-row">
        <span className="km-label">{label}</span>
        <span className="km-value mono">{value}</span>
      </div>
      <div className="km-bar">
        <div className="km-fill" style={{ width: `${bar}%`, background: barColor }} />
      </div>
    </div>);

}

/* ════════════════ Agent Detail View ════════════════ */
function AgentDetailView({ tickets, agentId, onSelectTicket, onNav, onBack }) {
  const agent = PD_O.lookups.agents[agentId];
  if (!agent) return <div className="view-empty">Agente no encontrado</div>;

  const agentTickets = tickets.filter(t => t.agent === agentId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const stats = {
    total: agentTickets.length,
    open: agentTickets.filter(t => t.status === 'abierto').length,
    proc: agentTickets.filter(t => t.status === 'proceso').length,
    espera: agentTickets.filter(t => t.status === 'espera').length,
    closed: agentTickets.filter(t => t.status === 'cerrado').length,
    critical: agentTickets.filter(t => t.priority === 'alta' && t.status !== 'cerrado').length,
    avgResolve: agentTickets.filter(t => t.closedAt).length ? 
      Math.round(agentTickets.filter(t => t.closedAt).reduce((a, t) => a + (t.resolveMins || 0), 0) / agentTickets.filter(t => t.closedAt).length) :
      0
  };

  return (
    <div className="view-agent-detail">
      <div className="view-header">
        <button className="btn-back" onClick={onBack}>← Volver</button>
        <div>
          <div className="agent-detail-head">
            <Av_O agent={agent} size={48} />
            <div>
              <h2>{agent.name}</h2>
              <p className="mono small">{agent.role} · {agent.shift}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="agent-detail-stats">
        <div className="stat-box">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">tickets totales</div>
        </div>
        <div className="stat-box active">
          <div className="stat-value">{stats.open + stats.proc}</div>
          <div className="stat-label">activos</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.critical}</div>
          <div className="stat-label">críticos</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{PD_O.fmt.duration(stats.avgResolve)}</div>
          <div className="stat-label">tiempo medio</div>
        </div>
      </div>

      <div className="agent-detail-list">
        <h3 className="section-title">Histórico de tickets ({agentTickets.length})</h3>
        {agentTickets.length === 0 ? (
          <div className="empty-state mono">Sin tickets aún para este agente</div>
        ) : (
          <ul className="ticket-list">
            {agentTickets.map(t => {
              const apt = PD_O.lookups.apartments[t.apartment];
              return (
                <li key={t.id} className="ticket-row" onClick={() => onSelectTicket(t.id)}>
                  <div className="ticket-col-id">
                    <span className="mono">{t.id}</span>
                  </div>
                  <div className="ticket-col-issue">
                    <IC_O issueId={t.issue} />
                  </div>
                  <div className="ticket-col-status">
                    <SP_O statusId={t.status} />
                  </div>
                  <div className="ticket-col-priority">
                    {t.priority === 'alta' && <span className="priority-badge crit">Alta</span>}
                    {t.priority === 'media' && <span className="priority-badge warn">Media</span>}
                    {t.priority === 'baja' && <span className="priority-badge">Baja</span>}
                  </div>
                  <div className="ticket-col-apt">{apt?.id || 'N/A'}</div>
                  <div className="ticket-col-desc">{t.description}</div>
                  <div className="ticket-col-date mono">{PD_O.fmt.ago(t.updatedAt)}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ApartmentsView, ApartmentDetailView, AgentsView, AgentDetailView, MetricsView });
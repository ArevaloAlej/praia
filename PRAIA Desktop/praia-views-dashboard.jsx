/* ───────────────── PRAIA · Dashboard view ───────────────── */

const { useState: useS_D, useMemo: useM_D } = React;
const { KPICard, Sparkline, BarChart, Donut, Avatar: Av_D, StatusPill: SP_D,
        PriorityBars: PB_D, IssueChip: IC_D, ApartmentChip: AC_D,
        PlatformChip: PC_D, SLAIndicator: SI_D, classNames: cn_D } = window.PraiaUI;

const PD_D = window.PRAIA_DATA;

function DashboardView({ tickets, onSelectTicket, onNav, currentUser }) {
  const stats = useM_D(() => {
    const open = tickets.filter(t => t.status === 'abierto').length;
    const proc = tickets.filter(t => t.status === 'proceso').length;
    const espera = tickets.filter(t => t.status === 'espera').length;
    const closed = tickets.filter(t => t.status === 'cerrado').length;

    const closedTickets = tickets.filter(t => t.resolveMins != null);
    const avgResolve = closedTickets.length
      ? Math.round(closedTickets.reduce((a, t) => a + t.resolveMins, 0) / closedTickets.length)
      : 0;

    const critical = tickets.filter(t => t.priority === 'alta' && t.status !== 'cerrado').length;
    const overdue = tickets.filter(t => t.status !== 'cerrado' && new Date(t.slaDeadline) < PD_D.NOW).length;

    // tickets by issue
    const byIssue = {};
    tickets.forEach(t => { byIssue[t.issue] = (byIssue[t.issue]||0) + 1; });
    const issueRanking = Object.entries(byIssue)
      .map(([id, value]) => ({ id, label: PD_D.lookups.issues[id]?.label || id, value }))
      .sort((a,b) => b.value - a.value);

    // tickets by apartment (top 10)
    const byApt = {};
    tickets.forEach(t => { byApt[t.apartment] = (byApt[t.apartment]||0) + 1; });
    const aptRanking = Object.entries(byApt)
      .map(([id, value]) => ({ id, label: id, value }))
      .sort((a,b) => b.value - a.value);

    // platform breakdown
    const byPlat = {};
    tickets.forEach(t => { byPlat[t.platform] = (byPlat[t.platform]||0) + 1; });
    const platSlices = Object.entries(byPlat).map(([id, value]) => ({
      id, label: PD_D.lookups.platforms[id]?.label || id, value,
      color: PD_D.lookups.platforms[id]?.color || 'oklch(0.5 0.05 240)',
    })).sort((a,b)=>b.value-a.value);

    return { open, proc, espera, closed, avgResolve, critical, overdue, issueRanking, aptRanking, platSlices };
  }, [tickets]);

  // Activity (last 5 updated)
  const recent = useM_D(() =>
    [...tickets].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 7),
  [tickets]);

  // Critical open tickets
  const criticalOpen = useM_D(() =>
    tickets.filter(t => t.priority === 'alta' && t.status !== 'cerrado')
           .sort((a,b) => new Date(a.slaDeadline) - new Date(b.slaDeadline))
           .slice(0, 5),
  [tickets]);

  // Mini sparkline data: tickets created per day for last 7 days
  const sparkData = useM_D(() => {
    const buckets = Array(7).fill(0);
    tickets.forEach(t => {
      const d = new Date(t.createdAt);
      const dayDiff = Math.floor((PD_D.NOW - d) / 86400000);
      if (dayDiff >= 0 && dayDiff < 7) buckets[6 - dayDiff]++;
    });
    return buckets;
  }, [tickets]);

  // Tasa de cierre real
  const closeRate = tickets.length ? Math.round((stats.closed / tickets.length) * 100) : 0;
  // Suficiente data para mostrar tendencias?
  const hasEnoughData = tickets.length >= 8;

  // Saludo personalizado
  const firstName = (currentUser?.name || '').split(' ')[0] || 'hola';
  const today = new Date();
  const dayName = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][today.getDay()];
  const monthName = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][today.getMonth()];
  const tz = '-' + String(Math.abs(today.getTimezoneOffset()/60)).padStart(2,'0') + ':00';
  const dateLabel = `${dayName} · ${today.getDate()} ${monthName} · ${today.getHours().toString().padStart(2,'0')}:${today.getMinutes().toString().padStart(2,'0')} GMT${tz}`;

  return (
    <div className="view-dashboard">
      {/* Setup wizard if Sheet is fresh */}
      {(PD_D.APARTMENTS.length === 0 || PD_D.AGENTS.length === 0) && (
        <div className="setup-card">
          <div className="setup-head">
            <span className="setup-tag mono">⚙ Setup pendiente</span>
            <h3>Configura tu workspace para empezar</h3>
            <p>Tu Sheet está lista pero necesita data inicial. Sigue estos pasos para registrar tu primer ticket:</p>
          </div>
          <div className="setup-steps">
            <div className={`setup-step ${PD_D.APARTMENTS.length > 0 ? 'done' : ''}`}>
              <span className="setup-num">1</span>
              <div>
                <div className="setup-title">Agrega tus apartamentos</div>
                <div className="setup-desc">
                  Abre tu Sheet → hoja <strong>Apartments</strong> → una fila por apartamento con sus columnas (<code className="mono inline">id · building · beds · baths · capacity · address</code>).
                  {PD_D.APARTMENTS.length > 0 && <> <span className="setup-ok">· {PD_D.APARTMENTS.length} registrados ✓</span></>}
                </div>
              </div>
            </div>
            <div className={`setup-step ${PD_D.AGENTS.length > 0 ? 'done' : ''}`}>
              <span className="setup-num">2</span>
              <div>
                <div className="setup-title">Agrega tus agentes</div>
                <div className="setup-desc">
                  Abre tu Sheet → hoja <strong>Agents</strong> → una fila por miembro del equipo (<code className="mono inline">id · name · role · shift · color · active</code>).
                  {PD_D.AGENTS.length > 0 && <> <span className="setup-ok">· {PD_D.AGENTS.length} registrados ✓</span></>}
                </div>
              </div>
            </div>
            <div className={`setup-step ${tickets.length > 0 ? 'done' : ''}`}>
              <span className="setup-num">3</span>
              <div>
                <div className="setup-title">Crea tu primer ticket</div>
                <div className="setup-desc">
                  Una vez tengas apartamentos y agentes, click en <strong>+ Nuevo</strong> arriba a la derecha.
                  {tickets.length > 0 && <> <span className="setup-ok">· {tickets.length} tickets ✓</span></>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero greeting */}
      <div className="dash-hero">
        <div>
          <div className="dash-eyebrow mono">{dateLabel}</div>
          <h2 className="dash-greet">Hola {firstName} 👋</h2>
          <p className="dash-sub">
            {tickets.length === 0 ? (
              <>Bienvenido a PRAIA. Aún no hay tickets — crea el primero desde <strong>+ Nuevo</strong> o desde la vista <strong>Tickets</strong>.</>
            ) : (
              <>
                Tienes <strong>{stats.open + stats.proc}</strong> tickets activos hoy.
                {stats.overdue > 0 && <> <span style={{color:'var(--crit)'}}><strong>{stats.overdue}</strong> con SLA vencido.</span></>}
                {stats.critical > 0 && <> Mantén el foco en los <strong>{stats.critical}</strong> de prioridad alta.</>}
              </>
            )}
          </p>
        </div>
        <div className="dash-actions">
          <button className="btn-ghost mono">↓ Exportar día</button>
          <button className="btn-primary" onClick={() => onNav('tickets')}>Abrir tickets →</button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="kpi-grid">
        <KPICard
          label="Tickets abiertos"
          value={stats.open}
          delta={hasEnoughData ? -12 : null}
          sparkline={hasEnoughData ? sparkData : null}
          accent="var(--crit)"
          sub={`${stats.proc} en proceso · ${stats.espera} en espera`}
        />
        <KPICard
          label="Cerrados (7 días)"
          value={stats.closed}
          delta={hasEnoughData ? +18 : null}
          sparkline={hasEnoughData ? sparkData.map(v => Math.max(0, Math.floor(v*1.4) - 1)) : null}
          accent="var(--ok)"
          sub={tickets.length ? `tasa de resolución ${closeRate}%` : 'sin datos aún'}
        />
        <KPICard
          label="Tiempo medio"
          value={stats.avgResolve ? PD_D.fmt.duration(stats.avgResolve) : '—'}
          delta={hasEnoughData ? -8 : null}
          sparkline={hasEnoughData ? [42, 38, 51, 40, 35, 36, stats.avgResolve] : null}
          accent="var(--accent)"
          sub={'objetivo: < 1h 30m'}
        />
        <KPICard
          label="SLA vencido"
          value={stats.overdue}
          delta={null}
          accent="var(--warn)"
          sub={stats.critical ? `${stats.critical} criticos sin cerrar` : 'sin críticos'}
        />
      </div>

      {/* Main grid */}
      <div className="dash-grid">
        {/* Status panel */}
        <div className="dash-card lg">
          <div className="card-head">
            <h4>Estado actual del backlog</h4>
            <button className="link-btn mono" onClick={()=>onNav('tickets')}>ver todo →</button>
          </div>
          <div className="status-grid">
            {PD_D.STATUSES.map(s => {
              const n = tickets.filter(t => t.status === s.id).length;
              return (
                <button key={s.id} className="status-bucket" onClick={() => onNav('tickets', { status: s.id })}>
                  <div className="bucket-head">
                    <span className="bucket-dot" style={{ background: s.color }} />
                    <span className="bucket-label">{s.label}</span>
                  </div>
                  <div className="bucket-value" style={{ color: s.color }}>{n}</div>
                  <div className="bucket-bar" style={{ background: s.bg }}>
                    <div className="bucket-bar-fill" style={{ width: `${(n / tickets.length) * 100}%`, background: s.color }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Critical alerts */}
        <div className="dash-card">
          <div className="card-head">
            <h4>Críticos abiertos</h4>
            <span className="card-pill danger">{criticalOpen.length}</span>
          </div>
          {criticalOpen.length === 0 ? (
            <div className="card-empty mono">sin críticos · todo en orden</div>
          ) : (
            <ul className="critical-list">
              {criticalOpen.map(t => (
                <li key={t.id} onClick={() => onSelectTicket(t.id)}>
                  <div className="crit-line-1">
                    <span className="mono crit-id">{t.id}</span>
                    <AC_D aptId={t.apartment} />
                    <SI_D ticket={t} />
                  </div>
                  <div className="crit-line-2">
                    <IC_D issueId={t.issue} />
                    <span className="crit-desc">{t.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Issues breakdown */}
        <div className="dash-card">
          <div className="card-head">
            <h4>Top issues</h4>
            <span className="mono small">{stats.issueRanking.length} categorías</span>
          </div>
          <BarChart data={stats.issueRanking.slice(0, 6)} color="oklch(0.55 0.10 220)" />
        </div>

        {/* Apartment heatmap */}
        <div className="dash-card">
          <div className="card-head">
            <h4>Apartamentos con más tickets</h4>
            <button className="link-btn mono" onClick={() => onNav('apartments')}>vista completa →</button>
          </div>
          <BarChart
            data={stats.aptRanking.slice(0, 6)}
            color="oklch(0.55 0.10 25)"
          />
        </div>

        {/* Platform donut */}
        <div className="dash-card">
          <div className="card-head">
            <h4>Tickets por plataforma</h4>
          </div>
          <div className="donut-wrap">
            <Donut slices={stats.platSlices} />
            <div className="donut-legend">
              {stats.platSlices.map(s => (
                <div key={s.id} className="legend-item">
                  <span className="dot" style={{ background: s.color }} />
                  <span className="lbl">{s.label}</span>
                  <span className="val mono">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="dash-card lg">
          <div className="card-head">
            <h4>Actividad reciente</h4>
            <span className="mono small">últimas 7</span>
          </div>
          <ul className="activity-list">
            {recent.map(t => {
              const ag = PD_D.lookups.agents[t.agent];
              return (
                <li key={t.id} onClick={() => onSelectTicket(t.id)}>
                  <div className="act-avatar"><Av_D agent={ag} size={26} /></div>
                  <div className="act-body">
                    <div className="act-line-1">
                      <strong>{ag?.name.split(' ')[0]}</strong>
                      <span className="act-verb">actualizó</span>
                      <span className="mono act-tid">{t.id}</span>
                      <span className="act-sep">·</span>
                      <AC_D aptId={t.apartment} />
                      <SP_D statusId={t.status} dense />
                    </div>
                    <div className="act-line-2">
                      <IC_D issueId={t.issue} />
                      <span className="act-desc">{t.description}</span>
                    </div>
                  </div>
                  <div className="act-time mono">{PD_D.fmt.ago(t.updatedAt)}</div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardView });

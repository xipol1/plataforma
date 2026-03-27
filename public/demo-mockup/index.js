/* ── Adflow Demo Mockup — index.js ── */
;(function () {
  'use strict'

  /* ── Helpers ─────────────────────────────────────────────── */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel)
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)]
  const el = (tag, attrs, ...children) => {
    const e = document.createElement(tag)
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'cls') { v.split(' ').forEach(c => c && e.classList.add(c)) }
      else if (k === 'html') { e.innerHTML = v }
      else if (k.startsWith('on')) { e.addEventListener(k.slice(2).toLowerCase(), v) }
      else { e.setAttribute(k, v) }
    })
    children.forEach(c => c != null && e.append(c))
    return e
  }

  /* ── State ───────────────────────────────────────────────── */
  const params = new URLSearchParams(location.search)
  let role = params.get('role') === 'creator' ? 'creator' : 'advertiser'
  let activePage = 'overview'

  /* ── Platform colors ─────────────────────────────────────── */
  const PLAT_COLOR = {
    WhatsApp: '#25d366', Telegram: '#2aabee', Discord: '#5865f2',
    YouTube: '#ef4444', Instagram: '#f97316', TikTok: '#010101',
  }
  const platStyle = (p) => ({ background: `${PLAT_COLOR[p] || '#8b5cf6'}18`, color: PLAT_COLOR[p] || '#8b5cf6' })

  /* ── Mock data — Advertiser ────────────────────────────────── */
  const ADV = {
    kpis: [
      { label: 'Gasto Total', value: '€4.820', change: '+12%', dir: 'up', sub: 'vs mes anterior', icon: '💰', color: '#8b5cf6' },
      { label: 'Impresiones', value: '284K', change: '+8%', dir: 'up', sub: 'este mes', icon: '👁', color: '#3b82f6' },
      { label: 'Clicks', value: '9.240', change: '+21%', dir: 'up', sub: 'CTR 3.25%', icon: '🖱', color: '#10b981' },
      { label: 'Campañas Activas', value: '7', change: '-1', dir: 'down', sub: '2 pausadas', icon: '📢', color: '#f59e0b' },
    ],
    campaigns: [
      { name: 'Ecommerce Growth Q1', platform: 'WhatsApp', status: 'active', impressions: '42K', clicks: '1.380', spend: '€640', ctr: '3.3%' },
      { name: 'Tech Audience March', platform: 'Telegram', status: 'active', impressions: '68K', clicks: '2.210', spend: '€900', ctr: '3.2%' },
      { name: 'Gaming Spring Drop', platform: 'Discord',  status: 'paused', impressions: '29K', clicks: '840',   spend: '€420', ctr: '2.9%' },
      { name: 'AI Tools Promo',     platform: 'Telegram', status: 'active', impressions: '55K', clicks: '1.980', spend: '€720', ctr: '3.6%' },
      { name: 'Fitness Challenge',  platform: 'WhatsApp', status: 'active', impressions: '38K', clicks: '1.190', spend: '€560', ctr: '3.1%' },
    ],
    spendChart: [320, 480, 390, 640, 580, 720, 820, 760, 900, 840, 960, 820],
    months: ['E','F','M','A','M','J','J','A','S','O','N','D'],
    breakdown: [
      { label: 'WhatsApp', pct: 42, color: '#25d366' },
      { label: 'Telegram', pct: 35, color: '#2aabee' },
      { label: 'Discord',  pct: 23, color: '#5865f2' },
    ],
    channels: [
      { initials:'EH', color:'#25d366', name:'ecomhub',    platform:'WhatsApp', members:'12.4K', price:'€320', rating:'5.0' },
      { initials:'TP', color:'#2aabee', name:'techpro',    platform:'Telegram', members:'8.2K',  price:'€450', rating:'4.9' },
      { initials:'GM', color:'#5865f2', name:'gamermk',    platform:'Discord',  members:'4.5K',  price:'€280', rating:'4.8' },
      { initials:'AI', color:'#a855f7', name:'ai_labs_co', platform:'Telegram', members:'11K',   price:'€220', rating:'4.8' },
    ],
  }

  /* ── Mock data — Creator ────────────────────────────────── */
  const CRE = {
    kpis: [
      { label: 'Ganancias Totales', value: '€2.840', change: '+18%', dir: 'up', sub: 'este mes', icon: '💸', color: '#25d366' },
      { label: 'Solicitudes Nuevas', value: '14', change: '+5', dir: 'up', sub: 'pendientes de revisión', icon: '📥', color: '#f59e0b' },
      { label: 'Publicaciones', value: '38', change: '+6', dir: 'up', sub: 'completadas este mes', icon: '📤', color: '#3b82f6' },
      { label: 'Rating Promedio', value: '4.9★', change: '+0.1', dir: 'up', sub: 'de 5 posible', icon: '⭐', color: '#f97316' },
    ],
    channels: [
      { name:'Marketing Diario ES', platform:'WhatsApp', members:'12.4K', price:'€320/post', status:'verified', earnings:'€1.280' },
      { name:'Tech Insights ES',     platform:'Telegram', members:'8.2K',  price:'€450/post', status:'verified', earnings:'€900' },
      { name:'Comunidad Fitness',    platform:'WhatsApp', members:'6.8K',  price:'€180/post', status:'pending',  earnings:'€360' },
      { name:'Gaming Hub Discord',   platform:'Discord',  members:'4.5K',  price:'€280/post', status:'verified', earnings:'€280' },
    ],
    requests: [
      { from:'TechBrand Co.',  channel:'Tech Insights ES',     amount:'€450', date:'Hoy',   status:'pending',  avatar:'TB', color:'#2aabee' },
      { from:'FitLife App',    channel:'Comunidad Fitness',     amount:'€180', date:'Hoy',   status:'pending',  avatar:'FL', color:'#25d366' },
      { from:'AI Labs Co.',    channel:'Marketing Diario ES',   amount:'€320', date:'Ayer',  status:'accepted', avatar:'AI', color:'#a855f7' },
      { from:'Ecom Growth',    channel:'Tech Insights ES',      amount:'€450', date:'Ayer',  status:'accepted', avatar:'EG', color:'#f97316' },
      { from:'GamersUnited',   channel:'Gaming Hub Discord',    amount:'€280', date:'26 mar',status:'accepted', avatar:'GU', color:'#5865f2' },
    ],
    earningsChart: [180, 320, 240, 480, 380, 560, 480, 640, 580, 720, 660, 840],
    months: ['E','F','M','A','M','J','J','A','S','O','N','D'],
  }

  /* ── SVG Sparkline ────────────────────────────────────────── */
  function sparklineSVG(data, color, w = 80, h = 32) {
    const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1
    const pad = 3
    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * (w - pad * 2) + pad,
      y: h - pad - ((v - min) / rng) * (h - pad * 2),
    }))
    let d = `M ${pts[0].x},${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const cpx1 = pts[i-1].x + (pts[i].x - pts[i-1].x) * 0.4
      const cpx2 = pts[i].x   - (pts[i].x - pts[i-1].x) * 0.4
      d += ` C ${cpx1},${pts[i-1].y} ${cpx2},${pts[i].y} ${pts[i].x},${pts[i].y}`
    }
    const fill = `${d} L ${pts[pts.length-1].x},${h} L ${pts[0].x},${h} Z`
    const gid = `g${color.replace('#','')}`
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${fill}" fill="url(#${gid})"/>
      <path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }

  /* ── Bar chart ────────────────────────────────────────────── */
  function barChartHTML(data, labels, color) {
    const max = Math.max(...data)
    return `<div class="bar-chart">` +
      data.map((v, i) => `
        <div class="bar-col">
          <div class="bar" style="height:${Math.round((v/max)*70)+4}px;background:${color};opacity:${i===data.length-1?1:0.45};"></div>
          <span class="bar-lbl">${labels[i]}</span>
        </div>`).join('') +
    `</div>`
  }

  /* ── Donut ring ────────────────────────────────────────────── */
  function donutSVG(segments, size = 80) {
    const r = size / 2 - 8, circ = 2 * Math.PI * r
    let offset = 0
    const paths = segments.map(s => {
      const dash = (s.pct / 100) * circ
      const path = `<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${s.color}" stroke-width="9"
        stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-offset * circ / 100}"
        stroke-linecap="round" transform="rotate(-90 ${size/2} ${size/2})"/>`
      offset += s.pct
      return path
    })
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="9"/>
      ${paths.join('')}
    </svg>`
  }

  /* ── Nav items ────────────────────────────────────────────── */
  const ADV_NAV = [
    { id:'overview',  icon:'⬛', svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>', label:'Dashboard' },
    { id:'explore',   svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>', label:'Explorar' },
    { id:'autobuy',   svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', label:'Auto-Buy' },
    { id:'ads',       svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>', label:'Mis Anuncios' },
    { id:'finances',  svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', label:'Finanzas' },
  ]
  const CRE_NAV = [
    { id:'overview',  svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>', label:'Dashboard' },
    { id:'channels',  svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>', label:'Mis Canales' },
    { id:'requests',  svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>', label:'Solicitudes', badge: 14 },
    { id:'earnings',  svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', label:'Ganancias' },
  ]

  /* ── Page renderers ───────────────────────────────────────── */

  function renderAdvOverview() {
    const d = ADV
    return `
      <div class="page-header fade-up">
        <h1>☀️ Buenos días, Rafael</h1>
        <p>Aquí tienes un resumen de tus campañas activas</p>
      </div>

      <div class="kpi-grid">
        ${d.kpis.map((k, i) => `
          <div class="kpi-card fade-up" style="animation-delay:${i*60}ms">
            <div class="kpi-header">
              <span class="kpi-label">${k.label}</span>
              <div class="kpi-icon" style="background:${k.color}18;color:${k.color}">${k.icon}</div>
            </div>
            <div class="kpi-value">${k.value}</div>
            <div class="kpi-footer">
              <span class="kpi-change ${k.dir}">${k.dir==='up'?'↑':'↓'} ${k.change}</span>
              <span class="kpi-sub">${k.sub}</span>
            </div>
          </div>`).join('')}
      </div>

      <div class="three-col">
        <div class="card fade-up">
          <div class="card-header">
            <div><div class="card-title">Gasto mensual</div><div class="card-sub">Últimos 12 meses</div></div>
            <button class="btn-ghost">Exportar</button>
          </div>
          ${barChartHTML(d.spendChart, d.months, '#8b5cf6')}
        </div>
        <div class="card fade-up" style="animation-delay:60ms">
          <div class="card-header"><div class="card-title">Por plataforma</div></div>
          <div class="ring-wrap" style="justify-content:center;padding:8px 0">
            ${donutSVG(d.breakdown)}
            <div class="ring-legend">
              ${d.breakdown.map(b => `
                <div class="ring-item">
                  <div class="ring-dot" style="background:${b.color}"></div>
                  <span>${b.label}</span>
                  <strong style="color:var(--text);margin-left:4px">${b.pct}%</strong>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="card fade-up">
        <div class="card-header">
          <div><div class="card-title">Campañas activas</div><div class="card-sub">${d.campaigns.length} campañas</div></div>
          <button class="btn-primary">+ Nueva campaña</button>
        </div>
        <table class="tbl">
          <thead><tr>
            <th>Nombre</th><th>Plataforma</th><th>Estado</th>
            <th>Impresiones</th><th>Clicks</th><th>Gasto</th><th>CTR</th>
          </tr></thead>
          <tbody>
            ${d.campaigns.map(c => `
              <tr>
                <td style="font-weight:500">${c.name}</td>
                <td><span class="plat" style="background:${PLAT_COLOR[c.platform]}18;color:${PLAT_COLOR[c.platform]}">${c.platform}</span></td>
                <td><span class="badge ${c.status==='active'?'badge-ok':'badge-warn'}">${c.status==='active'?'Activa':'Pausada'}</span></td>
                <td>${c.impressions}</td>
                <td>${c.clicks}</td>
                <td style="font-weight:600;color:var(--a)">${c.spend}</td>
                <td>${c.ctr}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`
  }

  function renderAdvExplore() {
    return `
      <div class="page-header fade-up">
        <h1>Explorar canales</h1>
        <p>12.400 canales verificados disponibles</p>
      </div>
      <div class="card fade-up" style="margin-bottom:16px;padding:14px 20px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <input placeholder="Buscar por nombre, nicho..." style="flex:1;min-width:200px;background:var(--bg);border:1px solid var(--border-med);border-radius:8px;padding:8px 12px;color:var(--text);font-family:var(--f);outline:none">
          ${['Todas','WhatsApp','Telegram','Discord'].map(p => `<button class="btn-ghost">${p}</button>`).join('')}
          ${['Ecommerce','Fitness','Marketing','Gaming','IA'].map(c => `<button class="btn-ghost">${c}</button>`).join('')}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">
        ${ADV.channels.map((ch, i) => `
          <div class="card fade-up" style="animation-delay:${i*50}ms;cursor:pointer;transition:transform .15s,box-shadow .15s"
               onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 32px rgba(139,92,246,0.12)'"
               onmouseout="this.style.transform='none';this.style.boxShadow='none'">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
              <div class="av" style="background:${ch.color}22;color:${ch.color};width:40px;height:40px;font-size:13px">${ch.initials}</div>
              <div>
                <div style="font-weight:600;color:var(--text)">${ch.name}</div>
                <span class="plat" style="background:${PLAT_COLOR[ch.platform]}18;color:${PLAT_COLOR[ch.platform]};font-size:10px">${ch.platform}</span>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:10px">
              <div style="font-size:12px;color:var(--muted)">👥 ${ch.members} miembros</div>
              <div style="font-size:12px;color:var(--muted)">⭐ ${ch.rating}</div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-family:var(--d);font-size:18px;font-weight:700;color:var(--a)">${ch.price}</span>
              <button class="btn-primary" style="padding:6px 14px;font-size:12px">Contratar</button>
            </div>
          </div>`).join('')}
      </div>`
  }

  function renderCreatorOverview() {
    const d = CRE
    return `
      <div class="page-header fade-up">
        <h1>👋 Hola, Rafael</h1>
        <p>Tienes <strong style="color:var(--green)">${d.kpis[1].value} solicitudes</strong> pendientes de revisión</p>
      </div>

      <div class="kpi-grid">
        ${d.kpis.map((k, i) => `
          <div class="kpi-card fade-up" style="animation-delay:${i*60}ms">
            <div class="kpi-header">
              <span class="kpi-label">${k.label}</span>
              <div class="kpi-icon" style="background:${k.color}18;color:${k.color}">${k.icon}</div>
            </div>
            <div class="kpi-value">${k.value}</div>
            <div class="kpi-footer">
              <span class="kpi-change ${k.dir}">${k.dir==='up'?'↑':'↓'} ${k.change}</span>
              <span class="kpi-sub">${k.sub}</span>
            </div>
          </div>`).join('')}
      </div>

      <div class="two-col">
        <div class="card fade-up">
          <div class="card-header">
            <div><div class="card-title">Solicitudes recientes</div><div class="card-sub">Pendientes primero</div></div>
            <button class="btn-ghost">Ver todas</button>
          </div>
          ${d.requests.map(r => `
            <div class="feed-item">
              <div class="av" style="background:${r.color}22;color:${r.color};font-size:10px">${r.avatar}</div>
              <div class="feed-body">
                <div class="feed-title">${r.from} — ${r.channel}</div>
                <div class="feed-meta" style="margin-top:2px">
                  <strong style="color:var(--green)">${r.amount}</strong> · ${r.date}
                </div>
              </div>
              <span class="badge ${r.status==='pending'?'badge-warn':'badge-green'}">${r.status==='pending'?'Pendiente':'Aceptada'}</span>
            </div>`).join('')}
        </div>

        <div class="card fade-up" style="animation-delay:60ms">
          <div class="card-header">
            <div><div class="card-title">Ganancias mensuales</div><div class="card-sub">Últimos 12 meses</div></div>
          </div>
          ${barChartHTML(d.earningsChart, d.months, '#25d366')}
          <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:11px;color:var(--muted)">Proyección anual</div>
              <div style="font-family:var(--d);font-size:22px;font-weight:700;color:var(--green)">€34.080</div>
            </div>
            <span class="badge badge-green" style="font-size:12px">↑ 18% vs año anterior</span>
          </div>
        </div>
      </div>

      <div class="card fade-up">
        <div class="card-header">
          <div><div class="card-title">Mis canales</div></div>
          <button class="btn-primary" style="background:var(--green)">+ Registrar canal</button>
        </div>
        <table class="tbl">
          <thead><tr>
            <th>Canal</th><th>Plataforma</th><th>Estado</th><th>Audiencia</th><th>Precio</th><th>Ganancias</th>
          </tr></thead>
          <tbody>
            ${d.channels.map(c => `
              <tr>
                <td style="font-weight:500">${c.name}</td>
                <td><span class="plat" style="background:${PLAT_COLOR[c.platform]}18;color:${PLAT_COLOR[c.platform]}">${c.platform}</span></td>
                <td><span class="badge ${c.status==='verified'?'badge-green':'badge-warn'}">${c.status==='verified'?'Verificado':'Pendiente'}</span></td>
                <td>${c.members}</td>
                <td>${c.price}</td>
                <td style="font-weight:600;color:var(--green)">${c.earnings}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`
  }

  function renderCreatorRequests() {
    return `
      <div class="page-header fade-up">
        <h1>Solicitudes</h1>
        <p>14 pendientes de respuesta · Responde en menos de 24h para mantener tu rating</p>
      </div>
      <div class="card fade-up">
        <div class="card-header">
          <div class="card-title">Todas las solicitudes</div>
          <div style="display:flex;gap:6px">
            ${['Todas','Pendientes','Aceptadas','Rechazadas'].map(f => `<button class="btn-ghost" style="font-size:11px">${f}</button>`).join('')}
          </div>
        </div>
        <table class="tbl">
          <thead><tr>
            <th>Anunciante</th><th>Canal</th><th>Importe</th><th>Fecha</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody>
            ${CRE.requests.map(r => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="av" style="background:${r.color}22;color:${r.color};font-size:10px;width:28px;height:28px">${r.avatar}</div>
                    <span style="font-weight:500">${r.from}</span>
                  </div>
                </td>
                <td style="color:var(--muted)">${r.channel}</td>
                <td style="font-weight:600;color:var(--green)">${r.amount}</td>
                <td style="color:var(--muted2)">${r.date}</td>
                <td><span class="badge ${r.status==='pending'?'badge-warn':'badge-green'}">${r.status==='pending'?'Pendiente':'Aceptada'}</span></td>
                <td>
                  ${r.status==='pending'
                    ? `<div style="display:flex;gap:4px">
                        <button class="btn-primary" style="padding:5px 10px;font-size:11px;background:var(--green)">✓ Aceptar</button>
                        <button class="btn-ghost" style="font-size:11px;padding:5px 10px">✗</button>
                      </div>`
                    : `<button class="btn-ghost" style="font-size:11px">Ver detalles</button>`}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`
  }

  function renderCreatorEarnings() {
    return `
      <div class="page-header fade-up">
        <h1>Ganancias</h1>
        <p>Historial de pagos y proyecciones</p>
      </div>
      <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
        ${[
          { label:'Este mes', value:'€2.840', change:'↑ 18%', color:'#25d366', icon:'💸' },
          { label:'Pendiente de cobro', value:'€740', change:'3 pagos', color:'#f59e0b', icon:'⏳' },
          { label:'Total histórico', value:'€18.240', change:'desde 2024', color:'#8b5cf6', icon:'🏆' },
        ].map(k => `
          <div class="kpi-card fade-up">
            <div class="kpi-header">
              <span class="kpi-label">${k.label}</span>
              <div class="kpi-icon" style="background:${k.color}18;color:${k.color}">${k.icon}</div>
            </div>
            <div class="kpi-value">${k.value}</div>
            <div class="kpi-footer"><span style="font-size:12px;color:${k.color}">${k.change}</span></div>
          </div>`).join('')}
      </div>
      <div class="card fade-up">
        <div class="card-header">
          <div><div class="card-title">Historial de pagos</div></div>
          <button class="btn-ghost">Exportar CSV</button>
        </div>
        <table class="tbl">
          <thead><tr><th>Anunciante</th><th>Canal</th><th>Importe</th><th>Fecha</th><th>Estado</th></tr></thead>
          <tbody>
            ${[
              { from:'TechBrand Co.', channel:'Tech Insights ES', amount:'€450', date:'27 mar 2026', status:'paid' },
              { from:'FitLife App',   channel:'Comunidad Fitness', amount:'€180', date:'26 mar 2026', status:'paid' },
              { from:'AI Labs Co.',   channel:'Marketing Diario ES', amount:'€320', date:'25 mar 2026', status:'paid' },
              { from:'Ecom Growth',   channel:'Tech Insights ES', amount:'€450', date:'22 mar 2026', status:'pending' },
              { from:'GamersUnited',  channel:'Gaming Hub Discord', amount:'€280', date:'20 mar 2026', status:'paid' },
            ].map(r => `
              <tr>
                <td style="font-weight:500">${r.from}</td>
                <td style="color:var(--muted)">${r.channel}</td>
                <td style="font-weight:700;color:var(--green)">${r.amount}</td>
                <td style="color:var(--muted2)">${r.date}</td>
                <td><span class="badge ${r.status==='paid'?'badge-ok':'badge-warn'}">${r.status==='paid'?'Cobrado':'Pendiente'}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`
  }

  /* ── Page router ──────────────────────────────────────────── */
  function getContent(role, page) {
    if (role === 'advertiser') {
      if (page === 'explore')   return renderAdvExplore()
      if (page === 'autobuy')   return renderAutoBuy()
      if (page === 'ads')       return renderAds()
      if (page === 'finances')  return renderFinances()
      return renderAdvOverview()
    }
    if (page === 'channels')  return renderCreatorChannels()
    if (page === 'requests')  return renderCreatorRequests()
    if (page === 'earnings')  return renderCreatorEarnings()
    return renderCreatorOverview()
  }

  function renderAutoBuy() {
    return `<div class="page-header fade-up"><h1>Auto-Buy</h1><p>Configura compras automáticas basadas en criterios</p></div>
      <div class="card fade-up" style="text-align:center;padding:48px">
        <div style="font-size:48px;margin-bottom:16px">⚡</div>
        <h2 style="font-family:var(--d);margin-bottom:8px">Compra inteligente automatizada</h2>
        <p style="color:var(--muted);max-width:400px;margin:0 auto 24px">Define presupuesto, plataforma y nicho. El sistema comprará automáticamente los mejores espacios disponibles.</p>
        <button class="btn-primary" style="font-size:14px;padding:12px 28px">Configurar Auto-Buy</button>
      </div>`
  }

  function renderAds() {
    return `<div class="page-header fade-up"><h1>Mis Anuncios</h1><p>Gestiona tus creatividades y materiales publicitarios</p></div>
      <div class="card fade-up">
        <div class="card-header"><div class="card-title">Anuncios activos</div><button class="btn-primary">+ Crear anuncio</button></div>
        ${ADV.campaigns.map(c => `
          <div class="feed-item">
            <div class="av" style="background:${PLAT_COLOR[c.platform]}22;color:${PLAT_COLOR[c.platform]};font-size:10px">${c.platform.slice(0,2).toUpperCase()}</div>
            <div class="feed-body">
              <div class="feed-title">${c.name}</div>
              <div class="feed-meta">${c.impressions} imp · ${c.clicks} clicks · CTR ${c.ctr}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <span class="badge ${c.status==='active'?'badge-ok':'badge-warn'}">${c.status==='active'?'Activo':'Pausado'}</span>
              <strong style="color:var(--a)">${c.spend}</strong>
            </div>
          </div>`).join('')}
      </div>`
  }

  function renderFinances() {
    return `<div class="page-header fade-up"><h1>Finanzas</h1><p>Control de gasto y presupuesto</p></div>
      <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
        ${[
          { label:'Gasto este mes', value:'€4.820', change:'↑ 12%', color:'#8b5cf6', icon:'💳' },
          { label:'Presupuesto disponible', value:'€3.180', change:'de €8.000', color:'#10b981', icon:'💰' },
          { label:'Total histórico', value:'€24.600', change:'desde 2024', color:'#3b82f6', icon:'📊' },
        ].map(k => `
          <div class="kpi-card fade-up">
            <div class="kpi-header">
              <span class="kpi-label">${k.label}</span>
              <div class="kpi-icon" style="background:${k.color}18;color:${k.color}">${k.icon}</div>
            </div>
            <div class="kpi-value">${k.value}</div>
            <div class="kpi-footer"><span style="font-size:12px;color:${k.color}">${k.change}</span></div>
          </div>`).join('')}
      </div>
      <div class="card fade-up">
        <div class="card-header">
          <div><div class="card-title">Gasto mensual</div></div>
          <button class="btn-primary">+ Recargar saldo</button>
        </div>
        ${barChartHTML(ADV.spendChart, ADV.months, '#8b5cf6')}
      </div>`
  }

  function renderCreatorChannels() {
    return `<div class="page-header fade-up"><h1>Mis Canales</h1><p>Gestiona y optimiza tus canales monetizados</p></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">
        ${CRE.channels.map((ch, i) => `
          <div class="card fade-up" style="animation-delay:${i*50}ms">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
              <div class="av" style="background:${PLAT_COLOR[ch.platform]}22;color:${PLAT_COLOR[ch.platform]};width:40px;height:40px;font-size:11px">${ch.name.slice(0,2).toUpperCase()}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ch.name}</div>
                <span class="plat" style="background:${PLAT_COLOR[ch.platform]}18;color:${PLAT_COLOR[ch.platform]};font-size:10px">${ch.platform}</span>
              </div>
              <span class="badge ${ch.status==='verified'?'badge-green':'badge-warn'}" style="flex-shrink:0">${ch.status==='verified'?'✓':'⏳'}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
              <div style="background:var(--bg);border-radius:8px;padding:10px;text-align:center">
                <div style="font-size:10px;color:var(--muted)">Audiencia</div>
                <div style="font-weight:700;color:var(--text)">${ch.members}</div>
              </div>
              <div style="background:var(--bg);border-radius:8px;padding:10px;text-align:center">
                <div style="font-size:10px;color:var(--muted)">Precio</div>
                <div style="font-weight:700;color:var(--green)">${ch.price}</div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:10px;color:var(--muted)">Ganancias</div>
                <div style="font-weight:700;color:var(--green)">${ch.earnings}</div>
              </div>
              <button class="btn-ghost" style="font-size:11px">Editar</button>
            </div>
          </div>`).join('')}
        <div class="card fade-up" style="border:2px dashed var(--border-med);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;min-height:180px;color:var(--muted)"
             onmouseover="this.style.borderColor='var(--green)';this.style.color='var(--green)'"
             onmouseout="this.style.borderColor='var(--border-med)';this.style.color='var(--muted)'">
          <div style="font-size:32px">+</div>
          <div style="font-size:13px;font-weight:500">Registrar nuevo canal</div>
        </div>
      </div>`
  }

  /* ── Sidebar HTML ─────────────────────────────────────────── */
  function buildSidebar() {
    const navItems = role === 'advertiser' ? ADV_NAV : CRE_NAV
    const accentColor = role === 'advertiser' ? 'var(--a)' : 'var(--green)'
    const activeClass = role === 'advertiser' ? 'active' : 'active green'

    const navHTML = navItems.map(item => `
      <div class="nav-item ${item.id === activePage ? activeClass : ''}"
           data-page="${item.id}" onclick="window.setPage('${item.id}')">
        ${item.svg}
        <span class="nav-label">${item.label}</span>
        ${item.badge ? `<span class="nav-badge" style="${role==='creator'?'background:var(--green)':''}">${item.badge}</span>` : ''}
      </div>`).join('')

    $('#sidebar').innerHTML = `
      <a class="sb-logo" href="#">
        Ad<span class="acc">flow</span>
        <span class="tag">Demo</span>
      </a>

      <div class="nav-section">
        ${navHTML}
      </div>

      <div class="sb-bottom">
        <div class="nav-item" style="cursor:default">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
          </svg>
          <span class="nav-label">rafael_demo</span>
        </div>
        <a href="/" class="nav-item" style="color:var(--err)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span class="nav-label">Salir del demo</span>
        </a>
      </div>`
  }

  /* ── Topbar HTML ──────────────────────────────────────────── */
  function buildTopbar() {
    const navItems = role === 'advertiser' ? ADV_NAV : CRE_NAV
    const pageLabel = navItems.find(n => n.id === activePage)?.label || 'Dashboard'
    const initials = role === 'advertiser' ? 'RA' : 'RC'
    $('#topbar').innerHTML = `
      <span class="topbar-title">${pageLabel}</span>
      <div class="topbar-right">
        <div class="tb-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Buscar...">
        </div>
        <button class="tb-btn">
          🔔
          <span style="position:absolute;top:6px;right:6px;width:7px;height:7px;background:var(--err);border-radius:50%;border:1.5px solid var(--surface)"></span>
        </button>
        <div class="tb-avatar">${initials}</div>
      </div>`
  }

  /* ── Render all ───────────────────────────────────────────── */
  function render() {
    buildSidebar()
    buildTopbar()
    const content = $('#content')
    content.innerHTML = getContent(role, activePage)
    // re-attach fade-up observer
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.style.opacity = '1' }),
      { threshold: 0.05 }
    )
    $$('.fade-up').forEach(el => { el.style.opacity = '0'; obs.observe(el) })
    setTimeout(() => $$('.fade-up').forEach(el => el.style.opacity = '1'), 600)
  }

  /* ── Public API ───────────────────────────────────────────── */
  window.setPage = function(page) {
    activePage = page
    render()
    history.replaceState({}, '', `?role=${role}&page=${page}`)
  }

  window.setRole = function(r) {
    role = r
    activePage = 'overview'
    // update pills
    $$('.role-pill').forEach(p => {
      p.classList.remove('active-adv', 'active-cre')
      if (p.dataset.role === r) p.classList.add(r === 'advertiser' ? 'active-adv' : 'active-cre')
    })
    render()
    history.replaceState({}, '', `?role=${role}&page=${activePage}`)
  }

  /* ── Init ─────────────────────────────────────────────────── */
  const pageParm = params.get('page')
  if (pageParm) activePage = pageParm
  render()
})()

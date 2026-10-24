// ============================================================
//  tienda.js — Interacciones de la tienda: carrito (localStorage) con
//  cajon lateral, menu movil, buscador, ficha de producto, checkout,
//  hero rotativo, pestañas de origen y revelado al hacer scroll.
// ============================================================
(function () {
  const CLAVE = 'artesano_carrito_v1';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const cop = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
  const dinero = (n, m) => (m === 'USD' ? 'US$ ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : cop(n));
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const envioGratis = Number(document.body.dataset.envioGratis) || 0;
  const enPaginaCarrito = /^\/(carrito|checkout)\/?$/.test(location.pathname);

  // ---------- Carrito ----------
  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch { return []; } }
  function guardar(items) { try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch {} pintar(); }
  const subtotal = (items) => items.reduce((s, i) => s + i.precioCop * i.cantidad, 0);
  const unidades = (items) => items.reduce((s, i) => s + i.cantidad, 0);

  function toast(texto) {
    const t = $('#toast'); if (!t) return;
    t.textContent = texto; t.classList.add('visible');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('visible'), 2400);
  }

  function agregar(item, cantidad = 1) {
    const items = leer();
    const ex = items.find((i) => i.sku === item.sku);
    if (ex) ex.cantidad = Math.min(50, ex.cantidad + cantidad);
    else items.push({ ...item, cantidad: Math.min(50, cantidad) });
    guardar(items);
    const c = $('#carrito-contador');
    if (c) { c.classList.add('salta'); setTimeout(() => c.classList.remove('salta'), 300); }
    if (enPaginaCarrito) toast(`${item.nombre} agregado al carrito`);
    else abrirCajon();
  }

  // Pinta contador, cajon y pagina del carrito a partir del carrito guardado.
  function pintar() {
    const items = leer();
    const n = unidades(items);
    const c = $('#carrito-contador'); if (c) c.textContent = n;
    const cn = $('#cajon-n'); if (cn) cn.textContent = n;
    pintarCajon(items);
    pintarPaginaCarrito(items);
  }

  function lineaCarrito(i, idx) {
    return `<div class="cajon-linea">
      ${i.imagen ? `<img src="${esc(i.imagen)}" alt="" />` : '<div class="sin-imagen mini"></div>'}
      <div><b class="nombre"><a href="/producto/${esc(i.slug)}">${esc(i.nombre)}</a></b><span class="variante">${esc(i.variante)}</span>
        <div class="cantidad"><button type="button" data-idx="${idx}" data-d="-1" aria-label="Menos">−</button><span>${i.cantidad}</span><button type="button" data-idx="${idx}" data-d="1" aria-label="Más">+</button></div></div>
      <div style="text-align:right"><b>${cop(i.precioCop * i.cantidad)}</b><button class="quitar" type="button" data-idx="${idx}">Quitar</button></div>
    </div>`;
  }

  function pintarCajon(items) {
    const lista = $('#cajon-lista'); if (!lista) return;
    lista.innerHTML = items.length ? items.map(lineaCarrito).join('') : '<p class="cajon-vacio">Tu carrito está vacío.<br /><a class="enlace-sub" href="/tienda">Descubre nuestros productos</a></p>';
    const sub = subtotal(items);
    $('#cajon-subtotal').textContent = cop(sub);
    const pagar = $('#cajon-pagar'); if (pagar) pagar.hidden = !items.length;
    const caja = $('#cajon-envio');
    if (caja) {
      caja.hidden = !envioGratis || !items.length;
      if (envioGratis) {
        const falta = envioGratis - sub;
        $('#cajon-envio-txt').textContent = falta > 0 ? `Te faltan ${cop(falta)} para el envío gratis` : '¡Tienes envío gratis en Colombia!';
        $('#cajon-barra').style.width = Math.min(100, Math.round((sub / envioGratis) * 100)) + '%';
      }
    }
  }

  function pintarPaginaCarrito(items) {
    const lista = $('#carrito-lista'); if (!lista) return;
    $('#carrito-vacio').hidden = items.length > 0;
    $('#carrito-int').hidden = items.length === 0;
    lista.innerHTML = items.map((i, idx) => `<div class="carrito-item">
      ${i.imagen ? `<img src="${esc(i.imagen)}" alt="" />` : '<div class="sin-imagen mini"></div>'}
      <div><b><a href="/producto/${esc(i.slug)}">${esc(i.nombre)}</a></b><br /><small>${esc(i.variante)} · ${cop(i.precioCop)} c/u</small><br />
        <div class="cantidad"><button type="button" data-idx="${idx}" data-d="-1" aria-label="Menos">−</button><input type="number" min="1" max="50" value="${i.cantidad}" data-idx="${idx}" aria-label="Cantidad" /><button type="button" data-idx="${idx}" data-d="1" aria-label="Más">+</button></div></div>
      <div style="text-align:right"><b>${cop(i.precioCop * i.cantidad)}</b><br /><button class="quitar" type="button" data-idx="${idx}">Quitar</button></div></div>`).join('');
    $('#carrito-subtotal').textContent = cop(subtotal(items));
  }

  // Cambios de cantidad / quitar (cajon y pagina del carrito comparten logica).
  function manejarLinea(e) {
    const items = leer();
    const q = e.target.closest('.quitar');
    if (q) { items.splice(Number(q.dataset.idx), 1); guardar(items); return true; }
    const b = e.target.closest('.cantidad button[data-idx]');
    if (b) {
      const i = items[Number(b.dataset.idx)];
      i.cantidad += Number(b.dataset.d);
      if (i.cantidad < 1) items.splice(Number(b.dataset.idx), 1); else i.cantidad = Math.min(50, i.cantidad);
      guardar(items); return true;
    }
    return false;
  }
  $('#cajon-lista')?.addEventListener('click', manejarLinea);
  $('#carrito-lista')?.addEventListener('click', manejarLinea);
  $('#carrito-lista')?.addEventListener('change', (e) => {
    const inp = e.target.closest('input[type=number]'); if (!inp) return;
    const items = leer(); items[Number(inp.dataset.idx)].cantidad = Math.max(1, Math.min(50, Number(inp.value) || 1)); guardar(items);
  });

  // Boton "Agregar" (tarjetas, ficha de producto y tarjeta del hero)
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.agregar');
    if (!b || b.disabled) return;
    e.preventDefault();
    const cantidad = b.id === 'agregar' ? Number($('#cantidad')?.value) || 1 : 1;
    agregar({ sku: b.dataset.sku, nombre: b.dataset.nombre, variante: b.dataset.variante, precioCop: Number(b.dataset.precio), imagen: b.dataset.imagen, slug: b.dataset.slug }, cantidad);
  });

  // ---------- Superposiciones: cajon, menu movil, buscador ----------
  let ultimoFoco = null;
  function abrir(el, enfocar) {
    ultimoFoco = document.activeElement;
    el.classList.add('abierto'); el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('bloqueado');
    setTimeout(() => (typeof enfocar === 'string' ? $(enfocar, el) : enfocar)?.focus(), 60);
  }
  function cerrar(el) {
    if (!el || !el.classList.contains('abierto')) return;
    el.classList.remove('abierto'); el.setAttribute('aria-hidden', 'true');
    if (!$('.cajon.abierto, .menu-movil.abierto, .buscador.abierto')) document.body.classList.remove('bloqueado');
    ultimoFoco?.focus?.();
  }
  const cajon = $('#cajon'), menu = $('#menu-movil'), buscador = $('#buscador');
  function abrirCajon() { if (cajon) abrir(cajon, '.cajon-cab .btn-icono'); }

  $$('[data-abrir-carrito]').forEach((a) => a.addEventListener('click', (e) => { if (enPaginaCarrito) return; e.preventDefault(); abrirCajon(); }));
  $$('[data-cerrar-carrito]').forEach((b) => b.addEventListener('click', () => cerrar(cajon)));
  $$('[data-abrir-menu]').forEach((b) => b.addEventListener('click', () => { abrir(menu, '[data-cerrar-menu]'); b.setAttribute('aria-expanded', 'true'); }));
  $$('[data-cerrar-menu]').forEach((b) => b.addEventListener('click', () => { cerrar(menu); $('[data-abrir-menu]')?.setAttribute('aria-expanded', 'false'); }));
  $$('[data-abrir-buscador]').forEach((b) => b.addEventListener('click', () => abrir(buscador, 'input')));
  buscador?.addEventListener('click', (e) => { if (e.target === buscador) cerrar(buscador); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    [cajon, menu, buscador].forEach(cerrar);
  });
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) cerrar(menu); });

  // ---------- Ficha de producto ----------
  const variantes = $('#variantes');
  if (variantes) {
    variantes.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      $$('button', variantes).forEach((x) => x.classList.toggle('activo', x === b));
      const ag = $('#agregar');
      if (ag) { ag.dataset.sku = b.dataset.sku; ag.dataset.variante = b.dataset.nombre; ag.dataset.precio = b.dataset.precio; }
      $('#precio').textContent = cop(b.dataset.precio);
      const disp = $('#disponibilidad'); const st = Number(b.dataset.stock);
      if (disp) disp.textContent = st <= 0 ? 'Agotado' : st <= 5 ? `Últimas ${st} unidades` : 'Disponible';
    });
  }
  $$('.cantidad button[data-d]:not([data-idx])').forEach((b) => b.addEventListener('click', () => {
    const inp = b.parentElement.querySelector('input'); if (!inp) return;
    inp.value = Math.max(1, Math.min(50, (Number(inp.value) || 1) + Number(b.dataset.d)));
  }));
  $$('.galeria-mini button').forEach((b) => b.addEventListener('click', () => {
    $$('.galeria-mini button').forEach((x) => x.classList.toggle('activo', x === b));
    const g = $('#galeria-img'); if (g) g.src = b.dataset.grande;
  }));

  // ---------- Selector de orden del catalogo ----------
  $$('[data-autoenviar]').forEach((s) => s.addEventListener('change', () => s.form.submit()));

  // ---------- Checkout ----------
  const form = $('#checkout-form');
  if (form) {
    const items = leer();
    if (!items.length) { window.location.href = '/carrito'; return; }
    const pais = $('#pais'), ciudad = $('#ciudad'), btn = $('#pagar');
    async function totales() {
      const r = await fetch('/api/checkout/totales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items.map((i) => ({ sku: i.sku, cantidad: i.cantidad })), pais: pais.value, ciudad: ciudad.value }) }).then((x) => x.json()).catch(() => null);
      if (!r || !r.ok) return;
      const m = r.moneda;
      $('#resumen-items').innerHTML = r.lineas.map((l) => `<div class="resumen-item"><span>${esc(l.nombre)} <small>· ${esc(l.variante)} × ${l.cantidad}</small></span><b>${dinero(l.total, m)}</b></div>`).join('');
      $('#r-subtotal').textContent = dinero(r.totales.subtotal, m);
      $('#r-iva-label').textContent = r.regimen === 'exportacion' ? 'IVA (exportación 0 %)' : 'IVA';
      $('#r-iva').textContent = dinero(r.totales.iva, m);
      $('#r-envio').textContent = r.envio.gratis ? 'Gratis' : dinero(r.totales.envio + r.totales.envioIva, m);
      $('#r-envio-detalle').textContent = `· ${r.envio.transportadora} · ${r.envio.dias}`;
      $('#r-total').textContent = dinero(r.totales.total, m);
      $('#r-aviso').textContent = (r.envio.aviso || '') + (m === 'USD' ? ' Pagarás en dólares (USD).' : ' Precios con IVA incluido.');
      const sinStock = r.lineas.filter((l) => l.stock < l.cantidad);
      $('#checkout-error').textContent = sinStock.length ? `Sin stock suficiente: ${sinStock.map((l) => l.nombre).join(', ')}` : '';
    }
    function textoBoton() {
      const intl = pais.value !== 'CO';
      $('#aviso-intl').hidden = !intl;
      const met = $('#metodos'); if (met) met.hidden = intl;
      if (!btn.disabled) btn.textContent = intl ? 'Enviar pedido y continuar por WhatsApp' : btn.dataset.texto;
    }
    pais.addEventListener('change', () => { totales(); textoBoton(); });
    ciudad.addEventListener('change', totales);
    totales();
    $$('input[name=cuando]').forEach((r) => r.addEventListener('change', () => { $('#fecha-caja').hidden = form.cuando.value !== 'programar'; }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('#checkout-error'); err.textContent = '';
      for (const campo of ['nombre', 'email', 'telefono', 'ciudad', 'linea1']) {
        if (!String(form[campo].value).trim()) { err.textContent = 'Completa tus datos y la dirección de entrega.'; form[campo].focus(); return; }
      }
      if (!form.acepto.checked) { err.textContent = 'Debes aceptar las políticas para continuar.'; return; }
      btn.disabled = true; btn.textContent = 'Creando tu pedido…';
      const fd = new FormData(form);
      const cuerpo = {
        items: items.map((i) => ({ sku: i.sku, cantidad: i.cantidad })),
        cliente: { nombre: fd.get('nombre'), email: fd.get('email'), telefono: fd.get('telefono') },
        direccion: { pais: fd.get('pais'), ciudad: fd.get('ciudad'), departamento: fd.get('departamento'), linea1: fd.get('linea1'), linea2: fd.get('linea2'), codigoPostal: fd.get('codigoPostal') },
        programadoPara: fd.get('cuando') === 'programar' ? fd.get('programadoPara') : null,
        nota: fd.get('nota'),
      };
      try {
        const r = await fetch('/api/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) }).then((x) => x.json());
        if (!r.ok) { err.textContent = r.error || 'No se pudo crear el pedido.'; btn.disabled = false; textoBoton(); return; }
        guardar([]);
        window.location.href = r.urlPago || r.urlPedido;
      } catch (_) {
        err.textContent = 'Error de red. Intenta de nuevo.'; btn.disabled = false; textoBoton();
      }
    });
  }

  // ---------- Hero: fotos rotativas + tarjeta de producto que las sigue ----------
  const rotativo = $('[data-rotativo]');
  if (rotativo) {
    const figuras = $$('figure', rotativo);
    const tarjeta = $('#hero-card');
    const mostrar = (i) => {
      figuras.forEach((f, k) => f.classList.toggle('activo', k === i));
      const f = figuras[i];
      if (!tarjeta) return;
      $('#hero-card-nombre').textContent = f.dataset.nombre;
      $('#hero-card-precio').textContent = f.dataset.precioTxt;
      $('#hero-card-img').src = f.querySelector('img').src;
      const b = $('#hero-card-agregar');
      ['sku', 'nombre', 'variante', 'precio', 'imagen', 'slug'].forEach((k) => { b.dataset[k] = f.dataset[k]; });
    };
    if (figuras.length > 1 && !sinMovimiento) {
      let i = 0, pausa = false;
      const visual = rotativo.closest('.hero-visual');
      visual.addEventListener('mouseenter', () => { pausa = true; });
      visual.addEventListener('mouseleave', () => { pausa = false; });
      setInterval(() => { if (pausa || document.hidden) return; i = (i + 1) % figuras.length; mostrar(i); }, 5000);
    }
  }

  // ---------- Origen: pestañas de ingredientes ----------
  const pestanas = $$('.origen-tabs [role=tab]');
  if (pestanas.length) {
    const activar = (tab, foco) => {
      pestanas.forEach((t) => {
        const sel = t === tab;
        t.setAttribute('aria-selected', String(sel)); t.tabIndex = sel ? 0 : -1;
        $('#panel-' + t.dataset.tab).classList.toggle('activo', sel);
      });
      if (foco) tab.focus();
    };
    pestanas.forEach((t, i) => {
      t.tabIndex = i === 0 ? 0 : -1;
      t.addEventListener('click', () => activar(t));
      t.addEventListener('keydown', (e) => {
        const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        activar(pestanas[(i + d + pestanas.length) % pestanas.length], true);
      });
    });
  }

  // ---------- Revelado al hacer scroll ----------
  const revelables = $$('.revelar');
  if (revelables.length) {
    if ('IntersectionObserver' in window && !sinMovimiento) {
      const io = new IntersectionObserver((entradas) => entradas.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      revelables.forEach((el) => io.observe(el));
    } else revelables.forEach((el) => el.classList.add('visible'));
  }

  pintar();
})();

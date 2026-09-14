// ============================================================
//  tienda.js — Carrito (localStorage), ficha de producto, checkout.
// ============================================================
(function () {
  const CLAVE = 'artesano_carrito_v1';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const cop = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
  const dinero = (n, m) => (m === 'USD' ? 'US$ ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : cop(n));
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Carrito ----------
  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch { return []; } }
  function guardar(items) { try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch {} pintarContador(); }
  function agregar(item, cantidad = 1) {
    const items = leer();
    const ex = items.find((i) => i.sku === item.sku);
    if (ex) ex.cantidad = Math.min(50, ex.cantidad + cantidad);
    else items.push({ ...item, cantidad: Math.min(50, cantidad) });
    guardar(items);
    toast(`${item.nombre} agregado al carrito`);
  }
  function pintarContador() {
    const n = leer().reduce((s, i) => s + i.cantidad, 0);
    const c = $('#carrito-contador'); if (c) c.textContent = n;
  }
  function toast(texto) {
    const t = $('#toast'); if (!t) return;
    t.textContent = texto; t.classList.add('visible');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('visible'), 2200);
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.agregar');
    if (!b) return;
    e.preventDefault();
    const cantidad = Number($('#cantidad')?.value) || 1;
    agregar({ sku: b.dataset.sku, nombre: b.dataset.nombre, variante: b.dataset.variante, precioCop: Number(b.dataset.precio), imagen: b.dataset.imagen, slug: b.dataset.slug }, b.id === 'agregar' ? cantidad : 1);
  });

  // ---------- Menu movil ----------
  $('#hamburguesa')?.addEventListener('click', () => $('#nav').classList.toggle('abierto'));

  // ---------- Ficha de producto ----------
  const variantes = $('#variantes');
  if (variantes) {
    variantes.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      $$('button', variantes).forEach((x) => x.classList.toggle('activo', x === b));
      const ag = $('#agregar');
      if (ag) { ag.dataset.sku = b.dataset.sku; ag.dataset.variante = b.dataset.nombre; ag.dataset.precio = b.dataset.precio; }
      $('#precio').textContent = cop(b.dataset.precio);
    });
  }
  $$('.cantidad button').forEach((b) => b.addEventListener('click', () => {
    const inp = b.parentElement.querySelector('input');
    inp.value = Math.max(1, Math.min(50, (Number(inp.value) || 1) + Number(b.dataset.d)));
    inp.dispatchEvent(new Event('change'));
  }));
  $$('.galeria-mini img').forEach((im) => im.addEventListener('click', () => {
    $$('.galeria-mini img').forEach((x) => x.classList.toggle('activo', x === im));
    const g = $('#galeria-principal img'); if (g) g.src = im.dataset.grande;
  }));

  // ---------- Pagina del carrito ----------
  const lista = $('#carrito-lista');
  if (lista) {
    const pintar = () => {
      const items = leer();
      $('#carrito-vacio').hidden = items.length > 0;
      $('#carrito-int').hidden = items.length === 0;
      lista.innerHTML = items.map((i, idx) => `<div class="carrito-item">
        ${i.imagen ? `<img src="${esc(i.imagen)}" alt="" />` : '<div class="sin-imagen mini"></div>'}
        <div><b><a href="/producto/${esc(i.slug)}">${esc(i.nombre)}</a></b><br /><small>${esc(i.variante)} · ${cop(i.precioCop)} c/u</small><br />
          <div class="cantidad"><button type="button" data-idx="${idx}" data-d="-1">−</button><input type="number" min="1" max="50" value="${i.cantidad}" data-idx="${idx}" /><button type="button" data-idx="${idx}" data-d="1">+</button></div></div>
        <div style="text-align:right"><b>${cop(i.precioCop * i.cantidad)}</b><br /><button class="quitar" data-idx="${idx}">Quitar</button></div></div>`).join('');
      $('#carrito-subtotal').textContent = cop(items.reduce((s, i) => s + i.precioCop * i.cantidad, 0));
    };
    lista.addEventListener('click', (e) => {
      const items = leer();
      const q = e.target.closest('.quitar');
      if (q) { items.splice(Number(q.dataset.idx), 1); guardar(items); pintar(); return; }
      const b = e.target.closest('.cantidad button');
      if (b) { const i = items[Number(b.dataset.idx)]; i.cantidad = Math.max(1, Math.min(50, i.cantidad + Number(b.dataset.d))); guardar(items); pintar(); }
    });
    lista.addEventListener('change', (e) => {
      const inp = e.target.closest('input[type=number]'); if (!inp) return;
      const items = leer(); items[Number(inp.dataset.idx)].cantidad = Math.max(1, Math.min(50, Number(inp.value) || 1)); guardar(items); pintar();
    });
    pintar();
  }

  // ---------- Checkout ----------
  const form = $('#checkout-form');
  if (form) {
    const items = leer();
    if (!items.length) { window.location.href = '/carrito'; return; }
    const pais = $('#pais'), ciudad = $('#ciudad');
    let ultimo = null;
    async function totales() {
      const r = await fetch('/api/checkout/totales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items.map((i) => ({ sku: i.sku, cantidad: i.cantidad })), pais: pais.value, ciudad: ciudad.value }) }).then((x) => x.json()).catch(() => null);
      if (!r || !r.ok) return;
      ultimo = r;
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
    pais.addEventListener('change', totales);
    ciudad.addEventListener('change', totales);
    totales();
    $$('input[name=cuando]').forEach((r) => r.addEventListener('change', () => { $('#fecha-caja').hidden = form.cuando.value !== 'programar'; }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('#checkout-error'); err.textContent = '';
      if (!form.acepto.checked) { err.textContent = 'Debes aceptar las políticas para continuar.'; return; }
      const btn = $('#pagar'); btn.disabled = true; btn.textContent = 'Creando tu pedido…';
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
        if (!r.ok) { err.textContent = r.error || 'No se pudo crear el pedido.'; btn.disabled = false; btn.textContent = 'Pagar de forma segura'; return; }
        guardar([]);
        window.location.href = r.urlPago || r.urlPedido;
      } catch (_) {
        err.textContent = 'Error de red. Intenta de nuevo.'; btn.disabled = false; btn.textContent = 'Pagar de forma segura';
      }
    });
  }

  pintarContador();
})();

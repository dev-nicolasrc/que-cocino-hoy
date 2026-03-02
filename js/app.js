// ==========================================
//  Qué Cocino Hoy — app.js
// ==========================================

// --- ESTADO ---
let recetas = [];
let ingredientesSeleccionados = new Set();
let filtroActivo = 'todos';
let recetaActual = null;
let scrollYAntesDModal = 0; // para restaurar posición al cerrar modal en iOS

// --- REFERENCIAS DOM ---
const inputIng        = document.getElementById('input-ingrediente');
const listaIng        = document.getElementById('lista-ingredientes');
const seleccionadosEl = document.getElementById('seleccionados');
const nubeTagsEl      = document.getElementById('nube-tags');
const gridEl          = document.getElementById('grid-recetas');
const spinnerGrid     = document.getElementById('spinner-grid');
const msgSinResultado = document.getElementById('msg-sin-resultado');
const msgSinFiltro    = document.getElementById('msg-sin-filtro');
const modalOverlay    = document.getElementById('modal-overlay');
const modalContenido  = document.getElementById('modal-contenido');

// ==========================================
//  INIT
// ==========================================
async function init() {
  try {
    const res = await fetch('data/recetas.json');
    recetas = await res.json();
    poblarDatalist();
    renderNubeTags();
    renderGrid(recetas);
    attachEventListeners();
  } catch (e) {
    console.error('Error cargando recetas:', e);
    spinnerGrid.innerHTML =
      '<p class="text-gray-400 text-sm">No se pudieron cargar las recetas.</p>';
  }
}

// ==========================================
//  DATOS / UTILIDADES
// ==========================================

function normalizar(str) {
  return str.toLowerCase().trim();
}

// Escapa caracteres HTML para prevenir XSS al insertar en innerHTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function obtenerIngredientesUnicos() {
  const set = new Set();
  recetas.forEach(r => r.ingredientes.forEach(i => set.add(normalizar(i.nombre))));
  return [...set].sort();
}

function obtenerPopulares() {
  const conteo = {};
  recetas.forEach(r => {
    r.ingredientes.forEach(i => {
      const n = normalizar(i.nombre);
      conteo[n] = (conteo[n] || 0) + 1;
    });
  });
  return Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([nombre]) => nombre);
}

function poblarDatalist() {
  listaIng.innerHTML = obtenerIngredientesUnicos()
    .map(ing => `<option value="${ing}">`)
    .join('');
}

// ==========================================
//  BUSCADOR — NEVERA
// ==========================================

function agregarIngrediente() {
  const val = normalizar(inputIng.value);
  if (!val) return;
  ingredientesSeleccionados.add(val);
  inputIng.value = '';
  renderSeleccionados();
  renderNubeTags();
  ocultarMsgSinResultado();
}

function quitarIngrediente(ing) {
  ingredientesSeleccionados.delete(ing);
  renderSeleccionados();
  renderNubeTags();
}

function toggleTag(ing) {
  if (ingredientesSeleccionados.has(ing)) {
    ingredientesSeleccionados.delete(ing);
  } else {
    ingredientesSeleccionados.add(ing);
  }
  renderSeleccionados();
  renderNubeTags();
  ocultarMsgSinResultado();
}

function renderSeleccionados() {
  if (ingredientesSeleccionados.size === 0) {
    seleccionadosEl.innerHTML = '';
    return;
  }
  seleccionadosEl.innerHTML = [...ingredientesSeleccionados]
    .map(ing => `
      <span class="tag-seleccionado">
        ${escapeHtml(ing)}
        <button class="btn-quitar-ing" data-ing="${escapeHtml(ing)}" aria-label="Quitar ${escapeHtml(ing)}">×</button>
      </span>
    `)
    .join('');
}

function renderNubeTags() {
  nubeTagsEl.innerHTML = obtenerPopulares()
    .map(ing => `
      <button
        class="tag-nube${ingredientesSeleccionados.has(ing) ? ' activo' : ''}"
        data-ing="${escapeHtml(ing)}">
        ${escapeHtml(ing)}
      </button>
    `)
    .join('');
}

function ocultarMsgSinResultado() {
  msgSinResultado.classList.add('hidden');
}

function buscarReceta() {
  if (ingredientesSeleccionados.size === 0) {
    msgSinResultado.textContent = 'Selecciona al menos un ingrediente primero.';
    msgSinResultado.classList.remove('hidden');
    return;
  }

  const selArr = [...ingredientesSeleccionados];
  let mejorScore = -1;
  let mejorReceta = null;

  recetas.forEach(receta => {
    const nombres = receta.ingredientes.map(i => normalizar(i.nombre));
    const coincidencias = selArr.filter(s =>
      nombres.some(n => n.includes(s) || s.includes(n))
    ).length;
    const score = coincidencias / receta.ingredientes.length;
    if (score > mejorScore) {
      mejorScore = score;
      mejorReceta = receta;
    }
  });

  if (mejorScore > 0) {
    ocultarMsgSinResultado();
    abrirModal(mejorReceta);
  } else {
    msgSinResultado.textContent =
      'No encontramos recetas con esos ingredientes. ¡Prueba con otros!';
    msgSinResultado.classList.remove('hidden');
  }
}

// ==========================================
//  SORPRÉNDEME
// ==========================================

function sorprender() {
  if (recetas.length === 0) return;
  const receta = recetas[Math.floor(Math.random() * recetas.length)];
  abrirModal(receta);
}

// ==========================================
//  FILTROS DE DIETA
// ==========================================

function filtrarPorDieta(filtro) {
  filtroActivo = filtro;
  document.querySelectorAll('.btn-filtro').forEach(btn => {
    btn.classList.toggle('activo', btn.dataset.filtro === filtro);
  });
  const resultado =
    filtro === 'todos'
      ? recetas
      : recetas.filter(r => r.tags_dieta.includes(filtro));
  renderGrid(resultado);
}

// ==========================================
//  GRID DE TARJETAS
// ==========================================

function renderGrid(lista) {
  spinnerGrid.classList.add('hidden');
  msgSinFiltro.classList.add('hidden');

  if (lista.length === 0) {
    gridEl.innerHTML = '';
    msgSinFiltro.classList.remove('hidden');
    return;
  }
  gridEl.innerHTML = lista.map(crearTarjeta).join('');
}

function crearTarjeta(r) {
  const tiempoLabel = r.tiempo <= 20 ? `⚡ ${r.tiempo} min` : `⏱ ${r.tiempo} min`;
  return `
    <article
      class="tarjeta-receta"
      onclick="abrirModalPorId(${r.id})"
      role="button"
      tabindex="0"
      aria-label="Ver receta: ${r.nombre}"
      onkeydown="if(event.key==='Enter') abrirModalPorId(${r.id})">
      <img
        src="${r.imagen}"
        alt="${r.nombre}"
        loading="lazy"
        onerror="this.src='https://placehold.co/400x300/FF6B35/white?text=🍽️'">
      <div class="tarjeta-info">
        <p class="tarjeta-nombre">${r.nombre}</p>
        <p class="tarjeta-meta">${tiempoLabel} &nbsp;·&nbsp; ${r.dificultad} &nbsp;·&nbsp; 👥 ${r.porciones}</p>
      </div>
    </article>
  `;
}

function abrirModalPorId(id) {
  const receta = recetas.find(r => r.id === id);
  abrirModal(receta);
}

// ==========================================
//  MODAL
// ==========================================

const COLORES_TAG = {
  saludable:    'bg-green-100 text-green-700',
  vegano:       'bg-lime-100 text-lime-700',
  'sin-gluten': 'bg-yellow-100 text-yellow-700',
  rapido:       'bg-blue-100 text-blue-700',
  economico:    'bg-purple-100 text-purple-700',
  normal:       'bg-gray-100 text-gray-500',
};

function abrirModal(receta) {
  if (!receta) return;
  recetaActual = receta;

  const tagsHTML = receta.tags_dieta
    .map(tag => {
      const cls = COLORES_TAG[tag] || 'bg-gray-100 text-gray-500';
      return `<span class="text-xs font-semibold px-2 py-0.5 rounded-full ${cls}">${tag}</span>`;
    })
    .join('');

  const ingredientesHTML = receta.ingredientes
    .map(i => {
      const texto = `${i.cantidad} <strong>${i.nombre}</strong>`;
      const contenido = i.afiliado
        ? `<a href="${i.afiliado}" target="_blank" rel="noopener sponsored"
              class="underline text-azul">${texto}</a>`
        : texto;
      return `
        <li class="flex items-start gap-2">
          <span class="text-naranja mt-0.5 shrink-0">•</span>
          <span class="text-sm text-gray-700">${contenido}</span>
        </li>`;
    })
    .join('');

  const pasosHTML = receta.pasos
    .map((paso, i) => `
      <li class="flex gap-3 items-start">
        <span class="font-titulo font-black text-naranja text-lg leading-none mt-0.5 shrink-0">${i + 1}.</span>
        <span class="text-sm text-gray-700 leading-relaxed">${paso}</span>
      </li>`)
    .join('');

  const sustitucionesHTML =
    receta.sustituciones && receta.sustituciones.length > 0
      ? `<div class="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
          <h4 class="font-semibold text-amber-700 mb-2 text-sm">💡 Sustituciones inteligentes</h4>
          <ul class="space-y-1">
            ${receta.sustituciones
              .map(s => `
                <li class="text-sm text-amber-700">
                  <span class="font-medium">Sin ${s.original}:</span> ${s.alternativa}
                </li>`)
              .join('')}
          </ul>
        </div>`
      : '';

  modalContenido.innerHTML = `
    <img
      class="modal-img"
      src="${receta.imagen}"
      alt="${receta.nombre}"
      loading="lazy"
      onerror="this.src='https://placehold.co/600x300/FF6B35/white?text=🍽️'">

    <div class="p-5 pb-6">
      <div class="flex flex-wrap gap-1 mb-2">${tagsHTML}</div>

      <h3 class="font-titulo font-black text-xl text-gray-800 mb-1">${receta.nombre}</h3>
      <div class="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-400 mb-5">
        <span>⏱ ${receta.tiempo} min</span>
        <span>·</span>
        <span>${receta.dificultad}</span>
        <span>·</span>
        <span>👥 ${receta.porciones} porciones</span>
      </div>

      <h4 class="font-titulo font-bold text-azul mb-2">Ingredientes</h4>
      <ul class="space-y-1 mb-5">${ingredientesHTML}</ul>

      <h4 class="font-titulo font-bold text-azul mb-3">Preparación</h4>
      <ol class="space-y-3 mb-5">${pasosHTML}</ol>

      ${sustitucionesHTML}

      <div class="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onclick="compartirWhatsApp()"
          class="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
          📲 WhatsApp
        </button>
        <button
          id="btn-copiar"
          onclick="copiarPortapapeles(this)"
          class="flex-1 bg-azul hover:bg-blue-900 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
          📋 Copiar
        </button>
      </div>
    </div>
  `;

  modalOverlay.classList.remove('hidden');
  // iOS fix: guardar posición antes de fijar el body
  scrollYAntesDModal = window.scrollY;
  document.body.style.top = `-${scrollYAntesDModal}px`;
  document.body.classList.add('modal-abierto');
}

function cerrarModal() {
  modalOverlay.classList.add('hidden');
  document.body.classList.remove('modal-abierto');
  // iOS fix: restaurar posición de scroll
  document.body.style.top = '';
  window.scrollTo(0, scrollYAntesDModal);
  recetaActual = null;
}

// ==========================================
//  COMPARTIR
// ==========================================

function compartirWhatsApp() {
  if (!recetaActual) return;
  const r = recetaActual;
  const ings = r.ingredientes.map(i => `  • ${i.cantidad} ${i.nombre}`).join('\n');
  const pasos = r.pasos.map((p, i) => `  ${i + 1}. ${p}`).join('\n');
  const texto =
    `🍽️ *${r.nombre}*\n` +
    `⏱ ${r.tiempo} min  |  ${r.dificultad}  |  👥 ${r.porciones} porciones\n\n` +
    `*Ingredientes:*\n${ings}\n\n` +
    `*Preparación:*\n${pasos}\n\n` +
    `_Receta de Qué Cocino Hoy 🍳_`;
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
}

function copiarPortapapeles(btn) {
  if (!recetaActual) return;
  const r = recetaActual;
  const ings = r.ingredientes.map(i => `• ${i.cantidad} ${i.nombre}`).join('\n');
  const pasos = r.pasos.map((p, i) => `${i + 1}. ${p}`).join('\n');
  const texto =
    `${r.nombre}\n` +
    `⏱ ${r.tiempo} min | ${r.dificultad} | ${r.porciones} porciones\n\n` +
    `Ingredientes:\n${ings}\n\n` +
    `Preparación:\n${pasos}`;

  const confirmar = () => {
    const original = btn.innerHTML;
    btn.innerHTML = '✅ ¡Copiado!';
    setTimeout(() => { btn.innerHTML = original; }, 2000);
  };

  // Clipboard API (requiere HTTPS). Fallback para HTTP/desarrollo local.
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto).then(confirmar);
  } else {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    confirmar();
  }
}

// ==========================================
//  MENÚ MOBILE
// ==========================================

function cerrarMenuMobile() {
  const menu = document.getElementById('menu-mobile');
  const btn = document.getElementById('btn-menu-mobile');
  menu.classList.add('hidden');
  btn.setAttribute('aria-expanded', 'false');
}

// ==========================================
//  EVENT LISTENERS
// ==========================================

function attachEventListeners() {
  // Hero
  document.getElementById('btn-sorprender').addEventListener('click', sorprender);

  // Buscador
  document.getElementById('btn-cocinar').addEventListener('click', buscarReceta);
  document.getElementById('btn-agregar-ing').addEventListener('click', agregarIngrediente);
  inputIng.addEventListener('keydown', e => {
    if (e.key === 'Enter') agregarIngrediente();
  });

  // Delegación: quitar ingrediente seleccionado
  seleccionadosEl.addEventListener('click', e => {
    const btn = e.target.closest('.btn-quitar-ing');
    if (btn) quitarIngrediente(btn.dataset.ing);
  });

  // Delegación: toggle tag en nube de populares
  nubeTagsEl.addEventListener('click', e => {
    const btn = e.target.closest('.tag-nube');
    if (btn) toggleTag(btn.dataset.ing);
  });

  // Filtros de dieta
  document.querySelectorAll('.btn-filtro').forEach(btn => {
    btn.addEventListener('click', () => filtrarPorDieta(btn.dataset.filtro));
  });

  // Modal: cerrar
  document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModal);
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) cerrarModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarModal();
  });

  // Hamburger mobile
  document.getElementById('btn-menu-mobile').addEventListener('click', function () {
    const menu = document.getElementById('menu-mobile');
    const abierto = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    this.setAttribute('aria-expanded', String(!abierto));
  });
}

// ==========================================
//  START
// ==========================================
init();

#!/usr/bin/env node
// ==========================================
//  CocinaAhora — Build Script
//  Genera dist/ completo desde recetas.json
// ==========================================

'use strict';

const fs   = require('fs');
const path = require('path');

const BASE_URL = 'https://cocinarahora.com';
const DIST     = 'dist';

// ==========================================
//  UTILIDADES
// ==========================================

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

// Elimina el bloque Tailwind CDN del HTML fuente y lo reemplaza
// por un link al CSS construido.
function removeTailwindCDN(html) {
  return html.replace(
    /[ \t]*<!-- Tailwind CSS -->[ \t]*\n\s*<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*\n\s*<script>[\s\S]*?tailwind\.config[\s\S]*?<\/script>/,
    '\n  <link rel="stylesheet" href="/css/output.css" />'
  );
}

// ==========================================
//  SCHEMA JSON-LD
// ==========================================

const DIET_MAP = {
  'vegano':    'https://schema.org/VeganDiet',
  'sin-gluten':'https://schema.org/GlutenFreeDiet',
  'saludable': 'https://schema.org/LowFatDiet',
};

function recipeSchema(r) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.nombre,
    image: [r.imagen],
    author: {
      '@type': 'Organization',
      name: r.autor.nombre,
      url: `${BASE_URL}${r.autor.url}`,
    },
    datePublished: r.fecha_publicacion,
    dateModified:  r.fecha_actualizacion,
    description:   r.descripcion,
    totalTime:     r.tiempo_iso8601,
    recipeYield:   `${r.porciones} porciones`,
    recipeCategory: r.categoria,
    recipeCuisine: 'Colombiana',
    recipeIngredient: r.ingredientes.map(i => `${i.cantidad} de ${i.nombre}`),
    recipeInstructions: r.pasos.map((texto, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      text: texto,
    })),
  };

  const diets = (r.tags_dieta || []).map(t => DIET_MAP[t]).filter(Boolean);
  if (diets.length === 1) schema.suitableForDiet = diets[0];
  if (diets.length  > 1) schema.suitableForDiet = diets;

  if (r.nutricion && r.nutricion.calorias) {
    schema.nutrition = {
      '@type': 'NutritionInformation',
      calories:          `${r.nutricion.calorias} kcal`,
      proteinContent:    `${r.nutricion.proteinas_g} g`,
      carbohydrateContent:`${r.nutricion.carbohidratos_g} g`,
      fatContent:        `${r.nutricion.grasas_g} g`,
      fiberContent:      `${r.nutricion.fibra_g} g`,
    };
  }

  return schema;
}

function breadcrumbSchema(nombre, slug) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio',  item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: nombre, item: `${BASE_URL}/receta/${slug}/` },
    ],
  };
}

function toScriptTag(obj) {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}

// ==========================================
//  RENDER TEMPLATE
// ==========================================

const DIET_LABELS = {
  vegano:      '🌱 Vegano',
  'sin-gluten':'🌾 Sin Gluten',
  saludable:   '🥗 Saludable',
  rapido:      '⚡ Rápido',
  economico:   '💰 Económico',
};

function renderRecipePage(template, r) {
  // Badges de dieta
  const dietBadges = (r.tags_dieta || [])
    .filter(t => t !== 'normal' && DIET_LABELS[t])
    .map(t =>
      `<span class="inline-block bg-crema text-azul text-xs font-semibold px-3 py-1 rounded-full">${DIET_LABELS[t]}</span>`
    )
    .join('\n      ');

  // Lista de ingredientes
  const ingredientesHTML = r.ingredientes
    .map(i =>
      `<li class="flex justify-between px-4 py-2 text-sm">` +
      `<span class="text-gray-700">${i.nombre}</span>` +
      `<span class="text-gray-500 font-medium">${i.cantidad}</span>` +
      `</li>`
    )
    .join('\n        ');

  // Lista de pasos
  const pasosHTML = r.pasos
    .map((paso, idx) =>
      `<li class="flex gap-4">` +
      `<span class="shrink-0 w-8 h-8 bg-naranja text-white rounded-full flex items-center justify-center font-titulo font-black text-sm">${idx + 1}</span>` +
      `<p class="text-gray-700 leading-relaxed pt-1">${paso}</p>` +
      `</li>`
    )
    .join('\n        ');

  // Información nutricional (bloque completo)
  let nutricionHTML = '';
  if (r.nutricion && r.nutricion.calorias) {
    const n = r.nutricion;
    nutricionHTML = `
    <section class="mb-8">
      <h2 class="font-titulo font-black text-xl text-azul mb-4">📊 Información nutricional</h2>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="bg-white rounded-xl border border-crema p-3 text-center">
          <p class="font-bold text-naranja text-lg">${n.calorias}</p>
          <p class="text-xs text-gray-400">kcal</p>
        </div>
        <div class="bg-white rounded-xl border border-crema p-3 text-center">
          <p class="font-bold text-azul text-lg">${n.proteinas_g}g</p>
          <p class="text-xs text-gray-400">Proteínas</p>
        </div>
        <div class="bg-white rounded-xl border border-crema p-3 text-center">
          <p class="font-bold text-azul text-lg">${n.carbohidratos_g}g</p>
          <p class="text-xs text-gray-400">Carbohidratos</p>
        </div>
        <div class="bg-white rounded-xl border border-crema p-3 text-center">
          <p class="font-bold text-azul text-lg">${n.grasas_g}g</p>
          <p class="text-xs text-gray-400">Grasas</p>
        </div>
        <div class="bg-white rounded-xl border border-crema p-3 text-center">
          <p class="font-bold text-azul text-lg">${n.fibra_g}g</p>
          <p class="text-xs text-gray-400">Fibra</p>
        </div>
      </div>
      <p class="text-xs text-gray-400 mt-2">*Valores aproximados por porción</p>
    </section>`;
  }

  // Sustituciones
  const sustitucionesHTML = (r.sustituciones || [])
    .map(s =>
      `<li class="text-sm text-amber-700">` +
      `<strong class="font-bold">Sin ${s.original}:</strong> ${s.alternativa}` +
      `</li>`
    )
    .join('\n        ');

  // Schema JSON-LD
  const schemaJsonLd = [
    recipeSchema(r),
    breadcrumbSchema(r.nombre, r.slug),
  ].map(toScriptTag).join('\n  ');

  // Fecha formateada
  const fechaFormateada = new Date(r.fecha_actualizacion + 'T12:00:00')
    .toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  // WhatsApp share text
  const ings   = r.ingredientes.map(i => `• ${i.cantidad} ${i.nombre}`).join('%0A');
  const pasos  = r.pasos.map((p, i) => `${i + 1}. ${p}`).join('%0A');
  const waText = encodeURIComponent(
    `🍽️ *${r.nombre}*\n⏱ ${r.tiempo} min | ${r.dificultad} | 👥 ${r.porciones} porciones\n\n` +
    `*Ingredientes:*\n${r.ingredientes.map(i => `• ${i.cantidad} ${i.nombre}`).join('\n')}\n\n` +
    `*Preparación:*\n${r.pasos.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n` +
    `🍳 Receta de CocinaAhora — ${BASE_URL}/receta/${r.slug}/`
  );

  return template
    .replaceAll('{{NOMBRE}}',             r.nombre)
    .replaceAll('{{SLUG}}',               r.slug)
    .replaceAll('{{DESCRIPCION}}',        r.descripcion)
    .replaceAll('{{IMAGEN}}',             r.imagen)
    .replaceAll('{{TIEMPO}}',             String(r.tiempo))
    .replaceAll('{{DIFICULTAD}}',         r.dificultad)
    .replaceAll('{{PORCIONES}}',          String(r.porciones))
    .replaceAll('{{CATEGORIA}}',          r.categoria)
    .replaceAll('{{FECHA_ACTUALIZACION}}',r.fecha_actualizacion)
    .replaceAll('{{FECHA_FORMATEADA}}',   fechaFormateada)
    .replaceAll('{{DIET_BADGES}}',        dietBadges)
    .replaceAll('{{INGREDIENTES_HTML}}',  ingredientesHTML)
    .replaceAll('{{PASOS_HTML}}',         pasosHTML)
    .replaceAll('{{NUTRICION_HTML}}',     nutricionHTML)
    .replaceAll('{{SUSTITUCIONES_HTML}}', sustitucionesHTML)
    .replaceAll('{{SCHEMA_JSON_LD}}',     schemaJsonLd)
    .replaceAll('{{WHATSAPP_TEXT}}',      waText);
}

// ==========================================
//  SITEMAP
// ==========================================

function generateSitemap(recetas) {
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: `${BASE_URL}/`,               lastmod: today,  priority: '1.0', changefreq: 'weekly'  },
    ...recetas.map(r => ({
      loc:        `${BASE_URL}/receta/${r.slug}/`,
      lastmod:    r.fecha_actualizacion,
      priority:   '0.9',
      changefreq: 'monthly',
    })),
    { loc: `${BASE_URL}/sobre-nosotros/`,          lastmod: today, priority: '0.6', changefreq: 'yearly' },
    { loc: `${BASE_URL}/contacto/`,                lastmod: today, priority: '0.5', changefreq: 'yearly' },
    { loc: `${BASE_URL}/politica-de-privacidad/`,  lastmod: today, priority: '0.3', changefreq: 'yearly' },
  ];

  const entries = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

// ==========================================
//  HOMEPAGE — inyección de schema + hreflang
// ==========================================

function processHomepage(html) {
  // 1. Reemplazar bloque Tailwind CDN por link CSS
  html = removeTailwindCDN(html);

  // 2. Inyectar hreflang antes de </head>
  const hreflang = [
    `  <link rel="alternate" hreflang="es-CO" href="${BASE_URL}/" />`,
    `  <link rel="alternate" hreflang="x-default" href="${BASE_URL}/" />`,
  ].join('\n');
  html = html.replace('</head>', `${hreflang}\n</head>`);

  // 3. Inyectar schema WebSite + Organization antes de </head>
  const websiteSchema = toScriptTag({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CocinaAhora',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });
  const orgSchema = toScriptTag({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CocinaAhora',
    url: BASE_URL,
    logo: `${BASE_URL}/img/logo.png`,
  });
  html = html.replace('</head>', `${websiteSchema}\n  ${orgSchema}\n</head>`);

  return html;
}

// ==========================================
//  MAIN BUILD
// ==========================================

function build() {
  console.log('🏗️  CocinaAhora — Build\n');

  const recetas  = JSON.parse(fs.readFileSync('data/recetas.json', 'utf8'));
  const template = fs.readFileSync('templates/receta.html', 'utf8');

  // dist/ ya existe gracias al paso build:css
  fs.mkdirSync(DIST, { recursive: true });

  // ── index.html ─────────────────────────────────────────
  console.log('📄  index.html');
  const indexHtml = processHomepage(fs.readFileSync('index.html', 'utf8'));
  fs.writeFileSync(path.join(DIST, 'index.html'), indexHtml);

  // ── Páginas de receta ───────────────────────────────────
  console.log(`🍳  Generando ${recetas.length} páginas de receta...`);
  for (const receta of recetas) {
    const dir = path.join(DIST, 'receta', receta.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderRecipePage(template, receta));
    console.log(`    ✓  /receta/${receta.slug}/`);
  }

  // ── sitemap.xml ─────────────────────────────────────────
  console.log('🗺️   sitemap.xml');
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), generateSitemap(recetas));

  // ── Assets estáticos ───────────────────────────────────
  console.log('📦  Assets...');

  fs.mkdirSync(path.join(DIST, 'js'),   { recursive: true });
  fs.copyFileSync('js/app.js', path.join(DIST, 'js', 'app.js'));

  fs.mkdirSync(path.join(DIST, 'data'), { recursive: true });
  fs.copyFileSync('data/recetas.json', path.join(DIST, 'data', 'recetas.json'));

  fs.copyFileSync('robots.txt',  path.join(DIST, 'robots.txt'));
  fs.copyFileSync('_redirects',  path.join(DIST, '_redirects'));

  if (fs.existsSync('img'))        copyDir('img',        path.join(DIST, 'img'));
  if (fs.existsSync('css/style.css')) {
    // Copiar style.css como referencia (output.css es el que se usa)
    fs.copyFileSync('css/style.css', path.join(DIST, 'css', 'style.css'));
  }

  // ── Páginas estáticas (procesar CDN → CSS) ─────────────
  const staticPages = ['politica-de-privacidad', 'sobre-nosotros', 'contacto'];
  for (const page of staticPages) {
    const src = path.join(page, 'index.html');
    if (!fs.existsSync(src)) {
      console.log(`    ⚠️   /${page}/ — no existe todavía, se omite`);
      continue;
    }
    const destDir = path.join(DIST, page);
    fs.mkdirSync(destDir, { recursive: true });
    let html = fs.readFileSync(src, 'utf8');
    html = removeTailwindCDN(html);
    fs.writeFileSync(path.join(destDir, 'index.html'), html);
    console.log(`    ✓  /${page}/`);
  }

  console.log('\n✅  Build completo → dist/\n');
}

build();

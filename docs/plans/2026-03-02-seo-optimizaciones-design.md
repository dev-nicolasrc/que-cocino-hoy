# Diseño: Optimizaciones SEO — cocinarahora.com

**Fecha:** 2026-03-02
**Estado:** Aprobado
**Basado en:** cocinarahora-spec.md (Score actual 31/100 → Objetivo 72/100)

---

## 1. Contexto del proyecto

- **Stack actual:** SPA vanilla (HTML + Vanilla JS + Tailwind CDN), desplegada en Netlify sin build step
- **Problema central:** Google ve 1 página indexable y 0 recetas (todo renderizado por JS)
- **10 recetas** en `data/recetas.json` con campo `slug` ya existente
- **Mercado objetivo:** Colombia (`es-CO`)
- **Riesgo activo:** AdSense ID `ca-pub-2594577923637858` activo sin Política de Privacidad → violación de términos AdSense + Ley 1581/2012

---

## 2. Decisiones de diseño

| Decisión | Elección |
|---------|----------|
| Enfoque SSG | Script Node.js (`build.js`) — sin migración de framework |
| Autoría de recetas | "Equipo Editorial CocinaAhora" (organización, no persona física) |
| Mercado / hreflang | Colombia → `hreflang="es-CO"` + `x-default` |
| Base legal privacidad | Ley 1581/2012 (Habeas Data Colombia) + condiciones AdSense |
| Prioridad compliance | Legal primero: Política de Privacidad en Semana 1 (sin build) |
| Enfoque de implementación | Progressive Enhancement (compliance inmediato, build en paralelo) |

---

## 3. Arquitectura

### Estructura de archivos

```
Recetas/
├── index.html                    ← fuente, sin cambios estructurales
├── politica-de-privacidad/
│   └── index.html                ← S1: HTML estático (no requiere build)
├── sobre-nosotros/
│   └── index.html                ← S2: HTML estático
├── contacto/
│   └── index.html                ← S2: HTML estático
├── robots.txt                    ← S1: creado manualmente
├── _redirects                    ← S1: /index.html → /
├── netlify.toml                  ← S3: headers seguridad + caching
│
│   ── Build system (semana 1–2) ──
├── package.json
├── tailwind.config.js
├── build.js                      ← genera dist/ completo
├── templates/
│   └── receta.html               ← template HTML con placeholders
│
│   ── Output generado (Netlify publica desde aquí) ──
└── dist/
    ├── index.html                ← con schema JSON-LD inyectado + hreflang
    ├── robots.txt
    ├── sitemap.xml               ← generado por build.js
    ├── css/output.css            ← Tailwind purgeado + minificado
    ├── js/app.js
    ├── data/recetas.json
    ├── img/
    ├── receta/
    │   ├── arroz-con-pollo/index.html
    │   ├── tortilla-espanola/index.html
    │   └── ... (10 recetas total)
    ├── politica-de-privacidad/index.html
    ├── sobre-nosotros/index.html
    └── contacto/index.html
```

### Netlify build config

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

---

## 4. Build System (build.js)

### Responsabilidades

1. Limpiar y crear `dist/`
2. Ejecutar Tailwind CSS build → `dist/css/output.css` (purgeado + minificado)
3. Copiar `index.html` → `dist/index.html` con estas modificaciones:
   - Reemplazar `<script src="cdn.tailwindcss.com">` por `<link rel="stylesheet" href="/css/output.css">`
   - Inyectar schema `WebSite` + `Organization` JSON-LD en `<head>`
   - Inyectar `<link rel="alternate" hreflang="es-CO">` + `x-default`
   - Carga no bloqueante de Google Fonts (Sprint 5)
4. Para cada receta en `recetas.json`:
   - Renderizar `templates/receta.html` → `dist/receta/{slug}/index.html`
   - Inyectar schema `Recipe` JSON-LD completo
5. Generar `dist/sitemap.xml` (21 URLs con `lastmod` y `priority`)
6. Copiar assets: `robots.txt`, `_redirects`, `img/`, `data/`, `js/`
7. Copiar páginas estáticas: `politica-de-privacidad/`, `sobre-nosotros/`, `contacto/`

### package.json scripts

```json
{
  "scripts": {
    "build:css": "tailwindcss -i css/style.css -o dist/css/output.css --minify",
    "build": "npm run build:css && node build.js"
  }
}
```

---

## 5. Actualizaciones a recetas.json

Campos a agregar en cada objeto de receta:

```json
{
  "autor": {
    "nombre": "Equipo Editorial CocinaAhora",
    "titulo": "Equipo de redacción culinaria",
    "url": "/sobre-nosotros/"
  },
  "fecha_publicacion": "2026-01-15",
  "fecha_actualizacion": "2026-03-02",
  "tiempo_iso8601": "PT35M",
  "descripcion": "Descripción corta de la receta para SEO y schema",
  "nutricion": {
    "calorias": 0,
    "proteinas_g": 0,
    "carbohidratos_g": 0,
    "grasas_g": 0,
    "fibra_g": 0
  },
  "imagen": "https://images.unsplash.com/photo-xxx?w=800&fm=webp&auto=format"
}
```

**Nota:** `tiempo_iso8601` se puede derivar del campo existente `tiempo` (`"PT" + tiempo + "M"`).
Las imágenes existentes ya tienen URLs de Unsplash; solo se agrega `&fm=webp&auto=format`.

---

## 6. Schema JSON-LD

### Homepage (WebSite + Organization)

```json
{
  "@type": "WebSite",
  "name": "CocinaAhora",
  "url": "https://cocinarahora.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://cocinarahora.com/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

```json
{
  "@type": "Organization",
  "name": "CocinaAhora",
  "url": "https://cocinarahora.com",
  "logo": "https://cocinarahora.com/img/logo.png"
}
```

### Páginas de receta (Recipe)

Campos mapeados desde `recetas.json`:
- `name` ← `receta.nombre`
- `image` ← `receta.imagen` (con parámetros WebP)
- `author.name` ← `receta.autor.nombre`
- `datePublished` ← `receta.fecha_publicacion`
- `dateModified` ← `receta.fecha_actualizacion`
- `description` ← `receta.descripcion`
- `totalTime` ← `receta.tiempo_iso8601`
- `recipeYield` ← `receta.porciones`
- `recipeCategory` ← `receta.categoria`
- `recipeCuisine` ← `"Colombiana"`
- `recipeIngredient` ← array de `ingrediente.nombre + cantidad`
- `recipeInstructions` ← array de `HowToStep` desde `receta.pasos`
- `suitableForDiet` ← mapeado desde `tags_dieta`
- `nutrition` ← `receta.nutricion`

**Mapeo de dietas a schema.org:**
- `vegano` → `schema:VeganDiet`
- `sin-gluten` → `schema:GlutenFreeDiet`
- `saludable` → `schema:LowFatDiet`

---

## 7. Páginas de contenido

### /politica-de-privacidad/

Contenido requerido:
- Responsable: Equipo CocinaAhora (Colombia)
- Base legal: **Ley 1581/2012** (Habeas Data) para datos de usuarios colombianos
- Datos tratados: cookies de AdSense (`ca-pub-2594577923637858`), datos de navegación
- Derechos del usuario: acceso, corrección, supresión, queja ante **SIC** (Superintendencia de Industria y Comercio)
- Política de cookies de Google AdSense
- Email de contacto operativo
- Mismo diseño visual (Tailwind + paleta naranja/azul del sitio)

**Urgencia:** Debe estar live antes de activar AdSense real.

### /sobre-nosotros/

- Historia de CocinaAhora, propuesta de valor
- "Equipo Editorial CocinaAhora" como autor colectivo
- Schema `Organization` integrado
- Fecha de fundación del sitio

### /contacto/

- Email de contacto operativo
- Tiempo estimado de respuesta
- Schema `ContactPage`

---

## 8. netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/index.html"
  to = "/"
  status = 301

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/css/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/js/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.json"
  [headers.values]
    Cache-Control = "public, max-age=86400"
```

**Nota:** `Content-Security-Policy` se añade en Sprint 3 tras verificar que AdSense funciona correctamente con la configuración de headers.

---

## 9. Sprints 4–5 (Mes 2 en adelante)

### Sprint 4 — Contenido y schema expandido

- **Homepage 500+ palabras:** Contenido editorial estático con keywords colombianas ("recetas con ingredientes que tengo en casa", "qué cocinar hoy con lo que tengo", "buscador de recetas Colombia")
- **FAQ** en acordeón: 3 preguntas + schema `FAQPage`
- **Páginas de categoría/dieta:** Generadas por `build.js` cuando haya ≥3 recetas por categoría. Schema `CollectionPage` + breadcrumbs `BreadcrumbList`
- **hreflang:** `es-CO` + `x-default` (ya incluido en el build del Sprint 1)
- **Fechas visibles:** `<time datetime="...">` en páginas de receta

### Sprint 5 — Performance

| Ítem | Técnica |
|------|---------|
| Fonts no bloqueantes | `media="print" onload="this.media='all'"` |
| CLS del grid | `min-height: 600px` en `#grid-recetas` + skeleton cards en HTML |
| Minificación JS | `terser` en `build.js` → `dist/js/app.min.js` |
| Preconnect AdSense | 3 tags `dns-prefetch`/`preconnect` en `<head>` |
| Imagen OG | `/img/og-image.webp` 1200×630, actualizar meta tag |
| Hero 404 | Imagen Unsplash con `?fm=webp&auto=format` (igual que recetas) |

---

## 10. Orden de implementación

| Semana | Entregables | ID Spec |
|--------|------------|---------|
| 1 | `robots.txt`, `/politica-de-privacidad/`, `_redirects`, footer links | C-2, C-5-A, H-8 |
| 1–2 | `package.json`, `build.js`, Tailwind build, 10 páginas receta, schema Recipe | C-1, C-4-A, C-4-B, H-1, H-6 |
| 2–3 | `sitemap.xml`, `/sobre-nosotros/`, `/contacto/`, `netlify.toml`, WebP hero | C-3, C-5-B, C-5-C, H-2, H-3, H-7 |
| Mes 2 | Datos nutricionales, fechas, páginas categoría/dieta, homepage 500+ palabras, hreflang | H-4, H-5, M-1, M-2, M-5-A, M-5-B, C-6 |
| Mes 2–3 | Fonts no bloqueantes, CLS fix, OG image, preconnect AdSense | M-3, M-4, M-7, M-8 |

---

## 11. Impacto esperado

| Métrica | Actual | Tras Semana 1–3 | Objetivo |
|---------|--------|-----------------|----------|
| Páginas indexables | 1 | 11–14 | 21+ |
| Recetas con Rich Results | 0% | 100% | 100% |
| Score SEO global | 31/100 | ~50/100 | ~72/100 |
| Riesgo AdSense/Legal | ALTO | Resuelto | — |
| LCP Mobile | ~3.5s | — | <2.5s |

# Plan de Implementación: Optimizaciones SEO — cocinarahora.com

**Fecha:** 2026-03-02
**Diseño de referencia:** `2026-03-02-seo-optimizaciones-design.md`
**Score objetivo:** 31/100 → 72/100

---

## Semana 1 — Compliance legal + quick fixes (sin build step)

### Tarea 1.1 — Crear `robots.txt`
**Archivo:** `robots.txt` (raíz del proyecto)
**Acción:** Crear con contenido del spec C-2
```
User-agent: *
Allow: /
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
Sitemap: https://cocinarahora.com/sitemap.xml
```
**Criterio de éxito:** `https://cocinarahora.com/robots.txt` devuelve HTTP 200

---

### Tarea 1.2 — Crear `_redirects`
**Archivo:** `_redirects` (raíz del proyecto)
**Acción:** Añadir redirección 301
```
/index.html / 301
```
**Criterio de éxito:** `https://cocinarahora.com/index.html` redirige 301

---

### Tarea 1.3 — Crear `/politica-de-privacidad/index.html`
**Archivo:** `politica-de-privacidad/index.html` (nueva carpeta)
**Diseño:** Mismo visual que el sitio (Tailwind CDN temporalmente, hasta que el build esté listo)
**Contenido requerido:**
- Responsable: Equipo Editorial CocinaAhora (Colombia)
- Base legal: Ley 1581/2012 (Habeas Data Colombia)
- Datos tratados: cookies de AdSense `ca-pub-2594577923637858`, datos de navegación anónimos
- Derechos: acceso, corrección, supresión, queja ante SIC
- Política de cookies de Google AdSense
- Email de contacto operativo
- Fecha de última actualización: 2026-03-02

**Criterio de éxito:** URL devuelve 200, enlace en footer funcional, AdSense Policy Checker pasa

---

### Tarea 1.4 — Actualizar footer links en `index.html`
**Archivo:** `index.html`
**Acción:** Reemplazar `href="#"` en los 3 links del footer por URLs reales:
- Privacidad → `/politica-de-privacidad/`
- Contacto → `/contacto/`
- Sobre Nosotros → `/sobre-nosotros/`

---

## Semana 1–2 — Build system + SSG

### Tarea 2.1 — Crear `package.json`
**Archivo:** `package.json` (raíz)
**Contenido:**
```json
{
  "name": "cocinarahora",
  "version": "1.0.0",
  "scripts": {
    "build:css": "tailwindcss -i css/style.css -o dist/css/output.css --minify",
    "build": "npm run build:css && node build.js"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0"
  }
}
```

---

### Tarea 2.2 — Crear `tailwind.config.js`
**Archivo:** `tailwind.config.js` (raíz)
**Acción:** Extraer la configuración del `<script>` inline en `index.html` a este archivo.
Incluir content paths para purging: `["./index.html", "./templates/**/*.html", "./**/*.html"]`

---

### Tarea 2.3 — Actualizar `recetas.json`
**Archivo:** `data/recetas.json`
**Acción:** Añadir estos campos a cada una de las 10 recetas:
- `autor`: objeto con `nombre`, `titulo`, `url`
- `fecha_publicacion`: fecha ISO (estimada: 2026-01-15)
- `fecha_actualizacion`: fecha ISO (2026-03-02)
- `tiempo_iso8601`: derivar del campo `tiempo` existente (`"PT" + tiempo + "M"`)
- `descripcion`: 1-2 frases descriptivas para SEO y schema
- `nutricion`: objeto con `calorias`, `proteinas_g`, `carbohidratos_g`, `grasas_g`, `fibra_g` (valores estimados)
- `imagen`: añadir `&fm=webp&auto=format` a cada URL de Unsplash existente

**Autor para todas las recetas:**
```json
"autor": {
  "nombre": "Equipo Editorial CocinaAhora",
  "titulo": "Equipo de redacción culinaria",
  "url": "/sobre-nosotros/"
}
```

---

### Tarea 2.4 — Crear `templates/receta.html`
**Archivo:** `templates/receta.html`
**Descripción:** Template HTML completo para una página de receta con:
- `<head>` con todos los meta tags SEO (`title`, `description`, `canonical`, OG tags)
- Schema `Recipe` JSON-LD con todos los campos mapeados (placeholder `{{campo}}`)
- hreflang `es-CO` + `x-default`
- Link al CSS construido (`/css/output.css`)
- Contenido estático: foto, tiempo, dificultad, porciones, ingredientes, pasos, sustituciones
- `<time datetime="{{fecha_actualizacion}}">` visible
- Link de vuelta a la homepage
- Footer con links a privacidad, contacto, sobre nosotros

---

### Tarea 2.5 — Crear `build.js`
**Archivo:** `build.js` (raíz)
**Funcionalidad:**
1. Leer `data/recetas.json`
2. Crear estructura de `dist/` (limpiar si existe)
3. Copiar `index.html` → `dist/index.html`:
   - Reemplazar `<script src="https://cdn.tailwindcss.com">` y el `<script>tailwind.config=...` por `<link rel="stylesheet" href="/css/output.css">`
   - Inyectar schema `WebSite` + `Organization` JSON-LD antes de `</head>`
   - Inyectar hreflang `es-CO` + `x-default` antes de `</head>`
4. Para cada receta:
   - Leer `templates/receta.html`
   - Sustituir todos los placeholders `{{campo}}` con valores de la receta
   - Escribir `dist/receta/{slug}/index.html`
5. Generar `dist/sitemap.xml` con las 21 URLs (homepage + 10 recetas + categorías/dietas + páginas)
6. Copiar activos: `css/style.css`, `js/app.js`, `data/recetas.json`, `img/` (si existe), `robots.txt`, `_redirects`
7. Copiar páginas estáticas: `politica-de-privacidad/`, `sobre-nosotros/`, `contacto/`

---

### Tarea 2.6 — Actualizar Netlify para usar build
**Archivo:** `netlify.toml` (crear si no existe)
```toml
[build]
  command = "npm run build"
  publish = "dist"
```
**Acción:** Asegurarse que Netlify usa este comando. Verificar en el dashboard de Netlify.

**Criterio de éxito:** Deploy exitoso, `/receta/arroz-con-pollo/` devuelve HTTP 200 con HTML completo en source

---

## Semana 2–3 — E-E-A-T + Configuración Netlify

### Tarea 3.1 — Crear `/sobre-nosotros/index.html`
**Contenido:**
- Historia y motivación de CocinaAhora
- "Equipo Editorial CocinaAhora" — descripción del equipo
- Misión: ayudar a los colombianos a cocinar con lo que tienen
- Fecha de fundación del sitio
- Schema `Organization` JSON-LD

---

### Tarea 3.2 — Crear `/contacto/index.html`
**Contenido:**
- Email de contacto operativo (definir antes de implementar)
- Tiempo estimado de respuesta
- Schema `ContactPage`

---

### Tarea 3.3 — Actualizar `netlify.toml` con headers y caching
**Acción:** Añadir las secciones de headers de seguridad y caching definidas en el diseño.
Incluir `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
Añadir caching largo plazo para `/css/*`, `/js/*`, y `/*.json`.

---

### Tarea 3.4 — Corregir imagen hero (404)
**Archivo:** `index.html` → CSS hero background
**Acción:** Reemplazar referencia a `/img/hero-bg.jpg` (404) por una URL de Unsplash con parámetros WebP:
```
https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1600&fm=webp&auto=format
```
Actualizar en `css/style.css` o en el inline style del hero.

---

## Mes 2 — Contenido + schema expandido

### Tarea 4.1 — Expandir homepage a 500+ palabras
**Archivo:** `index.html`
**Secciones a añadir (antes del footer, después del grid de recetas):**
1. **Cómo funciona** (150 palabras): 3 pasos illustrados
2. **Por qué CocinaAhora** (100 palabras): beneficios concretos
3. **Recetas destacadas** (lista estática de 3-4 recetas con links a páginas estáticas)
4. **FAQ** (150 palabras, 3 preguntas):
   - ¿Cómo busco recetas por ingredientes?
   - ¿Funciona para dietas especiales?
   - ¿Puedo sugerir recetas nuevas?

**Keywords a incluir naturalmente (Colombia):**
- "recetas con ingredientes que tengo en casa"
- "qué cocinar hoy con lo que tengo"
- "buscador de recetas por ingredientes Colombia"

**Añadir schema `FAQPage`** en build.js para inyectar en dist/index.html.

---

### Tarea 4.2 — Añadir hreflang al build
**Archivo:** `build.js` (ya incluido en Tarea 2.5, verificar)
```html
<link rel="alternate" hreflang="es-CO" href="https://cocinarahora.com/" />
<link rel="alternate" hreflang="x-default" href="https://cocinarahora.com/" />
```

---

### Tarea 4.3 — Páginas de categoría y dieta
**Prerequisito:** ≥3 recetas indexadas por categoría/dieta
**Generadas por `build.js`** en una nueva iteración:
- `/categoria/almuerzo/` → 4 recetas (ID 1, 3, 6, 9)
- `/categoria/cena/` → 6 recetas (ID 2, 4, 5, 7, 8, 10)
- `/dieta/vegano/` → 4 recetas
- `/dieta/sin-gluten/` → 8 recetas
- `/dieta/saludable/` → 4 recetas
- `/dieta/rapido/` → 5 recetas
- `/dieta/economico/` → 5 recetas

Cada página requiere: H1 con keyword objetivo, 200+ palabras editoriales, listado de tarjetas, schema `CollectionPage`, breadcrumbs.

---

## Mes 2–3 — Performance

### Tarea 5.1 — Google Fonts no bloqueantes
**Archivo:** `templates/receta.html` + `index.html`
**Acción:** Reemplazar `<link href="...fonts.googleapis.com...">` por la técnica `media="print" onload="this.media='all'"` con `<noscript>` fallback.

---

### Tarea 5.2 — Prevenir CLS en grid de recetas
**Archivo:** `css/style.css`
**Acción:** Añadir `min-height: 600px` a `#grid-recetas`.
**Mejor solución (opcional):** Añadir skeleton HTML cards antes del JS ejecutar.

---

### Tarea 5.3 — Minificación JS
**Archivo:** `build.js`
**Acción:** Integrar `terser` para minificar `js/app.js` → `dist/js/app.min.js`.
Actualizar referencias en templates HTML.

---

### Tarea 5.4 — Imagen OG dedicada
**Archivo:** `/img/og-image.webp` (1200×630px)
**Acción:** Crear imagen OG con branding CocinaAhora.
Actualizar meta tag en `index.html` y en `build.js`:
```html
<meta property="og:image" content="https://cocinarahora.com/img/og-image.webp" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

---

### Tarea 5.5 — Preconnect para AdSense
**Archivo:** `index.html` y `templates/receta.html` → `<head>`
```html
<link rel="preconnect" href="https://googleads.g.doubleclick.net" crossorigin />
<link rel="dns-prefetch" href="https://tpc.googlesyndication.com" />
<link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
```

---

## Checklist de validación final

- [ ] `https://cocinarahora.com/robots.txt` → HTTP 200
- [ ] `https://cocinarahora.com/receta/arroz-con-pollo/` → HTTP 200, HTML con schema en source
- [ ] Rich Results Test de Google pasa sin errores para una receta
- [ ] `https://cocinarahora.com/politica-de-privacidad/` → HTTP 200, enlace en footer funcional
- [ ] `https://cocinarahora.com/sitemap.xml` → HTTP 200, formato válido
- [ ] Sitemap enviado a Google Search Console
- [ ] SecurityHeaders.com → grado B o superior
- [ ] No hay referencia a `cdn.tailwindcss.com` en HTML deployado
- [ ] Tailwind CSS generado < 20 KB
- [ ] Imagen hero devuelve HTTP 200
- [ ] Footer: los 3 links apuntan a URLs reales (no `href="#"`)
- [ ] hreflang `es-CO` válido en herramienta de Google

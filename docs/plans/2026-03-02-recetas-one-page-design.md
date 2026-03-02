# Diseño: "Qué Cocino Hoy" — One-Page de Recetas

**Fecha:** 2026-03-02
**Estado:** Aprobado
**Proyecto:** One-page web para resolver la indecisión culinaria diaria

---

## 1. Resumen Ejecutivo

Aplicación web de una sola página (One-Page) que permite a usuarios encontrar recetas según ingredientes disponibles, con monetización via AdSense y links de afiliación. El MVP cubre las funcionalidades core; el planificador semanal y el blog SEO se implementan en Fase 2.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Markup | HTML5 semántico |
| Estilos | Tailwind CSS via CDN + `css/style.css` para overrides |
| Lógica | Vanilla JavaScript (sin frameworks) |
| Datos | `data/recetas.json` — JSON estático |
| Hosting | Netlify / GitHub Pages / Vercel |

---

## 3. Estructura de Archivos

```
Recetas/
├── index.html              ← One-page principal
├── data/
│   └── recetas.json        ← 50 recetas (10 reales + 40 placeholders)
├── js/
│   └── app.js              ← Toda la lógica JS
├── css/
│   └── style.css           ← Estilos custom (Tailwind CDN cubre el 90%)
└── img/
    ├── hero-bg.jpg         ← Imagen de fondo del header
    └── recetas/            ← Fotos de platos (o URLs externas)
```

---

## 4. Esquema de Datos (recetas.json)

```json
{
  "id": 1,
  "nombre": "Arroz con Pollo",
  "slug": "arroz-con-pollo",
  "imagen": "img/recetas/arroz-pollo.jpg",
  "tiempo": 35,
  "dificultad": "fácil",
  "porciones": 4,
  "ingredientes": [
    { "nombre": "pollo", "cantidad": "500g", "afiliado": null },
    { "nombre": "arroz", "cantidad": "2 tazas", "afiliado": null }
  ],
  "pasos": ["Paso 1...", "Paso 2..."],
  "tags_dieta": ["normal", "sin-gluten"],
  "sustituciones": [
    { "original": "pollo", "alternativa": "tofu o garbanzos" }
  ],
  "categoria": "almuerzo"
}
```

**Campos clave:**
- `tags_dieta`: valores posibles — `normal`, `vegano`, `sin-gluten`, `saludable`, `rapido`, `economico`
- `sustituciones`: habilita la sección "Si no tienes X, usa Y" del modal
- `afiliado` en ingrediente: URL de afiliación (Amazon Associates), `null` si no aplica

---

## 5. Layout de la One-Page

### Orden de secciones (top → bottom):

```
HEADER / NAV
  Logo "Qué Cocino Hoy" + anclas: [Buscador] [Inspiración] [Menú Semanal]

BANNER AD SUPERIOR (728x90 desktop / 320x50 mobile)

HERO SECTION  (#hero)
  Imagen de fondo con overlay naranja
  Headline: "¿Qué hay en tu nevera hoy?"
  Subheadline: "Encontramos la receta perfecta en segundos"
  [Botón Sorpréndeme]

SECCIÓN BUSCADOR  (#buscador)
  Input con autocompletado de ingredientes
  Nube de tags clicables (ingredientes populares)
  [¡Cocinar Ahora!]

BANNER AD IN-CONTENT

SECCIÓN INSPIRACIÓN  (#inspiracion)
  Botones de filtro: [Saludable] [Vegano] [Sin Gluten] [Cenas Ligeras] [Rápido] [Económico]
  Grid de tarjetas de recetas filtradas

SECCIÓN MENÚ SEMANAL  (#menu) — FASE 2
  Placeholder visible con CTA "Próximamente"

FOOTER
  Links: Privacidad | Contacto | Sobre Nosotros
```

### Modal de Receta (overlay):
```
┌──────────────────────────────────┐
│  [X]  Nombre del plato           │
│  ─────────────────────────────   │
│  [Foto grande - 400px]           │
│  ⏱ 35 min  |  ⭐ Fácil  |  👥 4  │
│  ─────────────────────────────   │
│  Ingredientes:                   │
│  • 500g pollo                    │
│  • 2 tazas arroz                 │
│  ─────────────────────────────   │
│  Pasos:                          │
│  1. Paso uno...                  │
│  2. Paso dos...                  │
│  ─────────────────────────────   │
│  💡 Sustituciones:               │
│  Si no tienes pollo → usa tofu   │
│  ─────────────────────────────   │
│  [📲 Compartir WhatsApp] [📋 Copiar] │
└──────────────────────────────────┘
```

---

## 6. Lógica JavaScript (app.js)

### Flujo principal:

```
INIT
  └── fetch('data/recetas.json')
      ├── Carga array de recetas en memoria
      └── Renderiza nube de tags con ingredientes únicos

BUSCADOR
  ├── Input → autocompletado con datalist de ingredientes
  ├── Clic en tag → toggle ingrediente en selección activa
  ├── "Cocinar Ahora" →
  │   ├── Score = cantidad de ingredientes que coinciden / total de receta
  │   ├── Selecciona receta con mayor score
  │   └── Abre modal
  └── Sin coincidencias → mensaje amigable

SORPRÉNDEME
  └── Math.random() sobre array completo → abre modal

FILTROS
  ├── Clic en botón de dieta → filtra por tags_dieta
  └── Renderiza grid de tarjetas (card: foto + nombre + tiempo)

MODAL
  ├── Renderiza HTML dinámico con datos de receta
  ├── WhatsApp → window.open('https://wa.me/?text=...')
  ├── Copiar → navigator.clipboard.writeText(texto)
  └── Cerrar → clic en [X] o backdrop
```

---

## 7. Diseño Visual

| Elemento | Valor |
|---------|-------|
| Color principal | `#FF6B35` (naranja) |
| Color secundario | `#F7C59F` (crema) |
| Fondo | `#EFEFD0` |
| Acento | `#004E89` (azul) |
| Tipografía títulos | Nunito (Google Fonts) |
| Tipografía cuerpo | Inter (Google Fonts) |
| Hero | Imagen de fondo con overlay `rgba(255,107,53,0.75)` |
| Diseño | Mobile-first, breakpoints Tailwind `sm:` y `md:` |

---

## 8. Monetización

### Espacios publicitarios:
- `<div id="ad-top">` — debajo del nav, dimensiones 728x90 / 320x50 reservadas con CSS
- `<div id="ad-mid">` — entre buscador y sección de filtros
- En MVP: divs con placeholder visual comentado. Se activan con código AdSense/Ezoic

### Afiliación:
- Campo `afiliado` en cada ingrediente del JSON
- El JS renderiza `<a href="[url]" target="_blank">` solo si el campo no es `null`

### Consideraciones CLS (Core Web Vitals):
- Reservar espacio de anuncios con `min-height` para evitar layout shift

---

## 9. Performance

| Objetivo | Estrategia |
|---------|-----------|
| Carga < 2s | Sin JS frameworks, Tailwind CDN cacheado |
| Imágenes | `loading="lazy"`, max 400px wide, formato WebP preferido |
| JSON | < 100KB para 50 recetas |
| Fonts | Google Fonts con `display=swap` |
| Sin build step | Listo para deploy directo |

---

## 10. SEO Básico (MVP)

```html
<title>Qué Cocino Hoy - Recetas con lo que tienes en casa</title>
<meta name="description" content="Encuentra recetas deliciosas con los ingredientes que tienes. Búsqueda rápida, menú semanal y más.">
<meta property="og:title" content="Qué Cocino Hoy">
<meta property="og:image" content="img/hero-bg.jpg">
```

- Secciones con IDs semánticos para anclas
- Headings jerarquizados (H1 → H2 → H3)
- Blog y FAQs: secciones vacías marcadas `<!-- FASE 2 -->` para no bloquear indexación

---

## 11. Fases de Desarrollo

### Fase 1 — MVP (este plan)
- [x] Estructura de archivos
- [x] `recetas.json` con 10 recetas reales
- [x] Header/Nav con anclas
- [x] Hero con Sorpréndeme
- [x] Buscador por ingredientes + nube de tags
- [x] Modal de receta (completo)
- [x] Filtros de estilo de vida + grid de tarjetas
- [x] Espacios de anuncios (placeholders)
- [x] Responsive mobile-first
- [x] Deploy en Netlify/GitHub Pages

### Fase 2 — Expansión
- [ ] Planificador semanal (7 días, perfiles: saludable/rápido/económico)
- [ ] Blog SEO (500+ palabras)
- [ ] Sección FAQs en acordeón
- [ ] Completar las 50 recetas
- [ ] Integración real de AdSense
- [ ] Links de afiliación Amazon Associates

---

## 12. Criterios de Éxito del MVP

1. El buscador retorna resultados relevantes con al menos 1 ingrediente
2. El modal muestra todos los campos requeridos del JSON
3. Sorpréndeme nunca falla (siempre hay recetas)
4. Los filtros de dieta funcionan correctamente
5. Carga < 2 segundos en conexión 3G
6. 100% responsive en mobile (375px+)
7. Deploy exitoso y accesible via URL pública

# Requerimientos del Proyecto: "Qué Cocino Hoy" (One-Page Web)

## 1. Descripción General
Desarrollo de una aplicación web de una sola página (One-Page) diseñada para resolver la indecisión culinaria diaria. La web permitirá a los usuarios encontrar recetas basadas en ingredientes disponibles, generar menús semanales y obtener sugerencias saludables, optimizada para monetización mediante anuncios (AdSense/Ezoic) y enlaces de afiliación.

---

## 2. Requerimientos Funcionales (Core Features)

### 2.1. Buscador de Ingredientes "Mi Nevera"
*   **Input de Selección:** Campo de búsqueda con autocompletado para seleccionar ingredientes (ej. Pollo, Arroz, Brócoli).
*   **Nube de Etiquetas:** Selección rápida de ingredientes comunes mediante clics.
*   **Lógica de Matching:** Botón "¡Cocinar ahora!" que filtra la base de datos y muestra la receta con mayor coincidencia.

### 2.2. Visualizador de Recetas (Modal/Desplegable)
*   **Ficha Técnica:** Nombre del plato, foto en alta resolución, tiempo de preparación y nivel de dificultad.
*   **Instrucciones:** Lista de ingredientes con cantidades y pasos de preparación numerados.
*   **Sustituciones Inteligentes:** Sección de "Si no tienes X, usa Y" para aumentar la utilidad.
*   **Botón de Compartir:** Opción para enviar la receta por WhatsApp o copiar al portapapeles.

### 2.3. Generador de Inspiración y Planificación
*   **Botón "Sorpréndeme":** Genera una receta aleatoria visualmente atractiva con un solo clic.
*   **Planificador Semanal Express:** Botón que genera una tabla de 7 días (comida y cena) basada en un perfil seleccionado (Saludable, Rápido o Económico).
*   **Filtros de Estilo de Vida:** Accesos directos para recetas "Saludables", "Veganas", "Sin Gluten" o "Cenas Ligeras".

---

## 3. Requerimientos de Contenido y SEO

### 3.1. Base de Datos (Estructura mínima)
*   Mínimo de 50 recetas iniciales categorizadas.
*   Etiquetas por ingrediente principal, tiempo y tipo de dieta.

### 3.2. Contenido para Indexación (SEO)
*   **Sección de Blog Inferior:** Bloque de texto de 500+ palabras sobre "Consejos para ahorrar en la compra" o "Cómo organizar tu menú semanal".
*   **FAQs:** Sección de preguntas frecuentes desplegables (Acordeón) sobre cocina básica para mejorar el ranking en buscadores.

---

## 4. Requerimientos Técnicos y de Diseño

### 4.1. Interfaz de Usuario (UI/UX)
*   **Diseño Mobile-First:** Optimización total para smartphones (uso con una sola mano).
*   **Navegación por Anclas:** Menú superior que desplace al usuario suavemente a las secciones de "Buscador", "Menú Semanal" e "Inspiración".
*   **Velocidad de Carga:** Implementación de *Lazy Loading* para imágenes y scripts ligeros para asegurar carga en < 2 segundos.

### 4.2. Estrategia de Monetización (Ad Placement)
*   **Espacio Superior:** Banner horizontal (728x90 o 320x50) debajo del header.
*   **Anuncio In-Content:** Espacio publicitario entre el buscador de ingredientes y el resultado de la receta.
*   **Afiliación:** Enlaces de texto en los ingredientes o utensilios recomendados (ej. Amazon Associates).

---

## 5. Stack Tecnológico Sugerido
*   **Frontend:** HTML5, CSS3 (Tailwind CSS para rapidez) y JavaScript (Vanilla o Vue.js para reactividad simple).
*   **Backend (Opcional):** Firebase o un archivo JSON estático para la base de datos de recetas (para máxima velocidad).
*   **Hosting:** Vercel, Netlify o GitHub Pages (Gratuitos y rápidos).

---

## 6. Próximos Pasos
1.  Definir el listado inicial de 50 recetas.
2.  Diseñar el prototipo visual (Wireframe) de la sección "Hero".
3.  Configurar la cuenta de Google AdSense una vez el sitio tenga contenido base.
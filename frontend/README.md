# Frontend — Portfolio

Vue 3 + Vite + TypeScript. Consume `portfolio-service` (proyectos, stack, experiencia) y `contact-service` (formulario de contacto). Estética editorial en blanco/negro/rojo con animaciones reales de GSAP (no CSS `@keyframes`) y scroll suave con Lenis, combinando tres referencias: Eric Cole (hero tipográfico + hover-reveal), Liam Bennett (el propio hover-reveal de proyectos) y cipharvin.ro (scroll reveals, contadores, alternancia clara/oscura).

## Estructura

```text
src/
  api.ts                    # cliente HTTP contra portfolio-service y contact-service
  App.vue                   # orquestador: Lenis, fetch de datos, monta las secciones
  style.css                 # única hoja de estilos global
  lib/gsap.ts                # gsap + ScrollTrigger + SplitText, registrados una sola vez
  assets/
    photos/                  # 3 fotos personales (hero, "Sobre mí", contacto)
    projects/                 # capturas de los 3 proyectos, en .webp
  components/
    SiteHeader.vue            SiteFooter.vue
    FloatingNav.vue            HeroSection.vue
    AboutSection.vue           HugePhrase.vue
    ProjectsSection.vue        StackSection.vue
    ExperienceSection.vue      ContactSection.vue
    SectionLabel.vue           StatCounter.vue
    SystemClock.vue            Marquee.vue
  composables/
    usePortfolioData.ts       # fetch de proyectos/skills/experiencia al montar
    useContactForm.ts         # estado y envío del formulario de contacto
    useLenis.ts                # smooth scroll global, conectado al ticker de GSAP; expone getLenis()
    useScrollReveal.ts         # la entrada fade+translateY que usan todas las secciones
    useCounter.ts              # contador animado (stats del hero)
    useMarquee.ts              # motor del marquee/ticker (rAF)
    useClock.ts                # reloj en tiempo real (Europe/Madrid)
e2e/
  contact-form.spec.ts       # Playwright: formulario de contacto + animaciones del hero/proyectos
  navigation.spec.ts         # Playwright: aparición y scroll de la navegación flotante
```

## Paleta y tipografía

Todo el sitio vive en `--bg` (negro, `#0a0a0a`), `--fg` (blanco roto, `#f5f5f0`) y `--red` (`#c8102e`) como único acento — nunca como fondo de sección completa, solo en texto, números, overlays y CTAs. Una sección se pasa a fondo claro añadiendo la clase `section--light`, que redefine `--bg`/`--fg`/`--muted`/`--line` **localmente** dentro de esa sección (ver el bloque `.section--light` al principio de `style.css`); `--red` no se toca nunca, es el único valor que no cambia entre temas.

Tres fuentes, todas por Google Fonts:

- **Anton** — títulos de gran impacto: el nombre del hero, los `<h2>` de cada sección, el CTA de contacto.
- **Space Grotesk** — texto de cuerpo (párrafos, inputs).
- **DM Mono** — todo lo demás: navegación, reloj, números de sección, etiquetas, stats.

## Sistema de animación (GSAP)

Todo pasa por `src/lib/gsap.ts`, que registra `ScrollTrigger` y `SplitText` una única vez (GSAP 3.13+ incluye ambos gratis para cualquier cuenta, ya no son plugins de pago). **Ningún componente importa `gsap` directamente** desde el paquete: siempre `import { gsap, ScrollTrigger, SplitText } from '../lib/gsap'`, para garantizar que los plugins ya están registrados sin depender del orden de imports.

### Lenis (smooth scroll)

`useLenis()` se llama una sola vez, en `App.vue`. Crea la instancia con la configuración estándar recomendada (`duration: 1.2`, easing exponencial) y la conecta al ticker de GSAP:

```ts
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

Esto es imprescindible: sin ello, cada `ScrollTrigger` de la página mediría el scroll nativo (instantáneo) en vez del scroll suavizado de Lenis, y las animaciones se desincronizarían del movimiento real que ve la persona. **Importante para quien haga testing o debugging:** Lenis intercepta el scroll, así que `element.scrollIntoView()` o `window.scrollTo()` llamados directamente no funcionan de forma fiable (Lenis los sobreescribe en el siguiente frame) — hay que simular scroll real (`page.mouse.wheel(...)` en Playwright) o usar la propia API de Lenis.

### Hero: SplitText + contadores + parallax (`HeroSection.vue`)

- **Nombre**: `new SplitText(nameEl, { type: 'chars', charsClass: 'char' })` divide "JAVIER CRESPO MOLL" en un `<div class="char">` por letra, animados con `gsap.from(split.chars, { y: 100, opacity: 0, stagger: 0.03, duration: 0.8, ease: 'power4.out' })`. `charsClass` no es cosmético: sin él, GSAP no añade ninguna clase a los caracteres y ni el CSS (`will-change`) ni los tests de Playwright (`.hero-name .char`) tienen nada que seleccionar.
- **Subtítulo**: fade + slide con `delay: 0.4` respecto al mismo `onMounted`.
- **Parallax de fondo**: `gsap.to(bgImageEl, { yPercent: 20, scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } })`. Un `yPercent` menor que el desplazamiento real de scroll es lo que hace que la imagen "vaya más lenta" que el contenido.
- **Stats**: cada `<StatCounter>` usa `useCounter`, que no construye su `ScrollTrigger` hasta que el valor final es mayor que 0 — necesario porque el número de tecnologías del stack llega de forma asíncrona desde `portfolio-service` y al montar el Hero todavía vale 0. `StatCounter` pasa el prop como `toRef(props, 'end')` (no `props.end` a secas) precisamente para que ese valor pueda seguir cambiando después del montaje.

### `useScrollReveal` — la entrada compartida por todas las secciones

Cada sección (`About`, `Projects`, `Stack`, `Experience`, `Contact`) llama a `useScrollReveal(sectionEl)` sobre su elemento raíz: `gsap.from(el, { opacity: 0, y: 40, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' } })`. Es la única animación de entrada "genérica"; el resto de efectos (imagen que hace scale, hover de proyectos, contadores) son adicionales y específicos de cada sección.

### `SectionLabel.vue` — etiqueta "scroll-cycle"

La pequeña etiqueta roja antes de cada `<h2>` ("PROYECTOS", "STACK", "SOBRE MÍ", "EXPERIENCIA") apila 6 copias del texto (`repeat`, `top: i*3px`) detrás de una copia siempre visible (`.section-label-live`). Un `gsap.timeline({ scrollTrigger: { trigger: triggerEl, scrub: 1 } })` barre un highlight de opacidad/escala por las copias de fondo según el progreso de scroll **de toda la sección** (por eso recibe `trigger-el`, el `ref` de la sección padre, no mide su propio tamaño). Es un detalle de fondo a propósito: la copia "live" nunca deja de leerse bien.

### Proyectos: hover-reveal con overlay rojo (`ProjectsSection.vue`)

La imagen y su overlay rojo (`.project-preview-image` + `.project-preview-overlay`) están dentro de un único `.project-preview-frame`, y es ese contenedor el que anima GSAP (`gsap.to(frame, { opacity: 1, scale: 1, duration: 0.3 })` al entrar, `opacity: 0, scale: 0.92` al salir) — nunca la imagen sola. Si se animasen por separado podrían desincronizarse o (como pasó durante el desarrollo) el overlay quedarse visible permanentemente al no tener ninguna animación propia. El filtro `grayscale(1) brightness(0.75)` en la imagen + el overlay rojo al 13% de opacidad son lo que da el efecto "en blanco y negro con tinte rojo" pedido.

### "Sobre mí": frase gigante de fondo (`HugePhrase.vue`)

"DESARROLLANDO DESDE 2024" en Anton, gigante (`clamp(4.5rem, 19vw, 15rem)`), en rojo (`var(--red)`) al 14% de opacidad, `position: absolute` centrada y con `white-space: nowrap`. Ojo: a baja opacidad sobre el fondo casi blanco de la sección, el rojo se mezcla ópticamente hacia blanco y puede leerse rosado — si se vuelve a bajar la opacidad, es un efecto óptico del blending, no un color equivocado (confirmado con el token real: `getComputedStyle` da `rgb(200, 16, 46)`, exactamente `var(--red)`) — sangra fuera del contenedor a propósito (`.about-section` no tiene `overflow: hidden`; el único límite es el `overflow-x: hidden` global de `.site-shell`, que evita que aparezca una scrollbar horizontal). El texto de la bio va en `.about-grid`, con `z-index: 1` para quedar por encima. Es el mismo patrón que `SectionLabel.vue` (un `gsap.fromTo` con `scrollTrigger: { trigger: triggerEl, scrub: 1 }` atado al recorrido de la sección, no al del propio elemento) pero moviendo `xPercent` en vez de barrer opacidades — de ahí que sea un componente aparte y no una opción de `SectionLabel`.

### Navegación flotante (`FloatingNav.vue`)

Píldora `position: fixed` en el borde derecho (`right: 24px; top: 50%`), con los 3 links de sección y un botón circular de acento rojo que siempre lleva a contacto. Dos cosas a tener en cuenta:

- **Aparece con un `gsap.from` cuyo `scrollTrigger.trigger` es `'.hero'`** (selector de cadena, no un `ref`, porque `FloatingNav` no tiene acceso al `ref` interno de `HeroSection`) con `start: 'bottom top'`: solo se anima al terminar de pasar el hero, y con `toggleActions: 'play none none reverse'` se oculta otra vez si el visitante vuelve a subir.
- **Los clicks no usan `scrollIntoView` ni anchors nativos**: llaman a `getLenis()?.scrollTo(target, { offset: -20 })`, la nueva función exportada por `useLenis.ts` (guarda la instancia de Lenis en una variable de módulo la primera vez que se monta `App.vue`). Sin esto, el salto de scroll sería instantáneo y desincronizaría a Lenis de la posición real, exactamente el mismo problema que ya afecta a `element.scrollIntoView()` — ver la nota sobre Lenis más arriba.

En móvil (`≤760px`) los 3 links de texto se ocultan por CSS y solo queda el botón de contacto, para no ocupar media pantalla con un panel vertical.

### Rendimiento

Todas las animaciones anteriores mueven `opacity`/`transform` (`x`, `y`, `scale`) exclusivamente — nunca `top`/`left`/`width`/`height` — para que el navegador las resuelva en el compositor sin recalcular layout. Las imágenes están comprimidas a WebP (~15–90 KB cada una, ~330 KB en total) para no penalizar el scroll con parallax por descargas ni decodificaciones grandes.

## Dónde tocar qué

| Quiero cambiar... | Toco... |
|---|---|
| Colores (negro/blanco/rojo) | Variables `--bg`/`--fg`/`--red`/`--muted`/`--line` en `style.css` (`:root` y `.section--light`) |
| Velocidad del smooth scroll | `duration`/`easing` en `useLenis.ts` |
| Velocidad/stagger de las letras del hero | `stagger`/`duration`/`ease` del `gsap.from(split.chars, ...)` en `HeroSection.vue` |
| Cuándo entra una sección al hacer scroll | `start` (por defecto `'top 80%'`) en `useScrollReveal.ts`, o por llamada si se le pasa `{ start: ... }` |
| Duración de los contadores | `duration` en `useCounter.ts` (por defecto 1.8s) |
| Nº de copias / velocidad del "scroll-cycle" de las etiquetas | `repeat` (prop) y el `scrub` del timeline en `SectionLabel.vue` |
| Intensidad del overlay rojo en las fotos | `opacity` de `.about-media::after` / `.project-preview-overlay` en `style.css` |
| Texto del marquee del hero o del footer | prop `items` de `<Marquee>` en `HeroSection.vue` / `SiteFooter.vue` |
| Velocidad/sentido de la frase gigante de "Sobre mí" | `xPercent` inicial/final del `gsap.fromTo` en `HugePhrase.vue` |
| Opacidad de la frase gigante | `opacity` de `.huge-phrase` en `style.css` |
| Cuándo aparece la navegación flotante | `start`/`trigger` del `scrollTrigger` en `FloatingNav.vue` (por defecto, al pasar el hero) |

## Proyectos y sus imágenes

`ProjectsSection.vue` no tiene una etiqueta ("MEDTECH", "E-COMMERCE"...) en `portfolio-service` — ese campo no existe en el modelo `Project`, así que se resuelve con un diccionario `TAGS` por nombre (con un valor por defecto `"PROYECTO"` para lo que no esté mapeado). El enlace de cada proyecto usa `liveUrl` si existe y si no `repositoryUrl` (así VitSync/PowerSupps enlazan a su web real y el propio Portfolio a su repo).

Para añadir un proyecto nuevo con imagen:

1. Coloca la imagen en `src/assets/projects/` (WebP, ~1200px de ancho, calidad ~0.8 — son solo miniaturas con filtro, no hace falta más).
2. En `portfolio-service`, el `imageUrl` del `Project` debe ser el **nombre de archivo** (`"nuevo-proyecto.webp"`), no una URL completa: `ProjectsSection.vue` lo resuelve con `new URL('../assets/projects/' + imageUrl, import.meta.url)`, el patrón estándar de Vite para assets dinámicos, así Vite lo empaqueta con hash igual en `npm run dev` y en el contenedor de Nginx.

Las 3 fotos personales (hero, "Sobre mí", fondo del CTA de contacto) van en `src/assets/photos/` y se importan directamente por nombre en el componente que las usa — no dependen de datos del backend.

## Sección de contacto

Sigue exactamente la misma lógica que antes del rediseño (`useContactForm.ts`, sin cambios): `POST /api/contact` a `contact-service`, `202 Accepted` como éxito con formulario limpio, detalle de los errores `400` de validación, sin borrar lo escrito si algo falla. Solo cambia el estilo: sin caja ni bordes, un titular tipográfico enorme ("Hablemos / de tu / próximo / *proyecto*.") con los inputs *underline* integrados justo debajo.

## Desarrollo local

```bash
npm install
npm run dev
```

El proxy de Vite (`vite.config.ts`) enruta `/api/contact` a `contact-service` (puerto 8082) y el resto de `/api` a `portfolio-service` (puerto 8081); en producción (Docker) lo hace Nginx (`nginx.conf`). Necesitas el backend levantado (`docker compose up -d`) para ver contenido real.

## Tests end-to-end (Playwright)

```bash
npx playwright install chromium   # solo la primera vez
npm run test:e2e
```

`e2e/contact-form.spec.ts` cubre dos cosas: el flujo del formulario de contacto (sin cambios de lógica) y las animaciones nuevas — que `SplitText` realmente divida el nombre en caracteres, que los 4 contadores lleguen a su valor final (incluido el que depende del fetch asíncrono), y que el hover de un proyecto lleve la opacidad del `.project-preview-frame` hasta `1` (no solo que el elemento exista en el DOM). `e2e/navigation.spec.ts` cubre la navegación flotante: que está oculta (`opacity: 0`) sobre el hero, que aparece al pasar de sección, y que sus dos tipos de link (los 3 de texto y el botón de acento) navegan a la sección correcta. Todos los tests navegan con `page.goto('/')` y esperan explícitamente a que `.hero-name` sea visible antes de interactuar, para no pillar la página a mitad de la animación de entrada en un runner de CI lento; los de navegación además hacen scroll con `page.mouse.wheel(...)` en vez de `scrollIntoView`/anchors nativos, porque Lenis intercepta el scroll nativo (ver la nota en la sección de Lenis más arriba) y un salto instantáneo no dispararía el `ScrollTrigger` de la misma forma que un scroll real.

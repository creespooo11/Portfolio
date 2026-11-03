# DESIGN.md — Portfolio de Javier Crespo Moll

Este archivo recoge decisiones de diseño ya tomadas por el autor. Si una regla
genérica (antislop u otra) choca con algo de aquí, prevalece este documento.

## Para qué sirve la web

Portfolio profesional con el que Javier se presenta a empresas que contratan
desarrolladores web fullstack junior. Quien lo abra debe ver en pocos segundos
quién es, qué stack usa y qué ha construido de verdad, con un diseño
memorable que no parezca una plantilla.

Público: reclutadores y responsables técnicos (España, sector web y software).

## Dirección visual

- Paleta cerrada: negro, blanco roto, gris y rojo.
- El rojo es el único acento. Nunca es el fondo de una sección entera: solo
  texto de énfasis, cifras, botones y overlays sobre imagen.
- Las secciones alternan fondo oscuro y claro para dar ritmo. Oscuras: intro,
  proyectos, experiencia y contacto. Claras: "Sobre mí" y "Stack".
- Los valores exactos de color y tipografía están en `frontend/src/style.css`.
  Esa es la fuente de verdad; no definir colores nuevos.
- Tipografía: titulares en Anton (gigantes y condensados), acento en serif
  cursiva roja en los títulos de sección, etiquetas y datos en monoespaciada
  (DM Mono) y texto corrido en Space Grotesk. Excepción: la portada (intro
  3D) usa solo Space Grotesk en sus textos pequeños, en minúsculas normales y
  más grande; Javier no quiere la monoespaciada en mayúsculas ahí.
- Las fotos de Javier van siempre tratadas en blanco y negro con un tinte rojo
  sutil, nunca a color.

## Movimiento

Se hace con GSAP (ScrollTrigger) y Lenis para el scroll suave. No sustituir
por animaciones CSS caseras lo que GSAP ya resuelve.

Elementos que se mantienen y por qué:

- Lista de proyectos con imagen que aparece al pasar el ratón (referencia:
  Liam Bennett): enseña la captura sin ocupar espacio fijo.
- Frase gigante de fondo en "Sobre mí" que se desplaza en horizontal con el
  scroll (referencia: cipharvin.ro).
- Panel de navegación flotante a la derecha, visible solo después de la intro.
- Marquee con el nombre en el footer.
- Intro 3D a pantalla completa como portada (three.js): las iniciales JC
  hechas de bloques de piedra oscura que vuelan y se encajan al cargar, con
  un núcleo rojo que brilla solo por las juntas. HUD con etiquetas del stack
  real, textos de esquina que se "descifran" y contador de bloques. Al hacer
  scroll los bloques se separan y la cámara entra hasta llegar a "Sobre mí".
  El nombre completo es el h1 de la página y nunca se anima.
- La portada sustituye al antiguo hero (nombre gigante, teselas con fotos,
  contadores, botones y barra superior): se quitó por decisión de Javier.

## Fluidez

La web tiene que ir muy fluida; es un requisito, no un extra.

- Nada que se mueva en cada frame pasa por la reactividad de Vue: se escribe
  directamente en el DOM (transform, atributos SVG, variables CSS) o con
  gsap.quickTo.
- Los bucles de animación se paran cuando su elemento no está en pantalla y
  usan el tiempo real entre frames (iguales a 60, 120 o 144 Hz).
- Sin backdrop-filter en elementos fijos.
- La escena 3D compila sus shaders antes de moverse y baja calidad sola si el
  equipo no llega a ~50 fps.

## Contenido

- Solo datos reales. Cifras actuales: 2 prácticas profesionales (Sweet Code
  Chef 2025, Ryofit 2026), 3 proyectos (VitSync, PowerSupps y este portfolio),
  en el sector desde 2024 y 9 tecnologías en el stack (Java, Spring Boot,
  JavaScript, Vue.js, PostgreSQL, MongoDB, Docker, Kafka, n8n).
- No inventar cifras, clientes, testimonios ni logros.
- Nombre completo: Javier Crespo Moll.
- Idioma: español. Tono directo, sin frases de relleno.

## Decisiones deliberadas que pueden parecer "de plantilla"

No eliminarlas por norma genérica; son elección del autor a partir de sus
referencias:

- Etiquetas pequeñas en mayúsculas y monoespaciada.
- Reloj y ubicación tipo "sistema" en la portada y el footer.
- Una palabra en rojo cursiva en los títulos de sección ("Sobre mí.").
- Fondo casi negro con un único acento rojo.

## Pendiente de definir

- Retoques de diseño que Javier quiere hacer cuando el estado actual esté
  cerrado.

## Referencias

- Eric Cole (plantilla Framer): hero tipográfico enorme y estética de sistema.
- Liam Bennett (plantilla Framer): imagen que aparece al pasar el ratón por la
  lista de proyectos.
- igloo.inc: mecánica de la intro (objeto 3D hecho de bloques que se
  ensamblan, juntas iluminadas, HUD numerado, textos de esquina tipo sistema).
  Se toma la mecánica, no su iglú, su paisaje ni su marca.
- cipharvin.ro: reveals con scroll, frase gigante de fondo, alternancia de
  secciones oscuras y claras, contadores.
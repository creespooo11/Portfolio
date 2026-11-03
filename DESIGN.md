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
  texto de énfasis, botones y las piezas que brillan en las figuras 3D.
- Toda la web es un mismo espacio oscuro en 3D (referencia: igloo.inc): ya
  no hay secciones claras. Cada sección es una escena con su propia figura y
  su texto como panel HUD encima.
- Los valores exactos de color y tipografía están en `frontend/src/style.css`.
  Esa es la fuente de verdad; no definir colores nuevos.
- Tipografía: titulares en Anton (gigantes y condensados), acento en serif
  cursiva roja en los títulos de sección, etiquetas y datos en monoespaciada
  (DM Mono) y texto corrido en Space Grotesk. Excepción: la portada (intro
  3D) usa solo Space Grotesk en sus textos pequeños, en minúsculas normales y
  más grande; Javier no quiere la monoespaciada en mayúsculas ahí. Los
  paneles HUD de las secciones siguen esa misma línea.
- Sin fotos: Javier prefiere figuras 3D. No todas tienen que ser bloques
  negros con núcleo rojo como la portada; cada sección lleva su diseño.

## Escenas 3D (frontend/src/world)

Un único canvas fijo detrás de toda la página; cada sección registra su
escena y solo se dibuja la que está en el centro de la pantalla. Entre
escenas se pasa por negro.

- Portada: iniciales JC de bloques de piedra con núcleo rojo (ver Movimiento).
- Sobre mí: esfera de cubitos que respira, con dos órbitas (una roja).
- Proyectos: una figura por proyecto sobre un anillo rojo, una detrás de
  otra en profundidad, con una retícula de puntos al fondo: VitSync = doble hélice (salud), PowerSupps = remolino de
  cápsulas (suplementos), Portfolio = red geodésica con pulsos (microservicios).
  Un proyecto nuevo sin figura propia usa un nudo en alambre.
- Stack: giroscopio. Anillo metálico con un nodo por tecnología (con su
  etiqueta) y anillos interiores girando en distintos ejes; la cámara lo
  atraviesa al hacer scroll.
- Formación (antes "Experiencia"; son estudios y títulos): un libro abierto
  que pasa páginas solo, con cinta roja y un birrete flotando encima, a lo
  largo de una línea de luz roja. Sin placas con texto grabado (no gustó).
- Contacto: el JC se vuelve a montar junto al formulario.

## Movimiento

Se hace con GSAP (ScrollTrigger) y Lenis para el scroll suave. No sustituir
por animaciones CSS caseras lo que GSAP ya resuelve.

Elementos que se mantienen y por qué:

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

- Solo una escena 3D se dibuja a la vez; todas las luces son compartidas y
  siempre están en la escena (añadir o quitar luces recompila shaders).
- Cada escena se compila y se "calienta" (un render oculto) para que entrar
  en ella por primera vez no dé un tirón, pero solo cuando ha terminado la
  animación de entrada y en huecos libres del navegador: hacerlo durante la
  entrada la hacía saltar.
- Al recargar se empieza siempre arriba (salvo enlace a una sección), para
  que siempre se vea la entrada.
- En escritorio el texto de cada sección no se desplaza: está fijo y se
  funde según la "presencia" de su escena, y en el cambio de sección la
  cámara vuela (llega desde atrás, sale hacia delante). Nada de páginas
  deslizándose entre escenas. En móvil el texto fluye normal.
- El progreso de scroll que reciben las escenas va suavizado en el motor.
- Entradas a cada escena: un único movimiento, el vuelo corto de cámara del
  motor. Las escenas no añaden zooms ni desplazamientos propios ligados a la
  presencia (sumados, la figura aparecía diminuta y oscura y tardaba en
  verse). El brillo sube rápido y el negro entre escenas dura un instante.
- Ninguna escena termina mirando al vacío: el final de cada una todavía
  enseña su figura, y es el vuelo de salida el que la atraviesa.
- Como en la portada, en todas las escenas cada píxel de scroll mueve la
  cámara: nada de tramos en los que no pasa nada ni cámaras que se paran y
  arrancan. Proyectos van uno detrás de otro en profundidad y la cámara
  vuela hacia delante (la siguiente figura siempre se ve al fondo).
- Todas las escenas cuestan lo mismo que la portada (~0,3 ms de CPU,
  20-40 draw calls, ~10k triángulos): si algo se nota a tirones, mirar
  antes el movimiento de cámara que el coste de render.
- Piezas repetidas siempre con InstancedMesh; nada de cristal transparente
  (MeshPhysicalMaterial con transmisión) ni texturas de fotos.
- Medido en Brave recorriendo toda la web: 2,8 ms de media por frame, ningún
  frame por encima de 20 ms.

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
- igloo.inc: mecánica de la intro (objeto 3D hecho de bloques que se
  ensamblan, juntas iluminadas, HUD numerado, textos de esquina tipo sistema).
  Se toma la mecánica, no su iglú, su paisaje ni su marca.
- cipharvin.ro: reveals con scroll, frase gigante de fondo, alternancia de
  secciones oscuras y claras, contadores.
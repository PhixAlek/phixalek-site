# Contenido — fase 1

Rama: AS-arquitectura-contenido-2026-09-28, basada en las correcciones de UX anteriores. No presupone que esa rama ya esté integrada en dev.

## Dónde editar

- `src/data/content.json`: contenido editorial actual, conservado sin reescritura de voz. IDs y publication identifican los proyectos de la versión anterior.
- `src/content/locales/en.json`: textos actuales de navegación, formularios, acciones y agenda. Se extrajeron sin traducir ni cambiar promesas.
- `src/content/locales/es.json`: borrador de traducción. No se publica ni se mezcla parcialmente con inglés.
- `src/content/sections.json`: estructura futura de Experience, Work y Writing. Flowly tiene un borrador con .NET 10 declarado por el propietario, pendiente de inspección del repo. No se muestra todavía.
- `src/content/index.js`: adaptador único consumido por componentes; filtra proyectos no publicados y acciones inválidas. No importa borradores al bundle del navegador.
- `src/content/model.js`: tipos JSDoc, contratos, validación y helpers independientes del DOM.

`publication` controla visibilidad editorial: draft/published. `status` describe madurez del proyecto: planned/in-progress/released. Son conceptos distintos. Un proyecto en desarrollo puede publicarse cuando su descripción esté lista.

Una acción es `kind: link` con destino HTTPS o ancla existente, o `kind: booking` sin URL. Las acciones sin destino y los enlaces javascript se eliminaron del contenido. La agenda sigue usando data-book en el DOM. Las URLs externas restantes tienen estructura válida; esto no certifica que los repositorios sean accesibles o actuales.

Las secciones nuevas no tienen renderizador todavía: sus modelos se preparan ahora y sus interfaces pertenecen a fases posteriores. No añadir enlaces en navegación hasta que exista la sección. No sustituir FinBit por Flowly reutilizando sus afirmaciones, imágenes o tecnologías sin revisar evidencia.

## Idiomas

Inglés sigue siendo el idioma visible. `resolveCatalog` proporciona fallback completo a inglés para idiomas no publicados. La selección automática/manual y actualizaciones sin perder formularios se conectarán en fase 2. El propietario debe completar/revisar traducciones antes de marcar español como publicado. Las plantillas mantienen parámetros como `{tz}`, `{date}` y `{duration}`; nunca traducir claves del payload ni reglas de Hermosillo.

## Experiencia y proyectos

Experience admite role, organization, dates, industry, context, technologies, responsibilities, outcomes y links; consultar el tipo Experience. No se inventaron entradas ni métricas. Work prepara overview/problem/role, implementedStack, inProgress/planned, screenshots, decisions, architecture, repository/liveDemo y lessons. Writing prepara proveedor/URL y artículos; la integración RSS pertenece a una fase posterior.

TODOs solo se permiten en borradores. La validación impide publicarlos y comprueba identidad de registros, campos obligatorios, destinos y claves de traducción. No verifica la verdad de afirmaciones: requieren revisión del propietario.

## Comprobaciones

- `npm run validate:content`: valida catálogos y modelos. Se ejecuta automáticamente antes de npm run build.
- `npm test`: contratos de contenido y pruebas existentes de calendario; no usa credenciales ni proveedores reales.

Pendientes editoriales conservados: identidad Miguel/Alejandro y promesas de Consulting. Flowly reemplaza la tarjeta anterior de FinBit con .NET 10 y el repositorio proporcionado por el propietario. El portfolio reemplaza Interactive CV con una descripción de sus integraciones y enlace a ARCHITECTURE.md. Se documentan para el propietario en vez de reescribirlas. Ubicación Hermosillo y eliminación de X ya están aplicadas.

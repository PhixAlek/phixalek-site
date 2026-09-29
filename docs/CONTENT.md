# Contenido — fase 1

Rama: AS-arquitectura-contenido-2026-09-28, basada en las correcciones de UX anteriores. No presupone que esa rama ya esté integrada en dev.

## Dónde editar

- `src/data/content.json`: contenido editorial actual, conservado sin reescritura de voz. IDs y publication identifican los proyectos de la versión anterior.
- `src/content/locales/en.json`: textos actuales de navegación, formularios, acciones y agenda. Se extrajeron sin traducir ni cambiar promesas.
- `src/content/locales/es.json`: mensajes de interfaz en español.
- `src/content/sections.json`: estructura futura de Experience, Work y Writing. Flowly tiene un borrador con .NET 10 declarado por el propietario, pendiente de inspección del repo. No se muestra todavía.
- `src/content/index.js`: adaptador único consumido por componentes; filtra proyectos no publicados y acciones inválidas. Los borradores de secciones futuras permanecen fuera de la interfaz.
- `src/content/model.js`: tipos JSDoc, contratos, validación y helpers independientes del DOM.

`publication` controla visibilidad editorial: draft/published. `status` describe madurez del proyecto: planned/in-progress/released. Son conceptos distintos. Un proyecto en desarrollo puede publicarse cuando su descripción esté lista.

Una acción es `kind: link` con destino HTTPS o ancla existente, o `kind: booking` sin URL. Las acciones sin destino y los enlaces javascript se eliminaron del contenido. La agenda sigue usando data-book en el DOM. Las URLs externas restantes tienen estructura válida; esto no certifica que los repositorios sean accesibles o actuales.

Las secciones nuevas no tienen renderizador todavía: sus modelos se preparan ahora y sus interfaces pertenecen a fases posteriores. No añadir enlaces en navegación hasta que exista la sección. No sustituir FinBit por Flowly reutilizando sus afirmaciones, imágenes o tecnologías sin revisar evidencia.

## Idiomas

`src/data/content.json` conserva el contenido editorial inglés; `src/data/content.es.json` contiene su adaptación al español. `src/content/locales/en.json` y `es.json` contienen mensajes de interfaz, validación y agenda. Ambas versiones están activas. Editar ambas cuando cambie contenido; la validación comprueba la estructura y mantiene iguales rutas, IDs, imágenes y tipos de acción.

Prioridad: elección manual → primer idioma compatible de `navigator.languages` → inglés. No se usa geolocalización. Se guarda la preferencia en sessionStorage (`phixalek-language`); si está bloqueado, la selección funciona durante la sesión. `document.lang` se actualiza sin recargar. La elección dura durante la sesión de la pestaña, incluidas las recargas. Una pestaña nueva vuelve a detectar el idioma del navegador. Restaurar una pestaña cerrada puede restaurar también su sesión, según el navegador. Las preferencias antiguas de localStorage ya no se leen.

El control muestra solo el idioma de destino (Es o En) a la derecha de Contact en escritorio y al pie del menú móvil. Solo el footer móvil muestra ambos idiomas, con el activo primero y en negrita (En / es o Es / en), antes del copyright. Se actualizan textos y atributos sobre los mismos nodos: no se reconstruyen formularios, no se reinicia la agenda, no se duplican listeners ni animaciones. La API y America/Hermosillo no dependen del idioma.

La traducción adapta los textos existentes por petición del propietario. No añade experiencia ni cambia las afirmaciones profesionales pendientes de revisión. Esto no implementa URLs localizadas ni SEO bilingüe por rutas.

## Experiencia y proyectos

Experience admite role, organization, dates, industry, context, technologies, responsibilities, outcomes y links; consultar el tipo Experience. No se inventaron entradas ni métricas. Work prepara overview/problem/role, implementedStack, inProgress/planned, screenshots, decisions, architecture, repository/liveDemo y lessons. Writing prepara proveedor/URL y artículos; la integración RSS pertenece a una fase posterior.

TODOs solo se permiten en borradores. La validación impide publicarlos y comprueba identidad de registros, campos obligatorios, destinos y claves de traducción. No verifica la verdad de afirmaciones: requieren revisión del propietario.

## Comprobaciones

- `npm run validate:content`: valida catálogos y modelos. Se ejecuta automáticamente antes de npm run build.
- `npm test`: contratos de contenido y pruebas existentes de calendario; no usa credenciales ni proveedores reales.

Pendientes editoriales conservados: identidad Miguel/Alejandro y promesas de Consulting. Flowly reemplaza la tarjeta anterior de FinBit con .NET 10 y el repositorio proporcionado por el propietario. El portfolio reemplaza Interactive CV con una descripción de sus integraciones y enlace a ARCHITECTURE.md. Se documentan para el propietario en vez de reescribirlas. Ubicación Hermosillo y eliminación de X ya están aplicadas.

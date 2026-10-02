# PhixAlek v2 — auditoría y plan incremental

Fecha: 2026-09-26. Estado: planificación; no implementación de v2.

Este informe sustituye la secuencia de PORTFOLIO-PLAN.md donde contradiga el nuevo brief. Freelance y empleo conservan el mismo peso, mediante una interfaz común. Se mantienen las dos intenciones del hero: contactar y evaluar trabajo. El propietario escribe los textos finales. Marca visual, animaciones y Breakout quedan para fases posteriores.

## A. Arquitectura actual

- Aplicación cliente en JavaScript ES modules, sin framework ni router. Webpack monta `src/js/index.js` sobre `#app` de `public/index.html`. `src/index.html` no es la plantilla configurada.
- Bootstrap construye Header, Main y Footer; después monta fondo, booking y EmailJS. Main contiene Hero, About, Projects y Contact. Experience y Writing todavía no existen.
- Navegación vertical por #home, #about, #work y #contact; #home pertenece al main. No hay páginas de proyecto ni rutas profundas configuradas; el fallback SPA de producción está comentado.
- `src/data/content.json` alimenta las secciones. Navegación, acciones, mensajes de estado y gran parte del calendario siguen escritos en componentes. `images.json` y el registro de imágenes existen, aunque Projects ya no los consume.
- CSS global con variables de colores, tipografía y contenedores, más hojas de orbes, rueda horaria y trabajo. Hay valores locales y estilos inline. Los componentes ya usan medidas fluidas y varios breakpoints; la estructura permite refactor gradual.
- Frontend → Netlify freebusy/create-event → handlers con dependencias inyectadas → Google Calendar. Política compartida entre cliente y servidor, validación de disponibilidad y revalidación al crear.
- Contacto envía directamente desde cliente mediante EmailJS. Webpack incorpora tres identificadores públicos configurados; las credenciales de Google pertenecen al servidor.
- Netlify Dev sirve web y funciones por 8888; 5173 solo sirve Webpack. Node está fijado mediante .nvmrc/engines y guardas de desarrollo. No hay workflow .github ni script test en package.json.
- No se encontró infraestructura de traducciones ni analítica propia en el bootstrap revisado. Las llamadas a terceros existentes son las integraciones funcionales.

## B. Qué conservar

Conservar navegación vertical, header discreto, hero con identidad PhixAlek y dos acciones, footer, módulos pequeños, JSON editable y tokens existentes. Mantener los contratos de Calendar, política de Hermosillo, rueda horaria, estados de carga/error, cancelación de solicitudes obsoletas, control de doble envío y pruebas. Mantener EmailJS mientras no aparezca una razón funcional para sustituirlo.

El repositorio actual también incluye cambios locales recientes de Projects/Contact: son una base provisional, no contenido final aprobado ni una versión ya desplegada. No revertirlos masivamente ni publicarlos sin revisar el diff.

## C. Problemas encontrados

| Prioridad | Evidencia | Consecuencia / acción propuesta |
| --- | --- | --- |
| Alta | Header oculta drawer por transform y aria-hidden, sin inert/hidden ni gestión de foco | Sus controles pueden seguir en el recorrido Tab. Corregir apertura/cierre, Escape, foco y cambio a escritorio |
| Alta | public/index.html tiene lang=es; contenido visible en inglés | Idioma incorrecto para asistencia. Corregir junto con localización central |
| Alta | diag devuelve calendarId/resultados/errores; debug-env muestra metadatos de entorno; secrets scan desactivado | Revisar y retirar diagnóstico público antes del próximo despliegue. No implica que se hayan publicado claves; no se consultaron secretos ni endpoints reales |
| Media | Main vuelve a envolver secciones que ya incluyen .container | Padding y límites de anchura duplicados. Definir un único propietario del contenedor y comparar visualmente |
| Media | Marca y hero son h1 | Reservar h1 para el contenido principal, marca como enlace |
| Media | About indica Miguel Segura/Colombia/Bogotá; brief indica Alejandro Segura | Discrepancia editorial, no corregir por inferencia. Zona de citas no determina residencia |
| Media | JSON dice Flowy y brief dice Flowly; Interactive CV no representa el nuevo alcance | Usar Flowly como objetivo del brief; confirmar datos con repo. Project Beta sin evidencia aún |
| Media | Hero repite “Building”; About promete sistemas escalables/mantenibles sin evidencia vinculada | Marcar para revisión del autor, conservar hasta su sustitución. No generar copy final |
| Media | Formularios dependen visualmente de placeholders aunque tienen aria-label | Añadir labels persistentes, instrucciones y errores asociados |
| Media | Textos y navegación repartidos entre JSON y JS | Dificulta traducción y coherencia. Extraer mensajes sin alterar comportamiento |
| Media | About transforma marcado mediante innerHTML sin escapar | Mantener contenido local confiable; no reutilizar para RSS externo. Preferir renderizador limitado que escape texto |
| Media | Orbes usan RAF y ResizeObserver sin limpieza; CSS de fondo duplicado | Preparar desmontaje antes de rerender por idioma. Revisar duplicados y retirar movimiento decorativo en fase correspondiente |
| Media | Sin descripción/Open Graph en plantilla; contenido principal generado por JS | Planificar metadatos y HTML por idioma/ruta antes de prometer SEO localizado |
| Baja | Imágenes antiguas copiadas al dist aunque ya no aparecen en Work | Aumentan artefacto de despliegue; no confundir con descargas iniciales. Retirar solo tras comprobar referencias |

Responsive: revisión de código confirma estilos móviles y grids adaptables; la revisión anterior a este brief comprobó 390 px sin overflow horizontal y apertura del calendario. Esta auditoría no certifica todos los dispositivos, contraste, lectores de pantalla ni Core Web Vitals. No se hicieron nuevas pruebas visuales en este turno.

Calendar: crear evento no equivale a enviar invitación. `events.insert` no incluye attendees ni sendUpdates; el correo queda en description. Tampoco hay reserva atómica ni idempotencia persistente entre verificación e inserción. Mantener estos límites documentados; resolverlos en tareas separadas si se requiere esa garantía. `_auth.js` y `_google-common.js` ofrecen rutas distintas de autenticación; confirmar referencias antes de consolidar. No hay protección de cuota/rate limit explícita en los handlers revisados.

## D. Arquitectura de información

Header → Home → About breve → Experience → Work → Writing → Contact → Footer.

Home conserva “Hello, I'm PhixAlek” y dos acciones. About no se expande como autobiografía. Experience muestra evidencia seleccionada, no el CV completo. Work prioriza Flowly; Consulting puede permanecer como bloque conciso de capacidades/contacto, sin una nueva sección comercial obligatoria. Writing conecta la publicación con el sitio. Footer aloja redes secundarias; YouTube y game dev no compiten con experiencia de software.

Navegación solo hacia secciones con contenido listo. Experience/Writing pueden existir en el modelo y permanecer ocultas hasta disponer de material. CV, repositorios y redes solo muestran acciones con destino válido. No publicar TODOs al visitante.

Profundidad opcional: `/work/flowly/` y `/about-this-site/`, cuando aporten evidencia. Implementar páginas estáticas generadas con entrada directa y metadatos propios; no introducir router SPA solo para dos páginas. El detalle técnico permanece fuera del recorrido obligatorio.

## E. Impacto en componentes

| Tratamiento | Componentes |
| --- | --- |
| Conservar contratos y lógica | booking-policy, handlers de Calendar, wrappers, time-wheel, adaptador EmailJS |
| Refactorizar gradualmente | Header (accesibilidad/nav central), Main (contenedor), Hero (solo contenido/configuración), About (render seguro), Projects (modelo Flowly), Contact (labels/idiomas), Footer (enlaces configurables) |
| Crear según fase | Experience, Writing, selector de idioma, catálogo de mensajes, plantilla de caso de estudio, utilidades pequeñas para enlaces y evidencia |
| Retirar tras comprobar usos | Diagnósticos públicos, CSS/registros/assets obsoletos, plantilla HTML sin uso; sin borrado masivo |
| Posponer | Identidad visual final, Breakout, CMS, nueva infraestructura de contacto, migración de framework |

La web no usa Angular actualmente. About-this-site debe describir JavaScript/Webpack, aunque Angular forme parte de experiencia o Flowly si el repo lo confirma.

## F. Evolución del contenido/JSON

Extender el modelo con un adaptador compatible, evitando una sustitución de todos los imports en una sola PR. Definir modelos con JSDoc y validación de datos; no hace falta migrar a TypeScript para ello.

- Datos compartidos: identity, links, project IDs/slugs, tecnologías verificadas, fechas, URLs, estado de publicación.
- Catálogos en/es: navigation, home, about, experience, work, writing, contact, footer, booking y mensajes de validación.
- Experience: id, role, organization, dates, industry, context, technologies, responsibilities, outcomes, evidence, links opcionales. Métricas solo con fuente/contexto reales.
- Work: id, slug, status, overview, problem, role, implementedStack, screenshots con alt/dimensiones, decisions, architecture, repository?, liveDemo?, lessons?, stage. Separar implemented/inProgress/planned cuando haga falta.
- Writing: configuración de proveedor y URL; artículos normalizados automáticamente, no lista editorial codificada a mano.
- Elementos sin contenido: draft/TODO para edición, excluidos de render y navegación pública. Validar claves, estados y destinos. No crear botones deshabilitados como promesas.

El propietario entrega textos y traducciones finales. El trabajo de Codex es preparar campos, señalar inconsistencias y validar estructura. El ejemplo de Clinical Notes y cifras del brief es ilustrativo, no evidencia autorizada para publicar.

## G. Localización

Un servicio central resuelve idioma: preferencia manual válida guardada → primer idioma compatible de navigator.languages → fallback inglés. es-* resuelve es; en-* resuelve en. Sin geolocalización. Capturar errores de almacenamiento y permitir funcionar sin persistencia.

Selector visible con nombres English/Español, accesible por teclado. Actualizar document.lang, mensajes, navegación, fechas y metadatos; no traducir claves API ni cambiar la zona America/Hermosillo por idioma del navegador.

Evitar reconstruir toda la aplicación: preservar valores de formulario, foco, selección horaria y requests pendientes. Los montajes requieren actualización o cleanup explícito para no duplicar listeners, modal, RAF u observers. Pruebas específicas de cambio de idioma con formulario abierto y estados de error.

Para SEO localizado real, evaluar salidas estáticas /en/ y /es/ con canonical/hreflang y metadatos por idioma. Una traducción cliente sin URLs distintas no debe venderse como indexación bilingüe resuelta. Resolver estrategia de URLs antes de publicar páginas de proyecto.

## H. Writing/Substack

Fuente oficial consultada: https://support.substack.com/hc/en-us/articles/360038239391-Is-there-an-RSS-feed-for-my-publication — Substack documenta el feed de publicación en /feed.

Recomendación para este stack: obtener RSS en build, normalizar a un pequeño JSON y renderizar sus datos. Evita depender de CORS del feed y de XML/proveedor durante la visita, no necesita backend nuevo ni API privada. Una función con caché solo se justifica si se exige actualización entre despliegues.

Contrato propuesto: id, title, url, publishedAt, excerpt opcional, image opcional y source. Confirmar campos presentes con el feed real antes de implementar; no asumir imágenes/categorías ni acceso a contenido de pago. Tomar título, enlace y metadatos; no republicar artículos completos.

Configuración fija y HTTPS del proveedor; timeout y límite de tamaño, parser sin resolución de entidades externas, enlaces validados y texto escapado. Nunca insertar HTML RSS mediante el renderizador actual de About. Evitar proxy con URL arbitraria.

El archivo generado es la instantánea de cada despliegue. Para conservar una anterior tras fallos debe implementarse almacenamiento/cache explícito; no confiar en memoria de un build nuevo. Primera versión: fallo del feed no bloquea despliegue del portfolio, muestra enlace a la publicación si existe y omite lista no disponible. Sin carga cliente del feed no hace falta spinner; si luego se usa función, definir loading/error/empty y caché antes de activarla.

Actualización inicial ligada a despliegues; documentar refresco manual. No crear automatizaciones sin decidir frecuencia y necesidad. Suscripción inicial mediante enlace a Substack; evaluar embed oficial solo con publicación real, privacidad, tamaño y accesibilidad comprobados. No construir formulario contra endpoints no documentados. Falta URL de la publicación para validar integración concreta.

## I. Accesibilidad y usabilidad

Accesibilidad en cada fase; la auditoría dedicada final no debe posponer defectos conocidos.

- Menú: controles ocultos fuera de Tab, aria-controls/expanded, foco inicial/restaurado, Escape, comportamiento consistente al cruzar breakpoint.
- Skip link, único h1, landmarks y orden de títulos coherentes; anchors con espacio para header.
- Labels visibles, autocomplete, errores asociados mediante aria-describedby, estado sin depender del color. Mantener role=status del contacto/calendario.
- Agenda: conservar teclado, rueda y validación; añadir nombre claro al botón de fecha, revisar aislamiento del fondo y mensajes de confirmación. No cambiar zona ni orden del servidor por UX.
- Foco visible global, contraste medido y objetivos táctiles cómodos; sin interacciones exclusivas de hover.
- Verificar reduced motion también en drawer, no solo orbes. Texto legible a 200% y reflow a anchura equivalente de 320 px.
- Matriz visual 360/390/768/1024/1440, orientación, textos largos en ambos idiomas, teclado y comprobación manual con lector de pantalla. Automatización no sustituye revisión manual.

## J. Secuencia desplegable

Cada entrega: diff acotado → checks → preview → revisión → despliegue independiente. No una rama única de rediseño.

| Fase | Alcance | Criterio de salida |
| --- | --- | --- |
| 0 | Auditoría y baseline; separar saneamiento de diagnóstico/secret scanning en PR previa al siguiente despliegue | Hallazgos documentados y riesgos de publicación resueltos o explícitamente bloqueados |
| 1 | Esquemas, catálogo de contenido, compatibilidad y servicio de idioma | Datos actuales conservados, claves validadas, fallback probado, sin texto final inventado |
| 2 | Header, foco, contenedores, orden/anclas, footer y selector | Navegación y cambio de idioma sin pérdida de datos ni listeners duplicados |
| 3 | Hero mínimo conectado al modelo | Misma identidad y dos intenciones; textos del propietario |
| 4 | Experience y evidencia configurable | Solo entradas verificadas; sección vacía no aparece |
| 5 | Work con prioridad Flowly | Estado real y enlaces opcionales; móvil conciso |
| 6 | Caso Flowly y estrategia de URLs/metadatos | URL directa, recarga, 404 y retorno funcionan; repo revisado |
| 7 | Feed Writing y suscripción externa | Feed real, falla/empty/fallback probados, sin HTML no confiable |
| 8 | Pulido UX de Contact/booking | Pruebas de reglas intactas, estados y traducciones coherentes; integración real en entorno acordado |
| 9 | Auditoría explícita de accesibilidad | Recorrido teclado/lector y problemas priorizados resueltos |
| 10 | Rendimiento | Bundle/assets medidos, recursos innecesarios retirados y baseline documentada |
| 11 | Identidad visual | Tokens refinados con referencias del propietario, regresión visual y contraste |
| 12 | Microinteracciones útiles | Feedback/orientación sin bloquear contenido; reduced motion |
| 13 | Breakout separado y opcional | Carga diferida, salida clara, controles aislados, móvil/fallback y rendimiento validados |

Pipeline a introducir desde las primeras PR: Node fijado, npm ci, pruebas de calendario, validación de contenido/idiomas, build y comprobación de secretos. Añadir tests de comportamiento según cambios; no tests que solo dupliquen texto. Verificar configuración remota antes de afirmar que checks bloquean merges o que previews están activos. PR externas sin secretos de producción. Documentar rollback a último despliegue verificado.

## K. Riesgos y validación

| Riesgo | Prevención / prueba |
| --- | --- |
| Idioma cambia horas o payloads | Instantes y enums invariables; pruebas de Hermosillo en ambos idiomas |
| Rerender borra mensaje/reserva o duplica handlers | Estado separado, cleanup y prueba de cambio de idioma con agenda abierta |
| Refactor rompe Google | Conservar contratos y tests con proveedor simulado; smoke real controlado separado |
| Confundir confirmación con invitación | Documentar ausencia de attendees; diseñar notificaciones como cambio funcional separado |
| Doble reserva por concurrencia o reintento | No prometer atomicidad; tarea específica si se necesita garantía |
| EmailJS aparenta funcionar sin configuración | Mantener fallback mailto; comprobar envío real en entorno acordado, sin correos durante auditoría |
| Nuevas rutas dev funcionan pero producción 404 | Entradas estáticas y prueba directa en deploy preview |
| Remover padding/CSS rompe móvil | Una responsabilidad de layout por PR y comparación de matriz de tamaños |
| Feed indisponible o contenido hostil | Fetch acotado, texto escapado, enlaces seguros y fallback |
| Diagnósticos y assets revelan información | Revisión de artefactos y logs sin imprimir secretos; no publicar herramientas de diagnóstico |
| Publicar TODOs o claims no validados | Estados draft, validación y revisión editorial del propietario |

## Verificación y límites de esta auditoría

Ejecutado: Node 24.18.0, `node --test tests/booking.test.js`: 26/26 pasan. Inspección de fuentes, configuración, estructura y CSS. Build de la fase anterior pasó con advertencias por imágenes grandes; no se repitió aquí porque no se modificó código ejecutable. No se abrieron archivos de credenciales, no se enviaron correos, no se crearon reservas ni se comprobó configuración remota. No hay auditoría completa de dependencias o certificación de seguridad/accesibilidad.

Pendientes de contenido: repo real de Flowly; identidad/nombre profesional y ubicación; experiencia y resultados verificables; URL Substack; textos en/es. No bloquean documentar arquitectura, pero sí publicar esas secciones con afirmaciones finales.

# PhixAlek Writing — análisis funcional y de UX

Fecha: 15 de octubre de 2026. Alcance: blog y sus secciones, desktop, tablet y mobile. **Análisis sin cambios de implementación ni versiones.**

## Alcance y límites de la evidencia

Se siguió el recorrido desde el código de rutas, componentes y estados; se consultó el endpoint local de Substack y la copia guardada; se ejecutó la suite completa: **246 pruebas aprobadas**. Estas pruebas verifican contratos y comportamiento programado, no facilidad de uso con personas.

La primera revisión visual quedó bloqueada por el Mac bloqueado. Después del desbloqueo se completó un recorrido con Brave nativo, capturas y emulación responsive: desktop, iPhone 16 (393 × 852), iPad Mini vertical (768 × 1024) y horizontal (1024 × 768). La sección final distingue lo observado de lo que sigue pendiente. La emulación no sustituye una prueba en dispositivos físicos ni una prueba con usuarios o lectores de pantalla.

Marco de evaluación: utilidad para elegir, leer, orientarse, volver y continuar; claridad del resultado de cada acción; coste de retirar un elemento. Las [heurísticas de Nielsen](https://www.nngroup.com/articles/ten-usability-heuristics/) apoyan evaluar visibilidad del estado, control, reconocimiento, recuperación y reducción de contenido irrelevante. La identidad editorial también aporta valor: que se pueda leer sin un elemento no obliga a eliminarlo.

## Decisiones del propietario después de la auditoría

Estas aclaraciones prevalecen sobre las propuestas de simplificación del informe:

- El borrado de búsqueda al entrar en mobile/tablet vertical es intencional; no se considera un fallo pendiente.
- Los filtros elegidos dentro de «…» conservan su selección dentro del panel; no se pide exponer su nombre fuera.
- El progreso incluye comentarios por decisión editorial.
- Se mantienen los corazones como conteos de Substack y la repetición limitada del feed móvil.
- Se conserva el modal de copiar enlace. Copiar directamente con confirmación es solo una alternativa explicada.
- El carrusel conserva su comportamiento opcional, sin contador 1/3. La pista de swipe se reemplazó, por indicación posterior, por puntos de posición con el activo blanco.
- Los totales de comentarios incluyen respuestas. El desplegable dice Hide replies / Ocultar respuestas cuando está abierto, manteniendo la flecha nativa de cierre. El enlace de continuación distingue lo aún no cargado del total disponible en Substack.
- EN se mantiene en la imagen y se retira de la metadata lateral de lista.
- El filtro de idioma se oculta con un único idioma. Con varios permite desactivar la selección al pulsarla otra vez; con más de dos muestra códigos breves. La importación admite códigos de dos letras, incluidos FR y PT, independientemente del idioma de la interfaz.

## Catálogo observado

El endpoint respondió 200 y entregó:

| Post | Lectura | Idioma | Tags publicados |
| --- | --- | --- | --- |
| A calmer interface starts with fewer decisions | 1 min | EN | Notes, Frontend, Design |
| Build one useful feature at a time | 1 min | EN | Product, Notes, Software |
| Test Post #1 update | 1 min | EN | Notes, Portfolio, Software |

La taxonomía nueva admite Notes, Thoughts y Guides como tipos; ahora solo Notes está publicado. Frontend, Product y Portfolio todavía llegan de Substack como tags antiguos: no son filtros inventados ni un fallo de importación. Antes de decidir qué controles sobran, conviene completar esa transición editorial. No se cambiaron tags remotos ni títulos durante esta revisión.

La copia guardada tiene 0/0 likes/comentarios en los dos primeros y 1/3 en Test Post #1. Este último carga una raíz y dos respuestas. Los contadores son datos importados; no se validaron como tiempo real en Substack.

## Recorrido completo: qué aporta y qué pasa si desaparece

| Sección / elemento | Aporte | Si se elimina | Decisión sugerida |
| --- | --- | --- | --- |
| Header, marca y navegación global | Identidad y salida hacia el resto del sitio | El artículo aún se lee, pero se pierde continuidad y orientación global | Mantener; no añadir acciones nuevas |
| Flecha para volver del artículo | Recuperar el feed y su contexto anterior | Obliga a depender del botón del navegador o de navegación que abre un feed nuevo | Mantener; el destino debe ser claro |
| Atajo invisible de uno/dos toques en mobile | Ahorra swipes a quien ya lo conoce | El flujo sigue gracias a Volver y Volver arriba | Mantener como comodidad opcional; nunca como única ruta |
| Writing + título editorial + subtítulo | Contexto y personalidad | No se rompe la exploración; parte del texto es redundante | Mantener el título; subtítulo prescindible en mobile. Eliminarlo no es una prioridad |
| Featured | Sugiere un punto de inicio | El usuario puede elegir en el feed, pero desaparece la curaduría | Mantener si de verdad se quiere destacar una lectura |
| Etiqueta Featured | Explica la diferencia con el feed | La imagen grande todavía jerarquiza, pero el motivo queda menos explícito | Mantener una sola identificación, sin duplicarla en texto e imagen |
| Tipos Notes / Thoughts / Guides | Explicar qué clase de lectura es y filtrar | Se puede explorar por tema, con menos contexto editorial | Mantener tipos publicados; no crear opciones vacías |
| Temas / tags clicables del feed | Encontrar contenido afín | Se conserva la lectura, se pierde un atajo de descubrimiento | Mantener pocos visibles; evitar categorías sin criterio editorial |
| Panel de tres puntos | Dar acceso al resto sin llenar el encabezado | Algunos temas e idiomas dejan de ser accesibles | Mantener cuando haya opciones adicionales |
| Selector de idioma del contenido | Elegir publicaciones que se pueden leer | Con el catálogo actual no se pierde elección: todo es EN | Ocultarlo hasta que existan al menos dos idiomas publicados es razonable. La insignia EN sí sigue aportando |
| Selector de idioma de la interfaz | Leer menús y ayudas en ES/EN | Se pierde localización del sitio, aunque los artículos no se traduzcan | Mantener; distinguirlo del idioma del post |
| Búsqueda desktop | Localizar por palabras | Con tres publicaciones el recorrido sigue claro; con un archivo grande costará más | Opcional hoy; conservar la capacidad para cuando haga falta |
| List / Grid desktop | Lectura comparativa frente a exploración visual | Una vista única también permite leer | Mantener por su utilidad y preferencia personal; no añadirlo a mobile |
| Título de la tarjeta | Permitir elegir antes de abrir | Se vuelve muy difícil saber qué abrir | Esencial; no sacrificar información solo por imponer dos líneas |
| Descripción en lista | Comparar de qué trata cada post | El título y los tags todavía funcionan, pero puede bajar la precisión de la elección | Mantener breve en lista; no reintroducirla automáticamente en grid/mobile |
| Fecha, lectura e idioma | Vigencia, esfuerzo e idioma esperado | El flujo se entiende, pero faltan algunas expectativas | Idioma y fecha son útiles; 1 min repetido en todas las cards aporta poco a la comparación actual |
| Read article en lista desktop | Hacer evidente la acción principal | La tarjeta completa sigue abriendo el post | Prescindible funcionalmente, pero es una ayuda visible razonable en desktop |
| Likes y comentarios 0 en cada card | Acceso a conversación y señales sociales | La lectura y el descubrimiento siguen completos | Son candidatos a simplificación antes que título o tags. El corazón del feed merece especial revisión |
| Share | Distribuir un artículo | Se pierde una utilidad real de salida, no la lectura | Mantener. Su modal es opcional mientras solo exista copiar enlace |
| Repetición del feed mobile | Prolongar el gesto de scroll | Se pueden leer todos los posts igualmente | Prioridad alta para reconsiderar con el catálogo actual |
| Portada del lector | Identidad, entrada visual y contexto | El texto sigue siendo legible | Mantener; la portada informativa debería poder verse sin perder detalles |
| Autor y rol | Atribución y contexto profesional | Se entiende el artículo; el rol es más prescindible que el autor | Mantener autor. Rol opcional en un blog de autor único |
| Índice de secciones | Saltar y orientarse en contenido largo | En posts cortos se sigue leyendo sin fricción | Mostrar según longitud/estructura útil, no solo por existir encabezados |
| Progreso de lectura | Orientación aproximada | El scroll y los encabezados siguen guiando | Opcional en un minuto; si se mantiene, medir el texto y no comentarios |
| Aviso de comentarios en Substack | Evitar creer que se comenta localmente y explicar posible login | Puede sorprender el cambio de plataforma | Mantener una explicación breve |
| Tarjeta Questions or ideas? + icono | Dar presencia al botón de comentar | Un botón contextual sigue cumpliendo la misma función | Simplificar el contenedor antes que quitar la acción |
| Latest comments + respuestas | Ofrecer conversación real antes de salir | La acción Comentar sigue funcionando, pero se pierde contexto | Mantener si existen datos; plegar respuestas es útil |
| More comments | Continuar el hilo externo | Si todo está disponible, no se pierde contenido; si hay más, sí se pierde el acceso directo | Mantener destino, revisar cuándo y con qué cifra se muestra |
| Newsletter al final | Continuidad por correo | Leer sigue funcionando, pero desaparece la conversión principal del autor | Mantener una por página, después del contenido |
| Pantalla de error y rutas de recuperación | Evitar un callejón sin salida | Un enlace fallido deja al usuario sin siguiente paso | Esencial; mejorar precisión del estado |
| Relacionados en recuperación | Volver a contenido disponible | Volver a Writing todavía permite recuperar el recorrido | Mantener pocas recomendaciones |
| Autoplay del carrusel | Revelar otra recomendación sin gesto | El swipe manual sigue funcionando, pero hoy es poco evidente que hay más | Prescindible; un indicador de posición resuelve mejor la falta de visibilidad |
| Footer y Volver arriba | Continuidad del sitio y salida de scroll largo | La lectura funciona; se pierde una ayuda visible de retorno | Mantener compacto, consistente con Home |
| Glass, sombras y ola | Identidad y respuesta visual | No se rompe el flujo | Mantener sutiles, sin ocultar información ni depender del movimiento para descubrir controles |

## Hallazgos funcionales que atendería antes de recortar más diseño

### 1. Responder no conserva el comentario elegido

**Actualización posterior a la auditoría:** corregido por solicitud del propietario. Se conserva Reply/Responder y el aviso de salida. Ahora se utiliza la URL individual de cada respuesta o se obtiene la del comentario principal mediante sus IDs importados de Substack. Los registros antiguos sin URL también funcionan si conservan esos IDs; cuando faltan datos válidos se mantiene la conversación general como respaldo. Validado con comentarios principales, respuestas anidadas, destinos inseguros y restauración de foco al cancelar. Suite completa: 248 pruebas aprobadas.

**Confirmado en código.** `ArticleComments` genera Reply como botón genérico `data-substack-action="comments"`. El controlador resuelve ese tipo de acción a la URL general `/p/slug/comments`, sin utilizar el enlace individual del comentario. En cambio, el like del comentario sí puede usar `comment.sourceUrl`.

El texto promete una respuesta contextual y el destino configurado es una conversación general. Propongo mantener Reply solo si se puede trasladar al comentario/hilo correcto mediante un enlace fiable. Si no, cambiar la promesa a abrir la conversación. No se comprobó la posición final que Substack presenta a un usuario autenticado.

Evidencia: `components/article-comments.js`, `components/substack-interactions.js`.

### 2. El texto de comentarios restantes puede contar respuestas ya cargadas

**Confirmado en la copia actual y el cálculo.** Hay 3 en el contador, 1 comentario raíz y 2 respuestas cargadas. El cálculo es `comments - previews.length`: 3 − 1 = 2. No tiene en cuenta las respuestas ya disponibles en el desplegable.

Por tanto, “2 comentarios más” no demuestra que existan dos entradas nuevas fuera de lo que la página ya permite abrir. Hay que unificar la unidad que se cuenta —raíces, respuestas o ambas— o usar un enlace sin cifra, por ejemplo abrir la conversación en Substack. No inventar una cantidad de contenido pendiente.

Evidencia: `components/article-comments.js:73`, datos `writing-snapshot.json`.

### 3. Una rotación puede borrar la búsqueda

**Confirmado en código.** Cada vez que el layout pasa al formato compacto, `update()` ejecuta `search.value = ''`. La búsqueda no solo se oculta: se elimina y puede cambiar el conjunto de resultados. El usuario no pidió limpiar nada al girar la tablet.

Conservar el estado y decidir cómo representarlo cuando el control no se muestra. No hace falta añadir un buscador grande en mobile para evitar la pérdida silenciosa.

Evidencia: `pages/index-page.js:75`.

### 4. Falta una forma de quitar únicamente el idioma seleccionado

**Confirmado en código.** Al pulsar un idioma se asigna su código incluso si ya estaba seleccionado. El botón All elimina tanto tema como idioma y búsqueda. Se puede salir, pero no desactivar solo EN conservando el tema con una sola acción.

Permitir que tocar el idioma activo lo quite reduce pasos sin añadir otro “All”. Con un único idioma publicado, el selector puede ocultarse por completo hasta que exista una elección real.

Evidencia: `pages/index-page.js:149`.

### 5. La barra de lectura incluye la sección de comentarios

**Confirmado en código.** La barra se calcula con la altura de `story`, y `story` contiene la sección de comentarios. La medida no representa exclusivamente el cuerpo del artículo.

Si se mantiene, su 100% debe corresponder al final del texto. La entrada a comentarios es otra actividad. En los posts actuales de un minuto, ocultarla también mantendría el recorrido claro.

Evidencia: `pages/article-page.js:30`, `:37`.

### 6. Un filtro elegido en el panel puede quedar sin nombre visible al cerrarlo

**Confirmado por estructura; magnitud visual pendiente.** Se marca el botón de tres puntos con `has-selected-filter`, pero el nombre del tema elegido puede permanecer dentro del panel cerrado. El programa conoce el estado; fuera del panel la señal puede ser insuficiente para recordarlo.

Mantener visible el nombre del filtro activo o incorporarlo al control existente. No es necesario añadir una fila de explicaciones permanente.

Evidencia: `pages/index-page.js:80`, `:81`.

## Dónde hay más valor al simplificar

### Repetición mobile

Esta repetición fue una preferencia explícita del propietario; no se propone cambiarla sin aprobación. Con 3 posts, el Featured queda fuera del feed sin filtros y los 2 restantes se repiten durante 3 ciclos: 6 posiciones del feed contienen solo 2 lecturas distintas.

El scroll adicional no implica contenido nuevo. Podría dar la impresión de que no avanza el catálogo y retrasar la newsletter/footer. Es la primera decisión que reconsideraría para este volumen de contenido: mantener carga progresiva de publicaciones distintas y cerrar al agotarse. Si se desea conservar la repetición como identidad, hacer explícito que ya se recorrió el catálogo.

### Acciones sociales del feed

El corazón de una tarjeta abre el artículo en `#article-engagement`; no aplica un like. Luego otro clic abre el aviso para ir a Substack. Es un recorrido largo para una acción que visualmente puede parecer directa.

El corazón puede desaparecer de las cards sin afectar a elegir, leer o comentar. Share tiene una utilidad más inmediata y el icono de comentarios puede servir para quien busca la conversación. Mantendría las acciones completas al final del artículo antes que repetirlas todas en cada tarjeta.

Además, la ausencia de un dato se convierte en 0. Un cero confirmado y un dato desconocido no significan lo mismo. Si se revisa esta decisión, se puede conservar el icono y reservar la cifra para datos conocidos; esto cambia una preferencia previa y requiere decisión editorial.

### Avisos y modal de Share

Comentario: ya se explica el proveedor en el bloque, el botón indica salida y el modal vuelve a explicar Substack. La duplicación puede suprimirse sin perder el destino si se conserva un aviso claro. En suscripción sí hay un motivo adicional para la confirmación: se continúa con el correo escrito hacia otro servicio.

Share actual: abrir modal → copiar → cierre automático. El modal no ofrece todavía una selección de destinos. Copiar directamente con confirmación accesible ahorraría una acción; el campo seleccionable sigue siendo valioso como fallback si falla el portapapeles. Este es un cambio opcional respecto de la preferencia previa por un modal.

### Índice y elementos de lectura

El índice mantiene la última selección mobile, contempla comentarios solo si existen y evita un panel vacío: son buenas decisiones que no eliminaría. Su coste está en mostrarlo siempre que exista algún encabezado, aunque la publicación dure un minuto.

Mantenerlo en artículos donde los saltos aporten valor. No propongo un umbral universal sin probar contenido real. El título, las secciones, el texto y una ruta de regreso son más importantes que la barra, el rol repetido del autor o una segunda etiqueta explicando la misma actividad.

Los títulos de grid/mobile se restringen a dos líneas decorativas con elipsis. El título completo queda accesible para lectores de pantalla y en la página del post, pero puede faltar información visual necesaria para elegir un título largo. Verificar esta composición con títulos reales largos antes de darla por resuelta.

### Carrusel de recuperación

El autoplay de 10 segundos fue solicitado y funciona con condiciones de pausa programadas. No hay un control explícito para detenerlo y reanudarlo; una pausa temporal por foco, interacción o visibilidad no equivale a ese control. El tutorial de [carruseles de W3C](https://www.w3.org/WAI/tutorials/carousels/animations/) recomienda un botón de detener/reanudar además de pausar al pasar el puntero o recibir foco.

Mi recomendación para una recuperación minimalista sería swipe manual con una indicación discreta de posición, por ejemplo 1/3. Si se conserva autoplay, añadir control explícito de pausa. No se afirma conformidad WCAG mediante esta revisión de código.

### Estados de recuperación

El mismo bloque mezcla URL inexistente, catálogo vacío y fallo de red. “Try again” tiene sentido cuando algo puede cargarse en un nuevo intento; en una URL definitivamente ausente, lo prioritario es volver al archivo o abrir otra lectura.

Mantener la composición centrada y los destinos actuales. Diferenciar el texto y la prioridad de acciones según el estado conocido. No hace falta otro diseño ni otra ilustración.

## Oportunidad al terminar un artículo válido

Ahora los relacionados están en recuperación de errores. El lector normal termina con acciones sociales, comentarios y newsletter; no monta recomendaciones de lectura.

Si el objetivo es continuar leyendo, ofrecer una o pocas lecturas relacionadas al final del post tiene una función más directa que mostrar más contadores. Se puede reutilizar el componente existente. Sería una adición con propósito, no un motivo para añadir otro bloque de acciones o un carrusel automático grande.

## Flujo que conservaría

Entrar en Writing → elegir destacado o explorar → filtrar si hace falta → abrir artículo → leer → volver al mismo lugar o continuar con otra lectura.

Comentar, compartir y suscribirse son ramificaciones voluntarias. No deberían convertirse en pasos necesarios para completar la lectura. La navegación de regreso, el estado de filtros, el contenido claro y las rutas de recuperación son la columna vertebral. Los colores, glass y tipografía pueden mantener la personalidad sin ocupar nuevas decisiones.

## Orden sugerido de decisiones

1. **Corregir promesas y estados:** Reply contextual, conteo restante, búsqueda al rotar, desactivar idioma y medida de progreso.
2. **Completar catálogo editorial:** tags antiguos frente a la estructura nueva; revisar el título publicado Test Post #1 update antes de presentarlo como contenido definitivo. Conservar slug evita romper enlaces cuando solo se cambia el título.
3. **Decidir con el propietario:** repetición del feed y acciones sociales en cards. Son cambios respecto de preferencias anteriores.
4. **Simplificar pasos repetidos:** avisos redundantes, tamaño de la invitación a comentar y modal Share de una sola acción.
5. **Cerrar lectura y recuperación:** siguiente lectura útil; distinguir estados de error; carrusel con descubrimiento y control explícitos.
6. **Cerrar verificaciones específicas:** dispositivos físicos, teclado y lector de pantalla, títulos extremos y restauración exacta de scroll. El recorrido visual básico ya está realizado; ver resultados al final.

## Recorrido visual e interactivo tras el desbloqueo

Se revisó la interfaz española con los tres artículos publicados en inglés. Se usó la UI de Brave y su emulación responsive, sin ejecutar scripts de inspección en la página. No se modificó la implementación, contenido remoto ni versiones. Las capturas son del viewport visible, no exportaciones de página completa.

| Escenario | Resultado observado |
| --- | --- |
| Desktop: lista y grid | Featured y feed tienen jerarquías reconocibles. Grid blanco y Featured terracota mantienen la diferencia. En lista se repite EN en portada y metadata lateral. El placeholder de búsqueda en español se recorta. |
| Filtro Design | Featured permanece arriba; el post destacado también aparece en el feed por coincidencia explícita. Correcto según el comportamiento solicitado. |
| Filtro Software desde «…» | El menú se cierra y el botón de puntos se vuelve verde, pero no muestra el nombre Software. El usuario debe reabrirlo para recordar qué eligió. Confirmada la fricción de reconocimiento. |
| Búsqueda inexistente | Se muestra «No se encontraron publicaciones», una explicación y Limpiar filtros. Featured permanece visible. |
| Buscar Test → grid → abrir → Atrás | Se recuperan la consulta Test y la vista grid. No se certificó igualdad de scroll al píxel ni restauración tras recargar la pestaña. |
| Búsqueda Test → viewport móvil → volver a desktop | La consulta desaparece y vuelven los dos posts del feed. Confirmada la pérdida de búsqueda al entrar al layout compacto; no es solo que el campo se oculte. |
| Mobile: portada y feed | Featured conserva una composición diferente, filtros centrados en el flujo y sin fijación durante el scroll, dos tags por card y acciones a la derecha. No se observó desbordamiento horizontal en 393 px. Las tarjetas repetidas se hacen evidentes con este catálogo pequeño. |
| Atajo del header | El doble toque llevó al inicio. Es una comodidad oculta; no debe reemplazar los enlaces visibles de regreso. No se certificaron todos los gestos en un dispositivo físico. |
| Comentarios de Test Post | Se pueden desplegar las dos respuestas. «2 comentarios más…» permanece aunque ya estén visibles; no comunica con precisión el contenido aún no mostrado. |
| Responder una respuesta | El modal ofrece continuar a /p/test-post-1/comments, no al enlace individual de esa respuesta. Confirmada la pérdida del contexto en el destino configurado. No se abrió ni se publicó una respuesta en Substack. |
| Índice móvil | El salto a Comentarios llega a esa sección. Sigue pendiente certificar la restauración de la última fila al reabrirlo después de volver manualmente arriba. |
| Share desde una card móvil | Abre Compartir con el enlace canónico del artículo y Copiar enlace; no navega al artículo. Se cerró sin modificar el portapapeles. Copia nativa y cierre automático siguen sin comprobarse en este recorrido. |
| Share en iPad vertical | Popup centrado, con tamaño contenido, en lugar de ocupar el borde inferior como móvil. |
| Header de iPad | Hamburguesa en vertical; navegación completa en horizontal. |
| Newsletter en iPad vertical | Icono y título aparecen centrados como grupo. El texto de apoyo y el formulario tienen separación legible. |
| Suscripción desktop | Se introdujo ux-audit@example.org y se abrió únicamente el aviso local. El enlace de continuación contiene el correo para confirmarlo en Substack. Se canceló y se limpió el campo; no se completó ninguna suscripción. |
| URL ausente /blog/missing-angular | Ilustración del paisaje, explicación y acciones centradas. Reintentar está arriba; Volver a Writing y Ver posts en Substack debajo. Hay lecturas de recuperación. El mensaje no distingue ausencia definitiva de fallo temporal. |
| Relacionados móviles | Una tarjeta por vez, blanco y sin acciones sociales. El avance automático se observó al retirar el puntero y se pausó mientras este permanecía encima. No hay indicador visible de posición ni control explícito de pausa. Swipe táctil físico pendiente. |

### Lo que cambia respecto del diagnóstico inicial

Los problemas de filtro oculto, destino genérico de Reply, conteo restante y pérdida de búsqueda tienen evidencia de interacción, además de evidencia de código. No hace falta rediseñar el blog para resolverlos.

La presentación móvil del destacado, los filtros en el flujo, las acciones separadas de la card, el popup de tablet y la suscripción local hasta su aviso funcionan en los escenarios revisados. No aconsejo retirar esos elementos por un supuesto fallo visual no observado.

Se añaden dos detalles de simplificación observados en desktop: quitar una de las dos indicaciones EN en lista y acortar el placeholder español para que no se corte. Son ajustes localizados, no un cambio de sistema tipográfico.

### Decisiones de eliminación, después de verlo

| Elemento | ¿Se entiende el flujo sin él? | Propuesta para decidir |
| --- | --- | --- |
| Segundo EN de lista | Sí; queda la identificación sobre imagen o metadata | Eliminar la duplicación. |
| Idioma en filtros cuando solo existe EN | Sí; no hay una alternativa de idioma que elegir | Ocultarlo hasta que haya variedad, manteniendo EN en cada post. |
| Corazón del feed | Sí; abrir y leer sigue completo | Candidato opcional a retirar: hoy no realiza un like directo. Mantener comentarios y compartir puede ser suficiente. |
| Repetición de los mismos posts | Sí; los originales siguen accesibles | Es una preferencia previamente solicitada. Con dos posts de feed produce repetición antes que descubrimiento; decidir con el propietario, no retirarla por iniciativa de auditoría. |
| Modal de Share con una sola acción | Sí, si Copiar enlace ofrece confirmación accesible | Simplificación opcional. La versión actual funciona y fue una elección explícita del propietario. |
| Icono/tarjeta de invitación a comentar | Sí, con un botón contextual y el aviso breve | Se puede compactar, pero el aspecto actual ya es más limpio; no es prioridad. |
| Segundo aviso de salida a Substack | Sí, si la salida y el requisito de cuenta quedan claros | Evitar explicaciones idénticas en cada paso; conservar la confirmación de suscripción con correo. |
| Autoplay de relacionados | Sí, con swipe y señal visible de otras tarjetas | Preferir control del lector; si permanece, añadir pausa y posición. |
| Featured, tags, regreso, newsletter, recuperación | Retirarlos elimina orientación, descubrimiento o continuidad | Conservar. |

### Límites que siguen abiertos

- No se certificó accesibilidad completa, contraste medido, navegación integral por teclado ni VoiceOver.
- No se probaron Safari/iOS ni Android físicos; tampoco viewport de 320 px ni todos los títulos extremos.
- No se completó ninguna acción externa: comentarios, likes o suscripciones.
- No se probó el portapapeles nativo ni el cierre tras copiar.
- No se certificó el scroll exacto con imágenes tardías ni la memoria final del índice móvil.
- El estado de comentarios cero permanece respaldado por código/datos; no se completó su prueba visual final tras perderse la conexión de la sesión al retomar. Tampoco se simuló una caída de red real.
- No se atribuyeron los indicadores genéricos de errores/issues de DevTools a un fallo del producto sin examinar sus mensajes.

Capturas guardadas en `output/ux-audit-2026-10-15/`: desktop-list, desktop-grid, desktop-comments, mobile-home, mobile-feed, mobile-comments, mobile-share, tablet-share, tablet-landscape-error y mobile-related (PNG). No se alteraron capturas para simular estados.

No se enviaron comentarios, likes, correos o suscripciones. No se hicieron cambios al código del sitio para esta auditoría. Las recomendaciones son decisiones para revisar, no instrucciones ya aplicadas.

## Ajustes posteriores de comentarios y desarrollo

- Los destinos de comentarios se normalizan al permalink publicado por Substack: `https://substack.com/note/c-ID`. El enlace de perfil numérico sin slug no era suficiente. Se verificó con HTML público que el destino del comentario 351689555 conserva ese ID y el post 218392512.
- Se conserva compatibilidad con los datos `_preloads` antiguos y el nuevo bloque JSON público `preloads-json`, sin ejecutar scripts. Los subhilos públicos entregados se conservan con padre/ID, hasta el límite existente de 20 respuestas importadas por raíz; cuando no se entregan, sigue disponible el destino externo. No se promete sincronizar todos los comentarios mediante una API privada.
- Cada nivel con hijos dispone de su propio desplegable. Se eliminó el corte visual a cuatro niveles y se evitan ciclos por ID. En mobile se reduce la sangría y se omiten avatares repetidos en niveles profundos.
- Fechas relativas localizadas en comentarios; timestamp original en `datetime` y fecha exacta UTC como título.
- Puntos de carrusel sincronizados con scroll manual y automático; activo blanco.
- Webpack Dev Server envía una CSP propia que permite exclusivamente los sockets de loopback en el puerto 5173. La CSP de Netlify para producción no se cambia. El servidor ya iniciado necesita reiniciar `npm run dev` para leer la configuración.
- Validación: 252 pruebas aprobadas y compilación de producción correcta, con la advertencia previa por dos imágenes grandes. No se cambiaron versiones ni se reiniciaron los servidores que ya estaban usando los puertos locales.

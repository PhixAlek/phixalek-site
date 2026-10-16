# Writing: tipos, temas y portada de Substack

## Taxonomía

Tipos editoriales: **Notes · Thoughts · Guides**. Temas: **C# / .NET · Angular · Architecture · AI · Software · Design · Web Dev · Game Dev**.

Los tipos presentes se ordenan primero y usan el verde existente. Los temas mantienen el tratamiento terracota. La distinción depende del nombre/alias del tag, no de su posición. Las definiciones están en `src/content/writing.json`; no se crean filtros vacíos para tipos o temas sin posts. Los tags desconocidos siguen disponibles como temas, para no perder información publicada. Se conservan los límites actuales de cuatro tags en desktop y dos en mobile.

Substack sigue siendo la fuente de los tags: añadir un tipo y los temas aplicables al post. Los alias existentes como `.NET`, `C#`, `Game Development` o `Web Development` se agrupan en sus temas correspondientes; no se reescriben los posts publicados.

## Regla de portada

Antes de este cambio, la portada procedía del campo dedicado de RSS (`enclosure` o media) y el HTML del cuerpo se trataba por separado. Ahora un bloque de imagen situado al comienzo del HTML tiene prioridad sobre ese campo.

1. Se omiten comentarios HTML, espacios y párrafos vacíos. Se atraviesan wrappers neutros (`div`, `span`, `p`, enlaces, `figure`, `picture`). El primer texto, encabezado o separador significativo impide buscar una portada más adelante.
2. Solo se acepta una imagen inicial con URL HTTPS segura. No se buscan capturas técnicas en medio del texto.
3. Se prefiere la URL original indicada por `data-attrs.src` / `original_src`; después, el mayor candidato declarado en `srcset` de la imagen o de `picture`; después, un enlace de imagen y finalmente `src` / `data-src`. Se mantienen intactas las URLs firmadas y las comas internas del CDN; no se fabrican variantes de tamaño.
4. El modelo conserva el HTML completo sanitizado y metadatos opcionales de portada: URL, alt, dimensiones y leyenda. Las copias guardadas antiguas también se normalizan al cargarse en el navegador o al generar HTML estático; no hay migración obligatoria de la arquitectura JSON.
5. Al renderizar el lector, se excluye únicamente el nodo inicial designado si su URL coincide. Una imagen posterior, incluso con la misma URL, se conserva. Se eliminan solo wrappers que hayan quedado completamente vacíos.
6. En una figura con una sola imagen, su `figcaption` se conserva como leyenda del hero, con su formato y enlaces sanitizados. Las demás imágenes y leyendas permanecen en su orden original.
7. Si no hay portada inicial, se mantiene la imagen dedicada de RSS y, si falta o falla, el fallback actual. No se modifica Substack.

La misma imagen alimenta el hero y las miniaturas Featured/List/Grid mediante el modelo compartido. Se conservan glass, proporciones y recortes de cada layout. Las dimensiones reservan espacio y las leyendas quedan fuera del efecto glass. Hero y Featured tienen `loading="eager"` y `fetchpriority="high"`; las miniaturas normales usan `loading="lazy"`, todas con `decoding="async"`. Los atributos también se incluyen en HTML estático.

Los encabezados importados mantienen sus niveles semánticos originales; no se convierten todos a H5 para ajustar su tamaño.

## Límites deliberados

- No se elige automáticamente una portada de galerías con varias imágenes o de figuras que mezclen imagen con prosa fuera de figcaption, ni de imágenes después de contenido significativo.
- No se convierten fondos CSS, SVG inline, canvas, iframes ni imágenes creadas por JavaScript en portadas.
- Se admiten candidatos `srcset` con descriptores `w` o `x`; las listas ambiguas sin descriptor no se usan para seleccionar portada. `src` sigue disponible como fallback.
- Una leyenda fuera de `figcaption` se conserva en el cuerpo; no se adivina que pertenezca al hero.
- La elección usa metadatos y tamaños declarados, sin descargar imágenes para medir su resolución. Si el proveedor no ofrece una URL de mayor resolución, no se inventa una.

## Archivos de esta integración

- `src/content/writing.json`: tipos, temas y alias.
- `src/shared/writing/taxonomy.js`, `listing-model.js`: clasificación y orden de tipos publicados.
- `src/shared/writing/content-url.js`: validación HTTPS extraída sin cambiar sus reglas; `article-body.js` sigue reexportando la función.
- `src/shared/writing/opening-cover.js`: detección del bloque inicial y fuentes responsive.
- `src/shared/writing/article-body.js`: sanitización, metadatos de portada y exclusión del bloque coincidente.
- `src/js/modules/writing/import-feed.js`, `feed.js`: prioridad de la portada inicial y compatibilidad con caché/snapshot.
- `src/js/modules/writing/article-html.js`, `pages/article-page.js`: exclusión de la portada al renderizar el cuerpo.
- `src/js/modules/writing/components/card-dom.js`, `reader-cover.js`: tags por tipo, alt/dimensiones, prioridad de carga y leyenda del hero.
- `src/js/modules/writing/pages/index-page.js`: marca visual de tipos en filtros.
- `src/css/writing.css`: estilos acotados de tipos y leyendas; conserva los layouts existentes.
- `scripts/lib/writing-render.mjs`: misma regla en generación estática.
- `tests/writing-cover.test.js`, `writing-taxonomy.test.js`: casos nuevos.
- `tests/writing-listing.test.js`: orden de tipos y atributos serializables de carga.
- `tests/writing-substack-interactions.test.js`: actualización de una expectativa obsoleta para el cambio ya solicitado de ocultar el texto vacío de comentarios; no hay cambios nuevos de comentarios en esta integración.

## Validación

- **246 pruebas aprobadas** en la suite completa. Los casos nuevos cubren portada única, wrappers, picture/srcset, leyenda con formato, varias imágenes posteriores, URL repetida, ausencia de imágenes, primera imagen en medio de texto, metadatos originales, URL insegura, caché, tipos y alias.
- Hero y miniaturas Featured/List/Grid verifican una fuente común, alt, dimensiones y carga adecuada. El lector estático excluye la imagen inicial y conserva el contenido posterior.
- Verificación visual con fixture temporal generado con los componentes reales, sin publicar posts de prueba: desktop de 1440 px y mobile de 390 px. Una portada, leyenda preservada, imagen posterior en el cuerpo, mismo origen de miniaturas, sin overflow horizontal móvil. Verde para tipos, terracota para temas.
- Build de producción correcto; advertencia existente por dos imágenes grandes. Sin cambios en package-lock.json ni versiones de dependencias.
- La fixture solo se usa para revisión local; no forma parte de los posts ni de los archivos fuente.

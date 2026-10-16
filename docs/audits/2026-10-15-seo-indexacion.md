# Inicio de fase SEO — indexación

Fecha: 15 de octubre de 2026. Rama: `codex/seo-indexacion`, actualizada desde `dev` en `01ce5f4`. La fase previa quedó cerrada y comprometida en ese commit antes de esta implementación. No se reiniciaron servidores, desplegó ni cambiaron versiones.

## Evidencia pública

Comprobación HTTP del dominio indicado por el propietario:

| URL | Respuesta y destino |
| --- | --- |
| `https://phixalek.com/` | 200, sin redirección |
| `http://phixalek.com/` | 301 → `https://phixalek.com/` → 200 |
| `https://www.phixalek.com/` | 301 → `https://phixalek.com/` → 200 |
| `http://www.phixalek.com/` | 301 → HTTPS con www → 301 → HTTPS sin www → 200 |
| `https://phixalek.com/blog` | 404 |
| `https://phixalek.com/blog/` | 404 |
| `https://phixalek.com/sitemap.xml` | 200; solo contiene la Home |
| `https://phixalek.com/robots.txt` | 200; permite rastreo y declara ese sitemap |

El HTML público de la Home contiene canonical `https://phixalek.com/`, robots `index, follow, max-image-preview:large`, título, descripción y contenido HTML de respaldo con h1. La existencia de estas señales no garantiza indexación.

## Interpretación del informe de Google

El propietario compartió tres exclusiones por «Página con redirección» e indicó el dominio `phixalek.com`. No se recibieron las tres URLs completas del detalle de Search Console; no se afirma que sean las tres variantes verificadas ni que el dominio entero haya sido rechazado.

Google explica que una URL con redirección puede quedar excluida y que el estado del destino debe comprobarse aparte: [Informe de indexación de páginas](https://support.google.com/webmasters/answer/7440203?hl=es). Si las exclusiones son las variantes HTTP/www anteriores, mantener su redirección es coherente con una única URL principal. No procede quitar redirecciones correctas para vaciar el informe.

## Diferencia local / publicado

El repositorio ya genera archivo de Writing, páginas de artículos, sitemap ampliado y fallback 404 mediante `scripts/generate-writing.mjs` en el postbuild. El sitio público comprobado no ofrece Writing y su sitemap solo enumera la Home. Hay una diferencia entre el estado local y el despliegue público; todavía no se revisó el registro de despliegues ni se atribuyó la causa a un fallo concreto de Netlify.

## Implementación local de SEO

- Identidad consistente: Alejandro Segura, alias PhixAlek, Software Developer, especialidad C#, .NET y Angular. No se atribuyen títulos universitarios ni experiencia nueva que no figure en el contenido aprobado.
- Home: title, descripción, Open Graph, Twitter y grafo Person / ProfilePage / WebSite. El HTML de respaldo enlaza Writing y los proyectos publicados. No se altera el diseño ni las secciones existentes.
- Writing y cada artículo: HTML completo antes de JavaScript, title y descripción propios, BlogPosting con autor, idioma, portada, publicación y modificación. Las páginas de error conservan noindex y no reclaman el canonical de una página válida.
- URLs canónicas y sitemap con barra final (`/blog/`, `/blog/slug/`), coherentes con páginas `index.html` y Pretty URLs de Netlify. Se mantienen las redirecciones de dominio correctas; falta verificar el comportamiento HTTP de las rutas nuevas después del despliegue.
- La imagen social de Home usa el archivo WebP existente `demome-01.webp`, con sus dimensiones reales. Se respeta la eliminación previa de `portfolio-preview-v2.jpg`.
- El build de Netlify actualiza el RSS y los tags/idiomas públicos de Substack. La misma edición generada alimenta el bundle, las páginas estáticas, los filtros y el sitemap. La copia editorial versionada no se sobrescribe automáticamente.
- El postbuild valida canonical, sitemap, páginas estáticas, imagen social local, datos estructurados, fecha de modificación y noindex de errores. Un fallo detiene la publicación.

No se crean páginas separadas para cada filtro, traducciones inexistentes ni hreflang sin URLs traducidas. Home conserva sus secciones dentro de una sola URL; no se presentan anclas como páginas indexables independientes.

## Posts nuevos y actualizaciones

1. Publicar o editar el post en Substack. La primera imagen de apertura sigue siendo la portada según la convención editorial existente. Mantener título, extracto, idioma y etiquetas reales.
2. Ejecutar un nuevo deploy de Netlify. Con `NETLIFY=true`, `npm run build` consulta Substack automáticamente. Cada post del RSS obtiene HTML propio, autor, canonical y entrada en el sitemap sin editar la configuración SEO.
3. Para probar la actualización en local: `WRITING_REFRESH=1 npm run build`. El build local normal no necesita red.
4. El botón de refrescar o la visita al feed en el navegador no regeneran por sí solos las páginas estáticas de Google. Este cambio no instala un webhook ni un trabajo programado externo: publicar en Substack por sí solo no dispara Netlify.
5. Si falla el RSS, se publica la copia válida versionada y se registra una advertencia. Un fallo al enriquecer un post conserva sus etiquetas previas; no impide publicar el texto válido.
6. **Archivo histórico:** el RSS es una ventana limitada. Ejecutar periódicamente `npm run writing:update`, revisar el snapshot y guardarlo en Git, antes de que los posts salgan de esa ventana. Así, los siguientes builds conservan el histórico. El archivo generado de build no es una base de datos persistente ni se compromete en Git.
7. `updatedAt` refleja el momento en que el importador detecta un cambio respecto a la copia fuente, no una fecha editorial inventada desde Substack. El guardado periódico del snapshot también estabiliza esta referencia entre despliegues. Los posts sin cambios respecto al snapshot conservan su fecha.

Para eliminar un artículo del archivo se usa el mecanismo existente `removedSlugs`; que un post deje de figurar en el RSS no se interpreta como borrado.

## Validación realizada

- Build de producción local aprobado, con generación y validación de cinco páginas: Home, Writing y tres posts.
- Build con actualización real desde Substack aprobado, sin advertencia de fallback del RSS. Se mantienen tres posts públicos.
- Suite completa: 256 pruebas aprobadas; incluye importación de un post nuevo, portada sin duplicación, identidad de autor, sitemap, fechas estables para contenido sin cambios, fallback sin red y restauración de metadatos al volver a Home.
- Prueba del validador sobre archivos de despliegue: detecta canonical incorrecto, imagen social eliminada y página de error indexable.
- Validación de seguridad de artefactos aprobada. Persisten las advertencias previas de tamaño de dos imágenes de proyectos; no se recomprimieron ni sustituyeron en esta fase.

## Pendiente después de publicar

1. Verificar el despliegue correcto: Home, `/blog/` y cada post deben responder 200, con el canonical final y HTML completo; una ruta inexistente debe responder 404 real. Los servidores de desarrollo no demuestran el comportamiento del CDN de producción.
2. En Search Console, inspeccionar las URLs finales y enviar `https://phixalek.com/sitemap.xml`; solicitar indexación de Home y del blog. Se necesita acceso a Search Console para conocer su estado privado. No se ha enviado nada en nombre del propietario.
3. Revisar las tres URLs exactas excluidas por redirección. Si son aliases HTTP/www, la exclusión es compatible con una única versión principal indexable.
4. Los artículos también existen en Substack. El canonical propio es una señal, no una garantía de qué copia elegirá Google. No se modifica la publicación original ni su configuración desde este repositorio.

El SEO técnico facilita descubrimiento y comprensión; no garantiza indexación, resultados enriquecidos ni una posición por nombre o carrera. La publicación efectiva y la solicitud de indexación siguen pendientes.

## Referencias oficiales

- [Google: datos estructurados de Article](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google: ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [Google: creación y envío de sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Netlify: comportamiento de redirects y Pretty URLs](https://docs.netlify.com/manage/routing/redirects/redirect-options/)

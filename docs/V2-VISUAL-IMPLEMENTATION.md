# PhixAlek v2 — implementación por fases

Fecha: 2026-09-29. Fase 0 completada: inspección del repositorio.
Esta secuencia sustituye las propuestas visuales y el orden de fases de
PHIXALEK-V2-AUDIT.md y PORTFOLIO-PLAN.md. Cada entrega visual es provisional
hasta revisar el sitio completo. No implica publicar automáticamente.

## Dirección aprobada

Cinco momentos como máximo: **Hero → Flowly/Projects → Evidence → Latest
Writing → About + Contact**, seguidos de un footer compacto. Un mensaje por
bloque; sin repetir título, subtítulo, explicación y CTA por sistema.
Freelance y empleo tienen el mismo peso. Scroll nativo, sin secuestro del scroll.

Nunito; fondo #FAFAFA, superficies #FFFFFF, texto #1E242B, neutro cálido
#E8D5B5, salvia #81B29A y terracota #E07A5F. Los acentos no deben usarse
como texto pequeño sobre blanco sin comprobar contraste; emplear variantes
oscuras accesibles cuando sea necesario. El mockup orienta jerarquía y ritmo,
no acredita métricas, artículos ni una interfaz terminada de Flowly.

## Auditoría actual

| Área | Estado y decisión |
| --- | --- |
| A. Arquitectura | JavaScript ES modules y DOM, Webpack, sin framework ni router. Main monta Hero, About, Projects y Contact. Reordenar progresivamente. |
| B. Reutilización | Header/drawer, navegación activa, skip link, foco, Projects, registro de imágenes, formulario, booking y rueda horaria. |
| C. Contenido | src/data/content.json y content.es.json; images.json para imágenes; sections.json para borradores de experiencia, caso Flowly y Writing. |
| D. Idiomas | Catálogos UI EN/ES, proxies y bindings actualizan nodos sin remontar formularios. Preferencia por sesión y detección del navegador. Conservar. |
| E. Móvil | Breakpoints y menú con aislamiento del fondo, Escape y gestión de foco. Ajustar estilo, no sustituir comportamiento. |
| F. Contacto | Formulario #contact-form con estados localizados; booking montado una vez. Mantener ambos accesibles al compactar el cierre de Home. |
| G. Dependencias | EmailJS cliente; funciones Netlify freebusy/create-event, googleapis y política compartida de Hermosillo. No modificar contratos por motivos visuales. |
| H. Conservar | Reglas horarias, validación de reservas, localización, imágenes de proyectos, destinos reales y configuración de despliegue. |
| I. Refactorizar | Tokens globales y colores locales; header/hero, jerarquía de Projects, About extenso y cierre de contacto; footer. |
| J. Retirar | Montaje y estilos del fondo de orbes durante fase visual. Quitar CTA duplicado del Hero cuando Contact esté destacado en header. No borrar assets usados. |
| K. Crear | Evidence, Latest Writing, composición About + Contact y Back to top. Caso de estudio y blog quedan para entregas posteriores. |
| L. Modelos nuevos | Métricas verificadas y contexto/fuente; artículo con fecha, título, URL e imagen opcional; avatar; resumen About autorizado; redes enabled/order. Extender los modelos existentes. |
| M. Riesgos | Contraste de acentos, GIF animado, rutas inexistentes, pérdida de foco/estado, estilos oscuros residuales, textos ES largos y contenido ficticio del mockup. |

## Contenido y recursos

- Usar exclusivamente el GIF aportado para identidad pixel art, pequeño,
  no interactivo y sin inventar otro avatar. Fuente proporcionada:
  https://camo.githubusercontent.com/71beefe8790c28c789d8a838d0401fa3126641591a3d2b9083df6a7c8081b845/68747470733a2f2f692e706f7374696d672e63632f334e72564e5159722f70726f66696c652e676966
  En fase Hero comprobar disponibilidad, dimensiones y peso; dar alternativa
  estática u omitir la animación para reduced motion.
- Conservar las imágenes actuales de proyectos hasta recibir sustitutos reales.
  No presentar el dashboard ilustrativo del mockup como producto construido.
- No publicar 5+ años, 6s → 2s ni 70+ sin confirmación y contexto del propietario.
- Evidence y Writing vacíos permanecen ocultos, sin TODOs ni botones muertos.
- Blog solo se muestra como destino cuando exista una página funcional.
  Substack necesita URL real; no añadir RSS, suscripción ni sincronización ahora.
- Mantener textos existentes hasta disponer de versiones breves autorizadas.
  La diferencia Miguel/Alejandro en la biografía requiere decisión del autor.
- Mantener el selector de idioma acordado: destino Es/En en header/drawer,
  ambos idiomas en footer móvil. El mockup no revoca esa interacción.

## Entregas

0. Auditoría y registro de decisiones (esta entrega; sin cambios visuales).
1. Extender JSON/modelos con borradores; preservar contenido publicado EN/ES.
2. Tokens globales, Nunito y retirada de orbes; revisar contraste también en modales.
3. Header + Hero: identidad, GIF pequeño, contacto en header y una transición a Projects.
4. Projects: Flowly destacado, estado real y detalles mínimos; conservar imágenes.
5. Evidence: 2–4 métricas aprobadas como máximo; sin contenido, no renderizar.
6. Latest Writing: un artículo real; preparar navegación sin enlaces ficticios.
7. About + Contact: cierre compacto que conserva correo y agenda operativos.
8. Footer: redes configurables, Substack cuando tenga URL y regreso a Inicio.
9. QA responsive global (360/390/768/1024/1440 y reflow a 320).
10. Auditoría de accesibilidad: teclado, foco, etiquetas, contraste y estados.
11. Movimiento sutil con reduced motion.
12. Rendimiento, assets, metadatos y revisión integral antes de publicar.

Cada fase: alcance acotado, validación de contenido, pruebas relevantes, build
y revisión visual EN/ES cuando afecte UI. Accesibilidad y responsive se revisan
desde cada cambio; las fases finales amplían la revisión, no la posponen.
No enviar correos ni crear reservas reales como parte de pruebas visuales.

## Actualización: brief final y fase 1

El brief final del propietario prevalece sobre las restricciones anteriores
cuando hay diferencias. Mapeo confirmado sin reorganizar archivos:

| Bloque | Fuente actual / extensión mínima propuesta para su fase |
| --- | --- |
| Hero | hero en content.json/content.es.json; avatar mediante images.json |
| Projects | projects.items en ambos JSON; detalle futuro en sections.work |
| Evidence | Proponer experience.metrics en sections.json en fase 5; contextos EN/ES con el patrón de catálogos existente |
| Latest Writing | sections.writing.items: un mock explícito y no confundible con artículo publicado en fase 6 |
| About + Contact | about y contact existentes; resumen breve pendiente del autor |
| Footer | footer.social existente; añadidos Substack y HackerRank en ambos idiomas |

Datos ahora aprobados por el propietario: **5+ años** trabajando con aplicaciones
web; **~6s → ~2s** exclusivamente en un módulo de notas clínicas; **45+**
estudiantes/desarrolladores formados o mentorizados. No usar 6 años ni 70+.
No se publican todavía porque el bloque Evidence corresponde a su propia fase.

Substack: https://substack.com/@phixalek. Es un perfil, no una URL de feed
verificada. Se guarda en writing.source.url y footer.social; sin fetch ni RSS.
HackerRank: https://www.hackerrank.com/profile/PhixAlek. Ambas redes usan el
registro SVG existente del footer, sin instalar librerías.

Corrección editorial aplicada en esta base visual (EN/ES): Alejandro Segura,
Software Developer; foco en .NET/C# y Angular/TypeScript. Hero, About y footer
ya no atribuyen investigación ni videojuegos como profesión principal. Se
conservan Ingeniería Multimedia, Hermosillo y docencia; Bloomink y No Witness
quedan como proyectos secundarios, este último explícitamente temprano.
La composición compacta About + Contact sigue correspondiendo a fase 7.

El mock de Writing está autorizado para su fase visual; deberá identificarse
como muestra y no inventar una publicación real, fecha o enlace. /blog sigue
sin implementarse: no añadir enlaces rotos para simular navegación.

## Estado de esta entrega

Fase 1: mapeo documentado y enlaces incorporados a la estructura existente. La base anterior tiene 44 pruebas y build verificados;
esta auditoría no certifica un despliegue, integración real ni Core Web Vitals.
No se leyeron archivos de secretos. Próxima entrega: tokens globales y Nunito.


## Corrección de alcance editorial solicitada por el propietario

Conservar el About completo para el futuro modal. No sustituirlo por el resumen
previsto para la nueva Home. Restaurados Backend, Frontend, Game Dev, DDD,
Clean Architecture, UE5, C++ y Pixel Art; añadidos C#, CI/CD y Clean Code por
petición expresa. Eyebrow: Software • Consulting • Game Dev.
Solo se retiraron las referencias a investigación y el párrafo aspiracional.
Hero conserva la frase breve aprobada, ahora con énfasis [[...]] usando el
mismo degradado existente. Ningún cambio a la paleta actual en esta entrega.

Antes de cualquier nuevo cambio de redacción: mostrar al propietario el texto
actual y la propuesta, por sección, y esperar su respuesta. El CV es referencia,
no autorización para publicar automáticamente su contenido. Mantener la copia
larga y sus marcadores de énfasis; no perder información al crear resúmenes.

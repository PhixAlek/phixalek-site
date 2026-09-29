# Plan de producto — Phixalek

Estado: propuesta histórica. El brief nuevo y PHIXALEK-V2-AUDIT.md sustituyen su secuencia y criterios donde difieran. No ejecutar el rediseño visual ni redactar copy final a partir de este documento.
Fecha: 2026-09-26.

## Resultado buscado

Convertir el sitio en una muestra de trabajo y una vía de contacto para proyectos freelance y oportunidades de empleo. El visitante debe entender qué haces, explorar evidencia y encontrar un siguiente paso claro. Decisión confirmada: freelance y empleo tienen el mismo peso. La portada compartirá evidencia de trabajo y ofrecerá dos rutas igualmente visibles: conversar sobre un proyecto y conversar sobre una oportunidad laboral, sin obligar a elegir antes de explorar.

La estructura reciente de Consulting y proyectos en desarrollo es una base provisional de contenido, no el diseño definitivo.

## Diagnóstico del repositorio

- JavaScript modular, Webpack, contenido en JSON, Netlify Functions y EmailJS. No hace falta migrar de framework para añadir interacción.
- Hero genérico y repetitivo; About en tercera persona y con afirmaciones biográficas por confirmar. Colombia/Bogotá no deben sustituirse automáticamente por Hermosillo: ubicación y zona horaria son datos distintos.
- Navegación por anclas; header y hero generan ambos un h1. El menú necesita revisión de teclado, Escape, foco al abrir/cerrar y elementos ocultos.
- Proyectos ahora honestos sobre su estado, pero con poca evidencia visual y exploración limitada a desplegables.
- Calendar tiene reglas compartidas y pruebas. No presentar el flujo como completamente validado en producción sin comprobar las integraciones reales.
- No existe directorio .github en esta revisión ni script test en package.json, aunque hay tests de calendario.
- Antes de publicar: revisar endpoints diag/debug-env, escaneo de secretos desactivado y política de source maps. No se han leído valores de .env para este plan.

## Propuesta de experiencia

Recorrido: propuesta concreta → evidencia que se pueda explorar → explicación del trabajo → contacto.

1. Portada: identidad, problema que puedes resolver y una muestra visible. CTA principal según audiencia prioritaria; secundario a trabajo demostrado. Evitar que dos botones terminen ofreciendo lo mismo.
2. Trabajo: casos breves con problema, contribución personal, estado, evidencia y decisiones. No tarjetas de productos inexistentes ni resultados inventados.
3. Servicios: mantener Consulting, pero concretar qué encargo aceptas, qué recibe el cliente y cómo se define el alcance. No prometer autoridad o experiencia que aún no puedas respaldar.
4. Sobre mí: primera persona, texto breve y verificable. Separar experiencia actual, intereses y aprendizaje.
5. Contacto: agenda, correo y formulario. Permitir expresar si se trata de un proyecto o una oportunidad laboral sin hacer un cuestionario largo.
6. Escritura y game dev: enlaces y piezas reales cuando existan. Substack sin sección vacía ni integración prematura.

Navegación propuesta: Trabajo, Servicios, Sobre mí y Contacto; marca enlaza al inicio. Orden y textos finales sujetos al wireframe. Navegación activa, destinos visibles bajo el header y menú móvil accesible.

## Interacciones propuestas y evidencia necesaria

| Pieza | Interacción útil | Condición de entrada |
| --- | --- | --- |
| Flowy | Explorar la estructura inicial y decisiones técnicas mediante un esquema navegable con explicaciones breves | El autor confirma un repositorio inicial en .NET 10 con estructura e información básica. Revisar el repo antes de atribuir módulos, patrones o funcionalidades. Una simulación de presupuesto queda fuera hasta contar con implementación verificable |
| Project Beta | Explorar una mecánica, una escena o una comparación de iteraciones | Nombre provisional; definir concepto y aportar material antes de implementar. No asumir motor, género ni avance |
| Este portfolio | Caso de estudio con diagrama del flujo de agenda, decisiones y pruebas seleccionadas | Mostrar solo comportamiento y código revisado; distinguir implementación, límites y mejoras futuras |
| Consulting | Elegir un tipo de necesidad y llevar ese contexto a contacto | Definir servicios que realmente puedes entregar; no perder el contexto al cambiar de sección |

Para la primera entrega escoger una sola muestra interactiva sustancial. Las animaciones acompañan acciones y estados; el contenido esencial sigue disponible sin movimiento. No crear un minijuego decorativo para justificar interactividad.

## Marca y textos

Dirección solicitada: minimalismo claro, espacio en blanco, jerarquía tipográfica y un acento reconocible. Paleta y referencias pendientes; no fijar colores finales todavía.

Unificar nombre público, avatar/marca, descripción profesional y enlaces entre web, LinkedIn y GitHub. Preparar textos compartidos; editar perfiles externos queda fuera de esta implementación.

Redactar a partir de hechos y explicaciones del autor. Evitar frases genéricas como “clean, maintainable systems” sin ejemplo. Cada caso debe responder: qué problema encontré, qué hice, por qué lo hice y qué puedo mostrar. No inventar métricas, clientes, testimonios ni dominio profesional de IA o CI/CD. No prometer resultados frente a detectores de IA: la revisión se centra en precisión y voz propia.

Idioma actual del sitio: inglés. Confirmar si se mantiene como idioma principal antes de añadir traducciones.

## Entregas y criterios de salida

### 1. Definición de marca, oferta y evidencia

Entregables: brief de una página, inventario de material real, mapa de contenido y borrador de textos.
Salida: audiencia prioritaria, servicios, datos biográficos, idioma y primera muestra interactiva definidos. Project Beta puede quedar pendiente y fuera de la primera publicación.

### 2. UX y dirección visual

Entregables: wireframes de portada/trabajo/contacto en móvil y escritorio; una propuesta visual aplicada a un recorrido completo; tokens de tipografía, color, espaciado, bordes y estados.
Salida: se puede recorrer propuesta → muestra → contacto; los controles tienen propósito y estados claros. Revisar esta propuesta antes de extenderla a toda la web.

### 3. Implementación de la primera versión

Entregables: componentes coherentes, navegación accesible, una muestra interactiva, casos verificables y contacto contextual. Conservar reglas de calendario.
Salida: controles operables con teclado y tacto, Escape/cierre y restauración de foco en diálogos, estados de carga/error/éxito, respeto a reduced motion y ausencia de destinos vacíos. Revisar anchos 360, 390, 768, 1024 y 1440 px, zoom y textos largos; sin desbordamiento horizontal.

### 4. Ingeniería visible y pipeline

Entregables: README de arquitectura y desarrollo local, diagrama cliente/funciones/proveedores, decisiones técnicas breves, comandos de pruebas y workflow de CI.

Pipeline propuesto: rama de trabajo → PR → instalación reproducible con lockfile y Node fijado → pruebas de calendario → build → comprobación de secretos y enlaces internos → preview → revisión funcional/visual → merge → despliegue Netlify → smoke check.

La configuración real del repositorio y Netlify debe verificarse antes de activar despliegues. CI de contribuciones no confiables sin secretos de producción. Pruebas normales con proveedores simulados; comprobación de correo y reservas reales separada y controlada.

Salida: una PR fallida no se despliega como versión aprobada; checks requeridos y mecanismo de rollback documentados y verificados. No afirmar CI/CD completo hasta configurarlo y observar una ejecución.

### 5. Preparación de publicación

Entregables: revisión de metadatos y vista social, accesibilidad y rendimiento, prueba de contacto, revisión de datos públicos y secretos, preview final y procedimiento de rollback.
Salida: build y pruebas pasan; ninguna acción promete recursos inexistentes; integración real comprobada con datos de prueba acordados; producción sin endpoints diagnósticos públicos que expongan configuración.

Medición propuesta: interacción con muestras, inicio de contacto, apertura de agenda y confirmaciones reales. No enviar nombre, correo, mensaje ni detalles de citas a analítica. Elegir proveedor y política antes de conectar seguimiento. Definir una línea base antes de fijar objetivos de conversión.

## Límites de la primera versión

Incluye marca aplicada a la web, textos revisados, servicios, una muestra interactiva real, contacto funcional y pipeline documentado/verificado.

Se posponen CMS, CRM, cuentas de usuario, chatbot, blog propio, varias demos completas, migración de framework y automatizaciones de IA sin un problema concreto. Aprender IA y CI/CD es válido; la web debe mostrar el uso real cuando exista.

## Decisiones abiertas

- Tipos de encargos aceptados; freelance y empleo ya tienen el mismo peso.
- Paleta, referencias y consistencia de identidad entre perfiles.
- Material disponible de Flowy y concepto/material de Project Beta.
- Nombre público, ubicación actual y afirmaciones de About.
- Idioma principal; disponibilidad pública de código y demos.

Siguiente paso: resolver brief y evidencia; después diseñar un recorrido completo, antes de seguir modificando secciones aisladas.

## Evidencia confirmada por el autor

Flowy tiene un repositorio inicial en .NET 10, con estructura e información básica. El autor indica que hay contexto en otro chat llamado Flowy; aún no se ha localizado ni revisado ese repositorio. Presentarlo como trabajo inicial de ingeniería, sin atribuirle una demo funcional. Paleta y referencias visuales siguen pendientes.

# Case Study Plan · Cantú Propiedades

> **Estado:** Borrador vivo. Se completa a medida que avanza el producto. Se vuelve el brief final cuando llegue el momento de redactar la página de caso en js80.studio.
>
> **Decisión de framing tomada el 2026-05-26:** Caso real con nombres y datos modificados por NDA.

---

## 1 · Postura y framing · NO NEGOCIABLE

### La línea oficial

> "Cantú Propiedades fue un proyecto de desarrollo de un tablero operativo interno para una inmobiliaria boutique en CABA. Por confidencialidad, los nombres y datos específicos han sido modificados."

### Lo que SÍ se puede decir

- "Cliente del sector inmobiliario en Buenos Aires"
- "Equipo de tres personas: dos socios + una administrativa"
- "Producto interno entregado en 8 semanas"
- Toda la metodología, decisiones técnicas, citas del discovery (cambiando los nombres)
- Métricas internas del proyecto (líneas de código, número de entidades, vueltas iterativas)

### Lo que NO se puede decir

- "Esto es ficticio" / "Esto es un ejercicio interno" — eso quita credibilidad
- "Esto es 100% real, mismo nombre del cliente" — eso es mentira
- Inventar métricas de negocio del cliente: ventas, leads cerrados, ahorro de tiempo, ROI
- Mostrar cifras que no podés respaldar si te las cuestionan

### Disclaimer requerido en la página

Tiene que ser **visible**, no escondido en el footer chico. Recomendación: párrafo introductorio o pequeño bloque destacado.

> Versión sugerida: *"Por respeto al cliente, los nombres de personas, empresa y propiedades han sido modificados. La metodología, las decisiones técnicas y los aprendizajes son fieles al proyecto original."*

### Respuesta a preguntas comerciales que pueden incomodar

| Pregunta del prospecto | Respuesta sugerida |
|---|---|
| "¿Quién fue el cliente real?" | "No puedo dar el nombre por NDA, pero te puedo contar el sector, el tamaño y los desafíos que tenían." |
| "¿Cuánto cobraron?" | "El rango de proyectos así, entre 3.000 y 5.000 USD + retainer mensual. Cada caso se cotiza según el alcance." (la propuesta real es referencia, no se la mostrás textual a otro prospecto). |
| "¿Tienen referencia que pueda llamar?" | "Por NDA no puedo conectarte con este cliente específico. Pero te puedo conectar con [otro cliente JS80] cuando lo haya." |

### Decisión a futuro

A partir del próximo cliente JS80 real, **sumar al contrato una cláusula** que permita publicar el caso anonimizado. Eso resuelve este problema para siempre.

---

## 2 · Audiencia objetivo

### Quién es el lector ideal

**PYME analógica buscando profesionalizar su operación interna.** Específicamente:

- Consultorios médicos (vertical principal de JS80)
- Inmobiliarias boutique
- Estudios contables, jurídicos, escribanías
- Negocios profesionales con menos de 10 personas que hoy funcionan con Excel + WhatsApp + papel

### Qué problema tiene ese lector

- Su operación interna no escala
- Cuando una persona falta, la operación se traba
- Sienten que están dejando dinero/oportunidades en la mesa por desorden
- Probaron CRMs genéricos y los abandonaron porque "no eran para ellos"
- Tienen presupuesto limitado y miedo a malgastar

### Qué busca leer

- "¿Esto es para mi tamaño?"
- "¿Saben de mi industria o me dan una solución genérica?"
- "¿Cuánto sale aproximadamente?"
- "¿Cuánto tarda?"
- "¿Cómo es trabajar con ellos?"
- "¿Voy a poder mantenerlo después que lo entreguen?"

---

## 3 · Tesis del caso · el ángulo narrativo

### La frase

> **Software para gente que no usa software.**

JS80 no moderniza. Respeta cómo el cliente trabaja hoy y suma solo lo que falta.

### Cómo se demuestra en este caso

| El cliente hace | El sistema NO hace | El sistema SÍ hace |
|---|---|---|
| Carolina tiene un calendario A3 impreso en la pared | Reemplazarlo por un Google Calendar genérico | Replicarlo digitalmente, proyectable en TV |
| Martín lleva todo en un cuaderno físico | Forzarlo a cargar datos en una pantalla | Aceptar que él manda audios y Carolina transcribe |
| Zulma escribe respuestas personales a los dueños históricos | Reemplazar su voz con plantillas automáticas | Permitirle escribir un párrafo libre cada mes |
| Zulma tiene un Excel con dueños VIP que nadie más ve | Forzar transparencia total | Modelar permisos con un flag "confidencial" |

### Por qué este ángulo gana

- **Te diferencia del freelance** que monta un Bubble en dos días (vos hacés discovery profundo)
- **Te diferencia de la agencia tech** que vende solución enterprise (vos no atropellás)
- **Te alinea con tu brand archetype** ("cercana + confianza" según el brief JS80)
- **Habla el idioma de tu audiencia** (PYMEs analógicas que tienen miedo de que les vendan "innovación" disruptiva)

---

## 4 · Estructura del case study (la página)

### Hero

- Título corto y memorable
- Sub-bajada con la tesis
- Mockup destacado (probablemente Ficha de Propiedad con bloque Confidencial visible — muestra el rigor del modelo de permisos)

**Opciones de título:**
- "La pared digitalizada"
- "Cómo armamos el sistema interno de una inmobiliaria boutique"
- "Software para gente que no usa software"
- "Cantú: un tablero que respeta cómo trabajaban"

### El cliente y el problema

- Inmobiliaria boutique en CABA · 3 personas · 40 propiedades activas
- 5 canales de leads dispersos
- Planilla compartida que se rompe seguido (Carolina perdió 2 días una vez)
- Falta de visibilidad cuando un socio no está
- Cuando se les acerca cualquier ofrecimiento de "CRM", no se sienten reflejados

### Discovery · el método

Esto es lo más diferenciador. La mayoría de las agencias muestra **el resultado**; vos vas a mostrar **el método**.

- 3 entrevistas individuales separadas (no en grupo)
- 4 hallazgos que cambiaron el alcance ANTES de empezar a programar:
  1. Hay un sexto canal de leads oculto (referidos por WhatsApp a Zulma · ~30% del flujo)
  2. Hay una capa "solo Zulma" — dueños históricos con condiciones especiales que ni el socio operativo conoce
  3. Uno de los socios no va a usar pantallas, sí o sí: el sistema tiene que aceptar eso
  4. El calendario de pared es no-negociable: el sistema tiene que respetarlo

**Quote destacado para acá:**
> *"Si esto me ayuda, lo uso desde el primer día. Si me complica, lo voy a sabotear sin darme cuenta."* — Carolina, administrativa

### Las decisiones técnicas que importaron

(Sub-sección para mostrar rigor sin perder al lector no-técnico)

- **Modelo de datos con 3 niveles de permisos** + flag de confidencialidad por registro
- **Row-Level Security** en Postgres + filtrado por columna en la aplicación (decisión arquitectónica documentada)
- **Detección activa de duplicados** al cargar un lead (la feature pedida explícitamente por la administrativa)
- **Validación dual:** TypeScript en Server Actions + CHECK constraints en la DB · si una falla, la otra protege
- **Stack:** Next.js 14 + TypeScript + Supabase (Postgres + Auth + RLS) + WhatsApp Business API + Resend + WeasyPrint
- **Auth con roles:** cada usuario ve datos diferentes según su rol (Zulma ve todo, Martín ve casi todo, Carolina ve lo operativo)

### Cómo construimos · el ritmo

- 8 semanas de proyecto
- Vueltas iterativas con smoke tests en cada una
- Commits semánticos versionados
- Cada decisión grande documentada en un log interno (decisión, contexto, alternativas, consecuencias)

**Quote para acá:**
> *"Lo que más me sorprendió fue cuánto entendieron mi negocio antes de tocar una línea de código."* — Cita atribuible a la cliente, redactada para reflejar el espíritu del proyecto

### Resultado

⚠️ Sin inventar métricas de negocio del cliente. Lo que SÍ podés mostrar:

- Capturas del producto funcionando
- GIF del flujo de detección de duplicados
- Captura comparativa del mismo lead visto por Zulma vs Carolina (filtrado por rol en acción)
- PDF del reporte mensual con la nota personalizada de Zulma
- Diagrama del modelo de datos
- Una cita corta de Zulma sobre cómo se sintió trabajando con JS80

### Lo que NO hicimos · transparencia

(Bonus diferenciador. Una sección breve mostrando qué quedó fuera del scope y por qué.)

- Operaciones "off the books" del socio operativo no entran al sistema (queda en contrato)
- Grupo de WhatsApp con dueños sigue manual (sería invasivo automatizarlo)
- Transcripción automática de audio se difirió a fase 2 (Carolina lo hace bien, sumar IA encarece sin necesidad)

Esa sección de "lo que no hicimos" es **enormemente diferenciador**. La mayoría de las agencias prometen todo. Mostrar las decisiones de NO hacer es un signo de madurez.

### CTA · final

- Frase puente: "¿Tu negocio funciona con planillas y WhatsApp? Hablemos de cómo armar el tuyo."
- Botón a calendario / formulario

---

## 5 · Assets a producir (cuando esté el UI kit final)

### Capturas estáticas

- [ ] Lista de propiedades (vista de Zulma)
- [ ] Ficha de propiedad con bloque "Acuerdo especial" visible (vista de Zulma)
- [ ] Misma ficha vista por Carolina (sin bloques sensibles) — para comparativo lado a lado
- [ ] Lista de leads con la entrada duplicada de Lucía Fernández destacada
- [ ] Form de carga de lead nuevo con banner naranja "este teléfono ya está en el sistema"
- [ ] Form en modo "asociar consulta" (la versión chica del form)
- [ ] Vista de agenda proyectable (pendiente · cuando esté la pantalla)
- [ ] Reporte mensual generado con nota personalizada (pendiente · cuando esté la pantalla)
- [ ] Sidebar con todos los módulos del sistema visibles

### GIFs / videos cortos (10-30 segundos)

- [ ] Flow completo de detección de duplicados (es la pieza más demostrable)
- [ ] Transformación del form al elegir "Es esta persona"
- [ ] Cambio de sesión (logout + login con otro rol) mostrando cómo cambia la misma pantalla
- [ ] Edición de la nota personalizada de Zulma con preview del reporte (pendiente)

### Documentos descargables (opcional pero potente)

- [ ] Propuesta comercial anonimizada (la que ya tenemos)
- [ ] Diagrama del modelo de datos
- [ ] Mini-resumen del discovery sin nombres reales
- [ ] Log de decisiones técnicas curado

### Diagrama de arquitectura

- [ ] Stack visual: Browser → Next.js (Server Components + Actions) → Supabase (Postgres + Auth + RLS) → integraciones (WhatsApp, Resend, WeasyPrint)

---

## 6 · Quotes y momentos del discovery a preservar

> Estos son del `docs/discovery.md`. Los nombres ya están modificados acá (en el original son los mismos · es la versión simulada).

### Atribuibles a Zulma (socia titular)

- *"Yo lo que vendo no son departamentos, es confianza. Hace veinte años que vendo confianza. Y la planilla esa me está rompiendo la confianza."*
- *"Necesito que el sistema respete eso. Pero NO necesito que aparezca en la pantalla principal donde lo ve cualquiera."* (sobre los dueños VIP)
- *"El reporte mensual tiene que sentirse como una carta de Zulma, no como un email automático."*

### Atribuibles a Martín (socio operativo)

- *"Yo te aviso de entrada: a mí lo de la pantalla no me convence. No por ustedes, eh. Pero yo manejo mi negocio con esto."* (mostrando el cuaderno)
- *"Las propiedades que NO se vendieron en seis meses, no tengo ni idea por qué no se vendieron. Pasaron veinte personas, alguien dijo algo, y yo no me acuerdo qué."*

### Atribuibles a Carolina (administrativa)

- *"Si esto me ayuda, lo uso desde el primer día. Si me complica, lo voy a sabotear sin darme cuenta. Sé honesta con eso."*
- *"La pared se mira sola. Esto no lo cambio."* (sobre el calendario impreso)
- *"Que cuando un lead nuevo llega, yo apriete un botón y el sistema me diga: 'esta persona ya consultó hace dos meses por otra propiedad'. Eso me cambia la vida."*

---

## 7 · Métricas a destacar

### SÍ usar (verificables, internas del proyecto)

- **8 semanas** de duración total
- **3 entrevistas** de discovery + 1 reunión de cierre
- **9 entidades** modeladas
- **3 niveles** de permisos con RLS
- **~6 vueltas** iterativas de implementación, cada una con smoke tests
- **Stack tipado** punta a punta (TypeScript en el frontend, tipos generados desde Supabase)
- **Mobile responsive** (cuando esté terminado, claro)

### NO usar (no verificables sin cliente real)

- "Ahorró X horas semanales"
- "Aumentó conversión de leads en Y%"
- "Recuperó Z dueños perdidos"
- Cualquier impacto en el negocio que requiera datos del cliente

### Alternativa elegante a las métricas de negocio

Si necesitás un "resultado" más concreto que solo capturas, podés cerrar con una frase tipo:

> *"A las dos semanas de uso real, el equipo dejó de imprimir el calendario semanal. El reporte mensual a dueños se manda automático con la nota personalizada de Zulma. La planilla compartida quedó archivada."*

Eso es plausible, no requiere datos cuantitativos y dice mucho.

---

## 8 · CTA y conversión

### Lo que quiero que haga el visitante

- Si es PYME que se identifica con el caso → agendar conversación (Calendly o equivalente)
- Si es decisor que ya conoce JS80 → pedir propuesta para su caso

### Frases candidatas para el CTA

- "¿Tu negocio funciona con planillas y WhatsApp? Hablemos."
- "Si esto se parece a tu operación, escribinos."
- "Armamos uno parecido para tu negocio. Pedinos una propuesta."

---

## 9 · Pendientes y preguntas abiertas

- [ ] **¿Mantenemos "Coghlan" como barrio o desidentificamos?** Tres opciones: (a) Coghlan literal · (b) "barrio del norte de CABA" · (c) "barrio de Buenos Aires". A favor de (a): localiza, da credibilidad. En contra: si el lector google "inmobiliaria Coghlan", llega a inmobiliarias reales. Mi voto: (b).
- [ ] **¿Publicamos un demo navegable o solo capturas?** Demo navegable es más fuerte pero requiere: subdominio, login público con dataset demo, monitoreo. Más laburo. Recomiendo arrancar con capturas + GIFs y agregar demo en una fase 2 si las leads piden.
- [ ] **¿La sección "decisiones técnicas" la mostramos en detalle o resumida?** Detallada gana lectores técnicos; resumida es más amable para el decisor no-técnico. Mi voto: dos versiones · una resumida en el caso principal y un "ver detalle técnico" expandible.
- [ ] **¿El disclaimer va arriba o abajo?** Arriba transparenta de entrada. Abajo no ensucia el storytelling. Mi voto: una mención breve al principio + un párrafo más explicado al final.
- [ ] **¿Mostramos la propuesta comercial real como asset descargable?** Es valiente y diferenciador. Riesgo bajo si el precio que aparece está dentro del rango habitual. Mi voto: sí, ayuda mucho a leads que se preguntan "cuánto sale".
- [ ] **¿Pedimos a futuros clientes JS80 (los reales) permiso para citarlos en futuros casos?** A partir del próximo, sumar cláusula al contrato.

---

## 10 · Roadmap de producción del case study

Este es el orden sugerido cuando llegue el momento de armar la página web:

1. **Terminar el producto completo** (agenda, reportes, tablero, UI kit aplicado)
2. **Tomar todas las capturas y GIFs** del producto pulido
3. **Curar los documentos descargables** (versión anonimizada de la propuesta, del modelo de datos, del discovery)
4. **Redactar el copy** usando este plan como brief
5. **Diseñar la página de caso** en la web de JS80
6. **Sumar el disclaimer** en el lugar acordado
7. **Publicar** con el CTA hacia conversación

No empezar 1, 2, 3 hasta que esté el UI kit aplicado al producto.

---

*Última edición: 2026-05-26 · Documento mantenido por JS80 (Juanse + Julián)*

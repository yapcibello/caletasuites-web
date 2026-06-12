# planes/ — Planes de implementación

> Contiene planes de implementación para features, refactors o cambios de cierta entidad que vale la pena alinear con Claude antes de ejecutar.

## Cuándo usar esta carpeta

- **Features grandes**: nuevo módulo, nuevo sistema, nueva integración de terceros (colas de trabajo, pasarelas de pago, webhooks, etc.).
- **Refactors con impacto transversal**: cambios que tocan múltiples módulos, bibliotecas compartidas o la API pública.
- **Migraciones estructurales**: cambios de schema de BD, nuevo formato de configuración, rename masivo de APIs.
- **Decisiones de arquitectura** que merecen un documento explícito con contexto, alternativas evaluadas y trade-offs.

## Cuándo NO usar esta carpeta

- **Tareas rutinarias**: no pongas aquí cada commit. Para eso están `PENDIENTES.md` y `CHANGELOG.md`.
- **Bugs simples**: para fixes acotados basta con la entrada en `PENDIENTES.md`.
- **Discusiones abiertas**: si aún estás explorando, usa memoria persistente (`mem_save type=discovery`).

## Formato de un plan

Cada plan es un archivo `.md` con formato:

```text
YYYY-MM-DD-nombre-corto-descriptivo.md
```

Ejemplos:

- `2026-05-01-migracion-auth-jwt.md`
- `2026-06-15-nuevo-sistema-notificaciones.md`
- `2026-07-20-refactor-schema-multi-tenant.md`

### Secciones recomendadas del plan

```markdown
# Título del plan

## Contexto
¿Qué motivó este plan? ¿Qué problema resuelve?

## Objetivo
¿Qué estado final esperamos alcanzar? (medible si es posible)

## Alternativas evaluadas
Lista de 2-4 opciones consideradas con pros/contras.

## Decisión
Qué opción se eligió y por qué.

## Pasos de implementación
Lista numerada, cada paso con archivos concretos a tocar.

## Riesgos y mitigaciones
Qué puede salir mal y qué haremos.

## Criterios de "hecho"
Checklist para saber cuándo el plan está completado.

## Post-mortem (se rellena al terminar)
Qué funcionó, qué no, qué aprendimos.
```

## Ciclo de vida de un plan

1. **Borrador** — se escribe antes de empezar. Alineación con Claude y con uno mismo.
2. **En ejecución** — se actualiza con avances, decisiones tomadas durante la implementación.
3. **Completado** — al terminar se añade el post-mortem con lecciones aprendidas.
4. **Migración y eliminación** — el contenido valioso del plan completado se migra a `CHANGELOG.md` (entrada con resumen + commits), a la memoria persistente de `ypc-memory` (decisiones arquitectónicas, hipótesis descartadas, lecciones), y a los mensajes de commit. Luego el archivo del plan se elimina para evitar confusiones futuras.

> [!TIP]
> Un plan con post-mortem es **oro puro** para la próxima vez que hagas algo parecido. Antes de borrarlo, invierte 10 minutos en destilar lo que funcionó, lo que no funcionó y los gotchas a la memoria persistente con `mem_save type=learning`. Esa información sobrevive al borrado del plan y aparece en futuras sesiones cuando sea relevante.

## Relación con otras carpetas

| Carpeta | Qué contiene | Cuándo mirar aquí |
|:---|:---|:---|
| `planes/` | Planes de implementación en curso o pendientes | Antes de empezar un cambio grande |
| `docs/` | Documentación técnica de referencia | Para entender cómo funciona algo |
| `proyecto/` | Archivos estándar del blueprint | Para contexto general del proyecto |
| `CHANGELOG.md` | Histórico cronológico de cambios completados | Para saber qué pasó cuándo |
| `PENDIENTES.md` | Tareas activas | Para saber qué toca ahora |

## Planes actuales

(Ninguno en curso. Los planes completados se eliminan tras finalizar; su contenido queda preservado en `CHANGELOG.md`, en los mensajes de commit y en la memoria persistente de `ypc-memory`.)

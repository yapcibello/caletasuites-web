# Desviaciones — caletasuites-web

> Registro prescriptivo de desviaciones respecto al plan, la arquitectura o las convenciones del proyecto. Toda desviacion significativa debe quedar anotada aqui antes de cerrar la fase o sesion que la produjo. Aplica la Regla 0: leer este archivo COMPLETO al iniciar cierre de fase — no omitir puntos silenciosamente.

## Formato de cada entrada

```markdown
### [YYYY-MM-DD] — Titulo corto y buscable

**Que se desvio**: descripcion concisa del cambio respecto al plan/diseno original.

**Por que**: causa tecnica o decision explicita del usuario. Incluir evidencia concreta (archivo:linea, referencia a conversacion, metrica). Vaguedades como "por simplicidad" o "para iterar" NO son evidencia valida (ver skill `meta/anti-pereza-recomendaciones` seccion P4).

**Impacto**: componentes afectados, regresiones potenciales, documentacion a actualizar.

**Decision**: que se hace ahora y que queda pendiente. Si se aplaza algo, rellenar la tabla P4 abajo.

**Aprobacion del usuario**: cita literal del mensaje donde el usuario aprobo (o "automatica — dentro del alcance acordado").

**Fecha**: YYYY-MM-DD.

---
```

### Tabla P4 (cuando se aplaza trabajo)

Si la desviacion implica aplazar una pieza del plan, rellenar:

| Item aplazado | Depende de datos emergentes? | Evidencia concreta | Que se ahorra ahora vs diferido? |
|:---|:---:|:---|:---|
| (descripcion del item) | Si/No | (referencia concreta o vacio) | (coste evitado ahora vs hacerlo luego) |

Si todos los items responden "No" en la columna 2 y la evidencia esta vacia, el aplazamiento **no es valido** — hacer el trabajo ahora en vez de registrarlo como desviacion.

---

## Ejemplo (borrar esta seccion al registrar la primera desviacion real)

```markdown
### [2026-04-16] — Pipeline --ia fallo en T13; skill creado manualmente

**Que se desvio**: el plan del SDD prescribe crear el skill `gestion/checklist-cierre-fase` via `ypc skills new --ia`. Pipeline fallo por cuota de Claude CLI agotada. Se creo manualmente.

**Por que**: cuota de Claude API agotada para la cuenta (verificado con `ypc ai health`). Sin capacidad de esperar al reset del cupo en esta sesion.

**Impacto**: el skill existe pero sin el pulido IA ni self-critique. Posible gap de calidad en tabla de equivalencias y ejemplos. Revisar en proxima sesion con IA disponible.

**Decision**: skill creado manualmente cumpliendo specs S-A01 a S-A04 salvo pulido estilistico. Issue abierto en PENDIENTES.md para refinar con `--ia` cuando cuota este disponible.

**Aprobacion del usuario**: "adelante manual, no esperamos" (conversacion 2026-04-16 17:35).

**Fecha**: 2026-04-16.
```

---

## Desviaciones registradas

<!-- Anade nuevas entradas arriba de este comentario, en orden cronologico inverso (mas reciente primero). -->

*(sin desviaciones registradas todavia — al registrar la primera, borrar esta linea)*

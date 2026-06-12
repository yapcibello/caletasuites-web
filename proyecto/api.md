# API — caletasuites-web

<!-- Si el proyecto no expone API, indicar: "No aplica — este proyecto no expone API" -->

## Base URL

```
{{API_BASE_URL}}
```

## Autenticación

{{API_AUTH_DESCRIPCION}}

## Endpoints

### {{API_ENDPOINT_1}}

```
{{API_ENDPOINT_1_METHOD}} {{API_ENDPOINT_1_PATH}}
```

**Descripción**: {{API_ENDPOINT_1_DESC}}

**Parámetros**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| {{API_PARAM}} | {{API_PARAM_TIPO}} | {{API_PARAM_REQ}} | {{API_PARAM_DESC}} |

**Respuesta exitosa** (`200`):

```json
{{API_RESPONSE_EXAMPLE}}
```

**Errores**:

| Código | Descripción |
|--------|-------------|
| 400 | {{API_ERROR_400}} |
| 401 | No autorizado |
| 404 | Recurso no encontrado |

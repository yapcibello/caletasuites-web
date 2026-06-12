# Runbook — caletasuites-web

<!-- Si el proyecto no tiene operaciones en producción, indicar: "No aplica — proyecto sin despliegue operacional" -->

## Deploy

**Síntomas**: {{RUNBOOK_DEPLOY_SINTOMAS}}
**Precondiciones**: {{RUNBOOK_DEPLOY_PRECONDICIONES}}

### Pasos

```bash
{{RUNBOOK_DEPLOY_PASOS}}
```

### Verificación

- [ ] {{RUNBOOK_DEPLOY_VERIFICACION}}

## Rollback

**Cuándo activar**: {{RUNBOOK_ROLLBACK_CUANDO}}

### Pasos

```bash
{{RUNBOOK_ROLLBACK_PASOS}}
```

### Verificación post-rollback

- [ ] {{RUNBOOK_ROLLBACK_VERIFICACION}}

## Backup / Restore

**Frecuencia**: {{RUNBOOK_BACKUP_FRECUENCIA}}

### Procedimiento de backup

```bash
{{RUNBOOK_BACKUP_PASOS}}
```

### Restore

```bash
{{RUNBOOK_RESTORE_PASOS}}
```

## Debug — Problemas comunes

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| {{DEBUG_SINTOMA}} | {{DEBUG_CAUSA}} | {{DEBUG_SOLUCION}} |

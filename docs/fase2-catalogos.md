# Fase 2 — Catálogos de asuntos

Catálogos razonables usados en RDP Gestión. Son editables en código (`src/lib/catalogs.ts`) y validados en la migración SQL.

## Áreas

Civil, Laboral, Comercial, Penal, Familia, Administrativo, Tributario, Otros.

## Tipos por área

Cada área tiene un conjunto corto de tipos (p. ej. Comercial → Societario, Mercantil, Insolvencia, General). Si el despacho define tipos oficiales por área, sustituir el mapa `MATTER_TYPES_BY_AREA`.

## Etapas (pipeline / Kanban)

| Valor | Etiqueta |
|---|---|
| `ingreso` | Ingreso |
| `analisis` | Análisis |
| `actuacion` | Actuación |
| `audiencia` | Audiencia |
| `alegatos` | Alegatos |
| `fallo` | Fallo |
| `ejecucion` | Ejecución |
| `cierre` | Cierre |

## Estados

`abierto`, `en_pausa`, `cerrado`, `archivado`.

## Prioridades

`baja`, `media`, `alta`, `urgente`.

## Documentos de cliente

`NIT` (con DV), `CC`, `CE`, `PAS`, `PPT`, `OTRO`. Persona `natural` | `juridica`.

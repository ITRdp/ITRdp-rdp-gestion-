# Fase 2 — Catálogos de asuntos

Catálogos usados en RDP Gestión (`src/lib/catalogs.ts`), validados en SQL.
Áreas actualizadas post Fase 5 (migración `20261123120000_fix_festivos_areas_protect.sql`).

## Áreas (firma)

Prioridad Rojas De Paz:

| Valor | Etiqueta |
|---|---|
| `responsabilidad_seguros` | Responsabilidad & seguros |
| `empresa` | Empresa |
| `consumidor` | Consumidor |
| `insolvencia` | Insolvencia |

Complementarias:

| Valor | Etiqueta |
|---|---|
| `comercial` | Comercial |
| `tributario` | Tributario |
| `societario` | Societario |
| `otro` | Otro |

## Tipos por área

Cada área tiene un conjunto corto de tipos en `MATTER_TYPES_BY_AREA`. Sustituir si el despacho define tipos oficiales.

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

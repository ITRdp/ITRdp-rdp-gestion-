# Marca — RDP Gestión

Guía visual oficial del producto interno **RDP Gestión** (Rojas & De Paz Abogados S.A.S.).

## Colores (tokens)

Usar siempre variables CSS / `@theme`. No hardcodear hex en componentes.

| Token | Hex | Uso |
|---|---|---|
| `wine-900` | `#340613` | Fondos oscuros, sidebar, login |
| `wine-700` | `#511521` | Hover / énfasis medio |
| `wine-600` | `#430E1B` | Superficies vino secundarias |
| `gold-400` | `#D49F69` | Acentos, CTAs secundarios, focus |
| `surface` | `#FBF9F8` | Fondo de trabajo (área principal) |
| `ink` | `#1C1214` | Texto principal |
| `muted` | `#6B5A55` | Texto secundario |
| `line` | `rgba(52, 6, 19, 0.12)` | Bordes |

Escalas auxiliares (`wine-50`…`wine-950`, `gold-50`…`gold-950`, neutros) viven en `src/app/globals.css`.

## Tipografía

| Rol | Familia | Peso típico |
|---|---|---|
| Display | **Cormorant Garamond** | 500–700 |
| UI / cuerpo | **Open Sans** | 400–600 |

Archivos en `src/fonts/` (TTF locales vía `next/font/local`) para builds reproducibles sin depender de Google Fonts en CI.

- Títulos de página y marca: `font-display`.
- Formularios, nav, tablas, botones: Open Sans (`font-sans`).

## Logo y monograma

Assets oficiales en `public/brand/` (PNG con transparencia). **No reconstruir** el logo con tipografía.

| Archivo | Uso |
|---|---|
| `monogram-wine.png` | Favicon, sidebar colapsada, fondos claros |
| `monogram-gold.png` | Acento sobre fondos vino |
| `monogram-white.png` | Sobre fondos oscuros |
| `wordmark-wine.png` | Header claro / documentos |
| `wordmark-gold.png` | Acento |
| `wordmark-white.png` | Login / sidebar oscura |
| `texture-links.png` | Textura de eslabones |
| `favicon.png` | Icono de pestaña (derivado del monograma vino) |

### Do

- Usar el monograma o wordmark como `<Image>` / `<img>`.
- Mantener proporción original; altura tipica sidebar ~28–36 px (monograma) / ~24–32 px (wordmark).
- Textura de eslabones solo al **4–8 %** de opacidad en login y cabecera del sidebar.

### Don’t

- Redibujar “RDP” o “Rojas & De Paz” con Cormorant u otra fuente.
- Aplicar sombras neón, glow o filtros de color ajenos a wine/gold.
- Usar la textura a opacidad alta o como patrón dominante.

## Shell interno

- Sidebar colapsable con un solo ítem de inicio: **Mi jornada** (sin “Inicio” duplicado) + **Asuntos**.
- Top bar con búsqueda ⌘K (asuntos y clientes).
- Área de trabajo sobre `#FBF9F8`.

## Localización

Interfaz en **es-CO**: NIT (no NIF/CIF), fechas `es-CO`, placeholders con dominio colombiano (p. ej. `@despacho.co`).

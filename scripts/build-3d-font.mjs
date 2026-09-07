/**
 * Convierte un TTF al formato JSON que consume el `FontLoader` de three.js.
 *
 * Se ejecuta a mano, no en cada build: el resultado se versiona en
 * `public/fonts/`. Convertir en runtime obligaría a mandar opentype.js al
 * navegador (~200 KB) para producir algo que nunca cambia.
 *
 *   node scripts/build-3d-font.mjs public/fonts/fredoka-semibold.ttf
 *
 * Detalle del formato: en los comandos `q` y `b` de three, el PRIMER par de
 * coordenadas es el punto final y los siguientes son los de control — al revés
 * de como los entrega opentype. Invertirlos es el error clásico de esta
 * conversión y produce letras con la panza al revés.
 */
import { readFileSync, writeFileSync } from "node:fs";
import opentype from "opentype.js";

/** Caracteres a incluir. Subconjunto: el JSON completo pesaría de más. */
const SUBSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "abcdefghijklmnopqrstuvwxyz" +
  "0123456789" +
  " .,:;!?¿¡-–—'\"&()/@#%+*" +
  "ÁÉÍÓÚÜÑáéíóúüñ" +
  "ºª©™";

const RESOLUTION = 1000;

function round(value) {
  return Math.round(value * 100) / 100;
}

function glyphOutline(glyph, scale) {
  const path = glyph.getPath(0, 0, RESOLUTION);
  const parts = [];

  for (const command of path.commands) {
    switch (command.type) {
      case "M":
        parts.push("m", round(command.x * scale), round(-command.y * scale));
        break;
      case "L":
        parts.push("l", round(command.x * scale), round(-command.y * scale));
        break;
      case "Q":
        // Final primero, control después: es lo que espera three.
        parts.push(
          "q",
          round(command.x * scale),
          round(-command.y * scale),
          round(command.x1 * scale),
          round(-command.y1 * scale),
        );
        break;
      case "C":
        parts.push(
          "b",
          round(command.x * scale),
          round(-command.y * scale),
          round(command.x1 * scale),
          round(-command.y1 * scale),
          round(command.x2 * scale),
          round(-command.y2 * scale),
        );
        break;
      case "Z":
        break;
      default:
        throw new Error(`Comando de path no soportado: ${command.type}`);
    }
  }

  return parts.join(" ");
}

const input = process.argv[2];
if (!input) {
  console.error("Uso: node scripts/build-3d-font.mjs <archivo.ttf>");
  process.exit(1);
}

const font = opentype.parse(readFileSync(input).buffer.slice(0));
// `getPath` ya escala a RESOLUTION píxeles de em, así que el factor extra es 1.
const scale = 1;

const glyphs = {};
let included = 0;
let skipped = "";

for (const char of SUBSET) {
  const glyph = font.charToGlyph(char);
  if (!glyph || glyph.index === 0) {
    skipped += char;
    continue;
  }
  glyphs[char] = {
    ha: round((glyph.advanceWidth / font.unitsPerEm) * RESOLUTION),
    x_min: round(((glyph.xMin ?? 0) / font.unitsPerEm) * RESOLUTION),
    x_max: round(((glyph.xMax ?? 0) / font.unitsPerEm) * RESOLUTION),
    o: glyphOutline(glyph, scale),
  };
  included += 1;
}

const em = font.unitsPerEm;
const output = {
  glyphs,
  familyName: font.names.fullName?.en ?? "Font",
  ascender: round((font.ascender / em) * RESOLUTION),
  descender: round((font.descender / em) * RESOLUTION),
  underlinePosition: round(((font.tables.post?.underlinePosition ?? -100) / em) * RESOLUTION),
  underlineThickness: round(((font.tables.post?.underlineThickness ?? 50) / em) * RESOLUTION),
  boundingBox: {
    xMin: round((font.tables.head.xMin / em) * RESOLUTION),
    xMax: round((font.tables.head.xMax / em) * RESOLUTION),
    yMin: round((font.tables.head.yMin / em) * RESOLUTION),
    yMax: round((font.tables.head.yMax / em) * RESOLUTION),
  },
  resolution: RESOLUTION,
  original_font_information: { full_font_name: font.names.fullName?.en ?? "" },
};

const target = input.replace(/\.ttf$/i, "-3d.json");
writeFileSync(target, JSON.stringify(output));

console.log(`${target}`);
console.log(`  glifos incluidos: ${included}`);
if (skipped) console.log(`  sin glifo en la fuente: ${skipped}`);
console.log(`  tamaño: ${(JSON.stringify(output).length / 1024).toFixed(1)} KB`);

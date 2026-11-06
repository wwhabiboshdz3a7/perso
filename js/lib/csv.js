// Export CSV compatible avec Excel en français : séparateur « ; », UTF-8 avec BOM, fins de ligne CRLF.
// Les cellules qui commencent par = + - @ (ou tabulation / retour chariot) sont neutralisées
// par une apostrophe pour éviter l'exécution de formules à l'ouverture (injection CSV).

export const BOM = '﻿';
export const SEP = ';';

export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let s = typeof value === 'number'
    ? (Number.isFinite(value) ? String(value).replace('.', ',') : '')
    : String(value);
  if (typeof value !== 'number' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[";\r\n]/.test(s) || /^\s|\s$/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * @param {Array<object>} rows
 * @param {Array<{key:string, label:string, get?:(row:object)=>any}>} columns
 */
export function toCSV(rows, columns) {
  const head = columns.map((c) => csvCell(c.label)).join(SEP);
  const body = rows.map((r) => columns.map((c) => csvCell(c.get ? c.get(r) : r[c.key])).join(SEP));
  return BOM + [head, ...body].join('\r\n') + '\r\n';
}

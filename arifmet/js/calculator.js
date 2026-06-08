// version: ORIGINAL_STABLE - Restored Core with parseAdditionData
export function evaluateExpr(str) {
 try {
  const clean = str.replace(/[^0-9+\-]/g, '');
  if (!clean) return null;
  const match = clean.match(/^([0-9]+)([+\-])([0-9]+)$/);
  if (!match) return null;
  const num1 = parseInt(match[1], 10);
  const op = match[2];
  const num2 = parseInt(match[3], 10);
  if (op === '+') return num1 + num2;
  if (op === '-') return num1 - num2;
  return null;
 } catch (e) {
  return null;
 }
}

export function parseAdditionData(exprStr) {
 const clean = exprStr.replace(/[^0-9+]/g, '');
 const parts = clean.split('+');
 if (parts.length !== 2) return { num1: 0, num2: 0 };
 return {
  num1: parseInt(parts[0], 10) || 0,
  num2: parseInt(parts[1], 10) || 0
 };
}

export function parseMultiplicationData(exprStr) {
 const clean = exprStr.replace(/[^0-9×]/g, '');
 const parts = clean.split('×');
 if (parts.length !== 2) return { monsters: 0, items: 0 };
 return {
  monsters: parseInt(parts[0], 10) || 0,
  items: parseInt(parts[1], 10) || 0
 };
}

export function buildNumberStructure(num) {
 const str = String(num);
 const len = str.length;
 const structure = { hundreds: 0, tens: 0, units: 0 };
 if (len >= 1) structure.units = parseInt(str[len - 1], 10) || 0;
 if (len >= 2) structure.tens = parseInt(str[len - 2], 10) || 0;
 if (len >= 3) structure.hundreds = parseInt(str[len - 3], 10) || 0;
 return structure;
}

export function getDifferenceStructure(num1, num2) {
 const struct1 = buildNumberStructure(num1);
 const struct2 = buildNumberStructure(num2);
 const resUnits = struct1.units - struct2.units;
 const resTens = struct1.tens - struct2.tens;
 const resHundreds = struct1.hundreds - struct2.hundreds;
 return {
  u: resUnits >= 0 ? resUnits : resUnits + 10,
  t: resTens >= 0 ? resTens : resTens + 10,
  h: resHundreds >= 0 ? resHundreds : 0,
  borrowTens: resUnits < 0 ? 1 : 0,
  borrowHundreds: resTens < 0 ? 1 : 0
 };
}

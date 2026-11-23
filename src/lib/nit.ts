/** Dígito de verificación NIT Colombia (módulo 11). */
export function nitCheckDigit(nitDigits: string): string | null {
  const clean = nitDigits.replace(/\D/g, "");
  if (!clean) return null;
  const weights = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
  const nums = clean.split("").map(Number);
  let sum = 0;
  const start = weights.length - nums.length;
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i]! * weights[start + i]!;
  }
  const mod = sum % 11;
  if (mod > 1) return String(11 - mod);
  return String(mod);
}

export function formatDocument(
  type: string | null | undefined,
  number: string | null | undefined,
  dv?: string | null,
): string {
  if (!number) return "—";
  if (type === "NIT" && dv) return `${number}-${dv}`;
  return type ? `${type} ${number}` : number;
}

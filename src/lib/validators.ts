import { z } from "zod";
import { nitCheckDigit } from "@/lib/nit";

const digitsOnly = (s: string) => s.replace(/\D/g, "");

export const nitSchema = z
  .string()
  .trim()
  .min(1, "NIT obligatorio")
  .refine((v) => /^\d+$/.test(digitsOnly(v)) && digitsOnly(v).length >= 5, {
    message: "El NIT solo admite dígitos (sin letras ni símbolos).",
  })
  .transform(digitsOnly);

export function computeNitDv(nit: string): string {
  const dv = nitCheckDigit(digitsOnly(nit));
  if (dv === null) throw new Error("NIT inválido");
  return dv;
}

export function verifyNitDv(nit: string, dv: string): boolean {
  return computeNitDv(nit) === String(dv).trim();
}

export const ccCeSchema = z
  .string()
  .trim()
  .min(1)
  .refine((v) => /^\d{5,12}$/.test(digitsOnly(v)), {
    message: "Documento numérico de 5 a 12 dígitos.",
  })
  .transform(digitsOnly);

export const phoneCoSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? digitsOnly(v) : null))
  .refine(
    (v) => v === null || /^3\d{9}$/.test(v) || /^57\d{10}$/.test(v),
    {
      message: "Celular colombiano: 10 dígitos iniciando en 3 (opcional +57).",
    },
  )
  .transform((v) => {
    if (!v) return null;
    if (v.startsWith("57") && v.length === 12) return v.slice(2);
    return v;
  });

export const emailSchema = z
  .string()
  .trim()
  .email("Correo inválido")
  .or(z.literal(""))
  .transform((v) => v || null);

export const radicadoSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? digitsOnly(v) : null))
  .refine((v) => v === null || /^\d{23}$/.test(v), {
    message: "El radicado debe tener exactamente 23 dígitos.",
  });

export const copAmountSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return v;
    const n = Number(String(v).replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  })
  .refine((v) => v === null || (typeof v === "number" && v >= 0), {
    message: "Monto inválido.",
  });

export function documentNumberSchema(type: string) {
  if (type === "NIT") return nitSchema;
  if (type === "CC" || type === "CE") return ccCeSchema;
  return z.string().trim().min(1, "Número de documento obligatorio");
}

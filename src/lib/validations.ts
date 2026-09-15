import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100).optional(),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña es demasiado larga"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const betStatusEnum = z.enum(["PENDING", "WON", "LOST", "VOID"]);
export const betTypeEnum = z.enum([
  "MONEYLINE",
  "SPREAD",
  "OVER_UNDER",
  "PARLAY",
  "PROP",
  "FUTURES",
  "OTHER",
]);

export const createBetSchema = z.object({
  sportsbookId: z.string().min(1, "Selecciona una casa de apuestas"),
  sportId: z.string().min(1, "Selecciona un deporte"),
  leagueId: z.string().optional().nullable(),
  event: z.string().min(1, "El evento es requerido").max(200),
  betType: betTypeEnum,
  selection: z.string().min(1, "La selección es requerida").max(200),
  odds: z.coerce.number().gt(1.0, "La cuota debe ser mayor a 1.00").max(1000),
  stake: z.coerce.number().gt(0, "El monto debe ser mayor a 0"),
  eventDate: z.coerce.date(),
  status: betStatusEnum.optional().default("PENDING"),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateBetSchema = createBetSchema.partial().extend({
  status: betStatusEnum.optional(),
});

export const bankrollTxTypeEnum = z.enum(["DEPOSIT", "WITHDRAWAL", "BONUS", "ADJUSTMENT"]);

export const createBankrollTxSchema = z.object({
  type: bankrollTxTypeEnum,
  amount: z.coerce.number(),
  note: z.string().max(500).optional().nullable(),
  date: z.coerce.date().optional(),
});

export const userLimitsSchema = z.object({
  dailyStakeLimit: z.coerce.number().positive().optional().nullable(),
  weeklyStakeLimit: z.coerce.number().positive().optional().nullable(),
  monthlyStakeLimit: z.coerce.number().positive().optional().nullable(),
  maxBetsPerDay: z.coerce.number().int().positive().optional().nullable(),
  lossLimitAlert: z.coerce.number().positive().optional().nullable(),
});

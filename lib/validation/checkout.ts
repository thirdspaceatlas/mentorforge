import { z } from "zod";
import { examWindowSchema } from "@/lib/plan/exam-expiry";

export const checkoutBodySchema = z.discriminatedUnion("planKey", [
  z.object({
    planKey: z.literal("level_pass"),
    priceId: z.string().min(1),
    examWindow: examWindowSchema,
    examYear: z.number().int().min(2020).max(2100),
    levelUnlocked: z.enum(["I", "II", "III"])
  }),
  z.object({
    planKey: z.literal("all_access"),
    priceId: z.string().min(1)
  })
]);

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;

import { z } from "zod";

export const schema = z.object({
  reviews: z.array(z.object({
    value: z.string()
  })).optional(),
  emailFlows: z.array(z.object({
    value: z.string()
  })).optional(),
  confirmationSubject: z.string().max(120),
  confirmationBody: z.string().max(2000),
  orderBump: z.object({
    enabled: z.boolean(),
    productName: z.string().max(100).optional(),
    description: z.string().max(300).optional(),
    price: z.number().min(0).optional(),
    image: z.instanceof(File).nullable().optional(),
  }).optional(),
  affiliateShare: z.object({
    enabled: z.boolean(),
    commissionRate: z.number().min(0).max(100).optional(),
    minPayout: z.number().min(0).optional(),
    cookieDuration: z.number().min(1).max(365).optional(),
  }).optional(),
});

export type OptionsProSchema = z.infer<typeof schema>; 
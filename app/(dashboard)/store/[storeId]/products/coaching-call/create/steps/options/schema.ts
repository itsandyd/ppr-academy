import { z } from "zod";

export const Recipient = z.object({
  delay: z.number().min(0),
  audience: z.enum(['new', 'past']),
});

export const Flow = z.object({
  id: z.string(),
  subject: z.string().max(120),
  body: z.string().max(2000),
  recipients: z.array(Recipient),
});

export const schema = z.object({
  reviews: z.array(z.string()),
  flows: z.array(Flow),
  confirmationSubject: z.string(),
  confirmationBody: z.string(),
  orderBump: z.object({
    enabled: z.boolean(),
    title: z.string().optional(),
    price: z.number().optional(),
  }).optional(),
  affiliateShare: z.object({
    enabled: z.boolean(),
    percentage: z.number().optional(),
  }).optional(),
});

export type OptionsSchema = z.infer<typeof schema>; 
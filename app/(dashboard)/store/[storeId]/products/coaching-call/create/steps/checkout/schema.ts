import { z } from "zod";

export const schema = z.object({
  title: z.string().min(1, "Title is required").max(80, "Title too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  duration: z.number().min(15, "Minimum 15 minutes").max(480, "Maximum 8 hours"),
  price: z.number().min(0, "Price must be positive"),
  sessionType: z.enum(['video', 'audio', 'phone']),
  fields: z.array(z.object({
    label: z.string().min(1, "Field label required"),
    type: z.enum(['text', 'email', 'phone', 'textarea']),
    required: z.boolean(),
  })).optional(),
});

export type CheckoutSchema = z.infer<typeof schema>; 
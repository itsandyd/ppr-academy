import { z } from "zod";

export const schema = z.object({
  image: z.instanceof(File).nullable().optional(),
  title: z.string().min(1, "Title is required").max(50),
  body: z.string().max(1500).optional(),
  buttonTitle: z.string().min(1, "Button title is required").max(30),
  cta: z.string().min(1, "Call-to-action is required").max(20),
  price: z.number().min(0),
  discountPrice: z.number().optional(),
  fields: z.array(z.object({
    name: z.string().min(1, "Field name is required")
  })).optional(),
});

export type CheckoutSchema = z.infer<typeof schema>; 
import { z } from "zod";

export const schema = z.object({
  style: z.enum(["button", "callout", "preview"]),
  title: z.string().min(1, "Title is required").max(50),
  subtitle: z.string().max(100).optional(),
  buttonLabel: z.string().min(1, "Button label is required").max(30),
  image: z.instanceof(File).optional(),
});

export type ThumbnailStyleSchema = z.infer<typeof schema>; 
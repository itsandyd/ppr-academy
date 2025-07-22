import { z } from "zod";

export const schema = z.object({
  style: z.enum(['button', 'callout', 'preview']),
  title: z.string().min(1).max(50),
  image: z.instanceof(File).optional(),
});

export type ThumbnailSchema = z.infer<typeof schema>; 
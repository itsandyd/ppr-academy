import { z } from "zod";

export const schema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Title must be 50 characters or less"),
  subtitle: z.string().max(100, "Subtitle must be 100 characters or less").optional(),
  button: z.string().min(1, "Button text is required").max(30, "Button text must be 30 characters or less"),
});

export type ThumbnailSchema = z.infer<typeof schema>; 
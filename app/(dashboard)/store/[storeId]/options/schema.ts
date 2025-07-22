import { z } from "zod";

export const schema = z.object({
  emailFlows: z.boolean(),
  confirmationSubject: z.string().max(120).optional(),
  confirmationBody: z.string().max(1000).optional(),
});

export type OptionsSchema = z.infer<typeof schema>; 
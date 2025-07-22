import { z } from "zod";

export const schema = z.object({
  template: z.string(),
  duration: z.number().min(5),
  timezone: z.string(),
  leadTimeHours: z.number().min(0),
  maxAttendees: z.number().min(1).max(20),
  bufferBefore: z.number().optional(),
  bufferAfter: z.number().optional(),
  advanceDays: z.number().min(0),
  availability: z.record(
    z.array(
      z.object({
        from: z.string(),
        to: z.string(),
      })
    )
  ),
});

export type AvailabilitySchema = z.infer<typeof schema>; 
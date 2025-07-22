import { z } from "zod";

export const schema = z.object({
  // Lead magnet resource - either file upload or URL
  resourceType: z.enum(["file", "url"]),
  resourceFile: z.string().optional(),
  resourceUrl: z.string().optional(),
}).superRefine((data, ctx) => {
  console.log("🔍 Schema validation - data:", data);
  
  if (data.resourceType === "file") {
    if (!data.resourceFile || data.resourceFile.trim().length === 0) {
      console.log("❌ File validation failed - no resourceFile");
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please upload a file",
        path: ["resourceFile"],
      });
    } else {
      console.log("✅ File validation passed - resourceFile:", data.resourceFile);
    }
  } else if (data.resourceType === "url") {
    if (!data.resourceUrl || data.resourceUrl.trim().length === 0) {
      console.log("❌ URL validation failed - no resourceUrl");
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide a URL",
        path: ["resourceUrl"],
      });
    } else {
      console.log("✅ URL validation passed - resourceUrl:", data.resourceUrl);
    }
  }
});

export type ProductSchema = z.infer<typeof schema>; 
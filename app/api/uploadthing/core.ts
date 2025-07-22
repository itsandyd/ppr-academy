import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  // Audio uploader for course chapters
  audioUploader: f({ audio: { maxFileSize: "16MB" } })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Audio upload complete for userId:", metadata.userId);
      console.log("Audio file URL:", file.url);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Image uploader for course content
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Image upload complete for userId:", metadata.userId);
      console.log("Image file URL:", file.url);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Avatar uploader for user profiles
  avatarUploader: f({ image: { maxFileSize: "2MB" } })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Avatar upload complete for userId:", metadata.userId);
      console.log("Avatar file URL:", file.url);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Document uploader for lead magnets and digital products
  documentUploader: f({ 
    "application/pdf": { maxFileSize: "128MB" },
    "application/msword": { maxFileSize: "128MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "128MB" },
    "text/plain": { maxFileSize: "128MB" },
    "application/zip": { maxFileSize: "256MB" },
    "application/epub+zip": { maxFileSize: "128MB" }
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Document upload complete for userId:", metadata.userId);
      console.log("Document file URL:", file.url);
      console.log("Document file type:", file.type);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, url: file.url, name: file.name, type: file.type };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { connectToDatabase } from "@/lib/database";
import Media from "@/lib/database/models/media.model";
import { requirePermission } from "@/lib/auth/rbac";

import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter = {
  mediaUploader: f({
    image: { maxFileSize: "8MB" },
  })
    .input(z.object({ folder: z.string().optional() }))
    .middleware(async ({ req, input }) => {
      await requirePermission("media", "create");
      console.log("UploadThing middleware called!", { reqUrl: req.url, input });
      const url = new URL(req.url);
      const queryFolder = url.searchParams.get("folder");
      const folder = input?.folder || queryFolder || "Root";
      return { folder };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete!", file);
      try {
        await connectToDatabase();

        const newMedia = await Media.create({
          name: file.name,
          url: file.ufsUrl,
          size: file.size,
          mimeType: file.type,
          folder: metadata.folder,
          altText: file.name.split(".")[0], // default alt text is filename without extension
        });

        console.log("✅ Asset saved to Media collection:", newMedia._id);
        return { mediaId: newMedia._id.toString() };
      } catch (error) {
        console.error(
          "❌ Failed to save uploaded file to Media collection:",
          error,
        );
        // Don't fail the upload, just log the error
        return { success: true, mediaId: null };
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

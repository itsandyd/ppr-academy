import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Script from "next/script";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const projectFile = await fetchQuery(api.projectFiles.getProjectFileBySlug, { slug });

    if (!projectFile) {
      return {
        title: "Project File Not Found",
        description: "The project file you're looking for could not be found.",
      };
    }

    const pageUrl = `${baseUrl}/marketplace/project-files/${slug}`;
    const description = projectFile.description
      ? stripHtml(projectFile.description).substring(0, 155)
      : `DAW project file for ${projectFile.dawType || "music production"} on PausePlayRepeat.`;

    return {
      title: `${projectFile.title} | Project File | PausePlayRepeat`,
      description,
      keywords: `project file, ${projectFile.dawType || "DAW"} project, session file, production file`,
      openGraph: {
        title: `${projectFile.title} | PausePlayRepeat`,
        description,
        url: pageUrl,
        siteName: "PausePlayRepeat",
        type: "website",
        images: projectFile.imageUrl ? [{ url: projectFile.imageUrl, width: 1200, height: 630, alt: projectFile.title }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${projectFile.title} | PausePlayRepeat`,
        description,
        images: projectFile.imageUrl ? [projectFile.imageUrl] : undefined,
      },
      alternates: { canonical: pageUrl },
      other: projectFile.price != null
        ? { "product:price:amount": String(projectFile.price / 100), "product:price:currency": "USD" }
        : undefined,
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: "Project File | PausePlayRepeat",
      description: "Download DAW project files on PausePlayRepeat.",
    };
  }
}

export default async function ProjectFileDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  let structuredData: object | null = null;

  try {
    const { slug } = await params;
    const projectFile = await fetchQuery(api.projectFiles.getProjectFileBySlug, { slug });

    if (projectFile) {
      const pageUrl = `${baseUrl}/marketplace/project-files/${slug}`;
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: projectFile.title,
        description: projectFile.description ? stripHtml(projectFile.description).substring(0, 200) : undefined,
        image: projectFile.imageUrl || undefined,
        url: pageUrl,
        category: "Project File",
        offers: {
          "@type": "Offer",
          price: (projectFile.price || 0) / 100,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: pageUrl,
        },
      };
    }
  } catch { /* skip */ }

  return (
    <>
      {structuredData && (
        <Script
          id="project-file-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          strategy="afterInteractive"
        />
      )}
      {children}
    </>
  );
}

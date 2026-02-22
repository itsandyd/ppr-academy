import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Mixing & Mastering Services | PausePlayRepeat Marketplace",
  description:
    "Hire professional mixing and mastering engineers for your tracks. Browse services by price, turnaround time, and genre specialization.",
  keywords:
    "mixing services, mastering services, online mixing, online mastering, hire mix engineer, professional mixing, stem mixing",
  openGraph: {
    title: "Mixing & Mastering Services | PausePlayRepeat Marketplace",
    description:
      "Hire professional mixing and mastering engineers for your tracks.",
    url: `${baseUrl}/marketplace/mixing-services`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mixing & Mastering Services | PausePlayRepeat",
    description:
      "Hire professional mixing and mastering engineers for your tracks.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/mixing-services`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MixingServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

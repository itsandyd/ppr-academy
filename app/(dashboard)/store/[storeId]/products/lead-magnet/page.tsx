"use client";

import { useSearchParams } from "next/navigation";
import { ThumbnailForm } from "./components/ThumbnailForm";
import { ProductForm } from "./product/ProductForm";
import { OptionsForm } from "./components/OptionsForm";

export default function LeadMagnetPage() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "thumbnail";

  switch (step) {
    case "product":
      return <ProductForm />;
    case "options":
      return <OptionsForm />;
    case "thumbnail":
    default:
      return <ThumbnailForm />;
  }
} 
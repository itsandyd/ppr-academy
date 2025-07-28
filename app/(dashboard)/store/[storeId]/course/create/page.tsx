"use client";

import { ThumbnailForm } from "./steps/ThumbnailForm";
import { CheckoutForm } from "./steps/CheckoutForm";
import { CourseContentForm } from "./steps/CourseContentForm";
import { OptionsForm } from "./steps/OptionsForm";
import { useSearchParams } from "next/navigation";

export default function CreateCoursePage() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "thumbnail";

  const renderStep = () => {
    switch (step) {
      case "checkout":
        return <CheckoutForm />;
      case "course":
        return <CourseContentForm />;
      case "options":
        return <OptionsForm />;
      default:
        return <ThumbnailForm />;
    }
  };

  return renderStep();
} 
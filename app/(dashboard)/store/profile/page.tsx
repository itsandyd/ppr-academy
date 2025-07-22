import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HeaderForm } from "./components/HeaderForm";
import { PhonePreview } from "./components/PhonePreview";

export default function HeaderEditPage() {
  return (
    <div className="min-h-screen">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 pt-10 pb-24">
        <div className="lg:flex lg:gap-16">
          <div className="lg:flex-[2]">
            <HeaderForm />
          </div>
          <div className="lg:flex-[1] mt-12 lg:mt-0">
            <PhonePreview />
          </div>
        </div>
      </div>
    </div>
  );
} 
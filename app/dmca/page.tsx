import { Metadata } from "next";
import { DMCAContent } from "./components/dmca-content";

export const metadata: Metadata = {
  title: "DMCA Policy | PPR Academy",
  description:
    "Digital Millennium Copyright Act (DMCA) policy and takedown request process for PPR Academy.",
};

export default function DMCAPage() {
  return (
    <div className="container max-w-4xl px-4 py-8 md:py-12">
      <DMCAContent />
    </div>
  );
}

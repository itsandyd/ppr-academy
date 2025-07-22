import { Card } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface OptionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tint: string;
  onClick?: () => void;
}

export function OptionCard({ title, subtitle, icon: Icon, tint, onClick }: OptionCardProps) {
  return (
    <Card className="group min-h-[96px] border border-[#EEF0FA] shadow-[0_6px_14px_rgba(16,24,40,.04)] transition-colors hover:border-[#6356FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6356FF]/40 cursor-pointer">
      <button 
        type="button" 
        onClick={onClick}
        className="w-full h-full flex items-center gap-6 px-6 py-4 text-left focus:outline-none"
      >
        <div
          className="flex-none w-16 h-16 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: tint }}
        >
          <Icon size={28} className="text-[#6356FF]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[#0F0F1C] leading-tight">
            {title}
          </h3>
          <p className="text-sm font-normal text-[#6B6E85] mt-1 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </button>
    </Card>
  );
} 
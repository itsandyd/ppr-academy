import { Card } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface OptionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  colorClass: string;
  iconColorClass?: string;
  onClick?: () => void;
}

export function OptionCard({ title, subtitle, icon: Icon, colorClass, iconColorClass, onClick }: OptionCardProps) {
  return (
    <Card className="group min-h-[96px] border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 cursor-pointer hover:shadow-md transition-all duration-200 dark:hover:shadow-lg dark:hover:shadow-black/5">
      <button 
        type="button" 
        onClick={onClick}
        className="w-full h-full flex items-center gap-6 px-6 py-4 text-left focus:outline-none group-hover:bg-muted/30 transition-colors duration-200"
      >
        <div
          className={`flex-none w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-200 ${colorClass}`}
        >
          <Icon size={28} className={`${iconColorClass || 'text-primary'} group-hover:scale-105 transition-transform duration-200`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground leading-tight group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          <p className="text-sm font-normal text-muted-foreground mt-1 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </button>
    </Card>
  );
} 
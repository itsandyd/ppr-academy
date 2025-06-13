import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardTabsProps {
  defaultValue: string;
  children: React.ReactNode;
}

export function DashboardTabs({ defaultValue, children }: DashboardTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className="space-y-6">
      {children}
    </Tabs>
  );
} 
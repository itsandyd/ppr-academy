"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Trash2, 
  Edit, 
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Download,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "destructive";
  action: (selectedIds: string[]) => void;
}

interface BulkSelectionTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    label: string;
    render: (item: T) => React.ReactNode;
  }>;
  bulkActions?: BulkAction[];
  getItemId: (item: T) => string;
  className?: string;
}

export function BulkSelectionTable<T>({
  data,
  columns,
  bulkActions = [],
  getItemId,
  className
}: BulkSelectionTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allIds = data.map(getItemId);
  const isAllSelected = selectedIds.length === data.length && data.length > 0;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = (action: BulkAction) => {
    action.action(selectedIds);
    setSelectedIds([]); // Clear selection after action
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200">
                {selectedIds.length} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Clear Selection
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {bulkActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant={action.variant || "default"}
                    size="sm"
                    onClick={() => handleBulkAction(action)}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="w-12 p-4 text-left">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                  className={cn(
                    isSomeSelected && "data-[state=checked]:bg-purple-500"
                  )}
                />
              </th>
              {columns.map((column) => (
                <th key={column.key} className="p-4 text-left font-semibold text-sm">
                  {column.label}
                </th>
              ))}
              <th className="w-12 p-4"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const id = getItemId(item);
              const isSelected = selectedIds.includes(id);

              return (
                <tr
                  key={id}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/30",
                    isSelected && "bg-purple-50 dark:bg-purple-900/10"
                  )}
                >
                  <td className="p-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItem(id)}
                      aria-label={`Select item ${id}`}
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className="p-4 text-sm">
                      {column.render(item)}
                    </td>
                  ))}
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-black">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Contact
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selection Summary */}
      {selectedIds.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {selectedIds.length} of {data.length} items selected
        </p>
      )}
    </div>
  );
}

// Preset bulk actions for common use cases
export const userBulkActions: BulkAction[] = [
  {
    id: "email",
    label: "Email Selected",
    icon: Mail,
    action: (_ids) => { /* TODO: Implement email users */ }
  },
  {
    id: "promote",
    label: "Promote to Creator",
    icon: Crown,
    action: (_ids) => { /* TODO: Implement promote users */ }
  },
  {
    id: "suspend",
    label: "Suspend",
    icon: XCircle,
    variant: "destructive",
    action: (_ids) => { /* TODO: Implement suspend users */ }
  }
];

export const productBulkActions: BulkAction[] = [
  {
    id: "publish",
    label: "Publish",
    icon: CheckCircle2,
    action: (_ids) => { /* TODO: Implement publish products */ }
  },
  {
    id: "unpublish",
    label: "Unpublish",
    icon: XCircle,
    action: (_ids) => { /* TODO: Implement unpublish products */ }
  },
  {
    id: "export",
    label: "Export Data",
    icon: Download,
    action: (_ids) => { /* TODO: Implement export products */ }
  },
  {
    id: "delete",
    label: "Delete",
    icon: Trash2,
    variant: "destructive",
    action: (_ids) => { /* TODO: Implement delete products */ }
  }
];


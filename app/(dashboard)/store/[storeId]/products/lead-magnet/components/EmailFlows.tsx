"use client";

import { useFieldArray, Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { nanoid } from "nanoid";

interface EmailFlowsProps {
  control: Control<any>;
}

interface EmailFlow {
  id: string;
  subject: string;
  body: string;
  recipients: any[];
}

function emptyFlow(): EmailFlow {
  return {
    id: nanoid(),
    subject: "",
    body: "",
    recipients: []
  };
}

export function EmailFlows({ control }: EmailFlowsProps) {
  const { fields, append } = useFieldArray({
    control,
    name: "flows",
  });

  // If no flows exist, show the callout tile
  if (fields.length === 0) {
    return (
      <Card className="bg-primary/5 p-5 flex items-center justify-between rounded-xl border-none">
        <div>
          <p className="font-semibold text-[15px] leading-6">Add an Email Flow</p>
          <p className="text-muted-foreground text-[13px] leading-5 mt-1">
            Send an automatic email drip to your customers when this product is purchased.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => append(emptyFlow())}
          className="bg-primary hover:bg-primary/90 h-8 px-5 text-primary-foreground rounded-lg"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Flow
        </Button>
      </Card>
    );
  }

  // If flows exist, show the flow management interface
  return (
    <div className="space-y-4">
      {/* Email flow management would go here */}
      <div className="text-center py-8">
        <p className="text-muted-foreground">Email flow editor coming soon</p>
      </div>
      
      <Button
        type="button"
        onClick={() => append(emptyFlow())}
        variant="outline"
        className="w-full border-dashed border-primary text-primary hover:bg-primary/5"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Flow
      </Button>
    </div>
  );
} 
"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Loader2, Image, FileIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  conversationId: Id<"dmConversations">;
}

interface PendingFile {
  id: string;
  file: File;
  preview?: string;
}

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const [messageText, setMessageText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = useMutation(api.directMessages.sendMessage);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const newPendingFiles: PendingFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));

    setPendingFiles((prev) => [...prev, ...newPendingFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const uploadFiles = async () => {
    if (pendingFiles.length === 0) return [];

    setIsUploading(true);
    const uploadedFiles: {
      id: string;
      name: string;
      storageId: string;
      size: number;
      type: string;
    }[] = [];

    try {
      for (const pending of pendingFiles) {
        const uploadUrl = await generateUploadUrl();

        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": pending.file.type },
          body: pending.file,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${pending.file.name}`);
        }

        const { storageId } = await response.json();

        uploadedFiles.push({
          id: pending.id,
          name: pending.file.name,
          storageId,
          size: pending.file.size,
          type: pending.file.type,
        });
      }

      return uploadedFiles;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() && pendingFiles.length === 0) return;

    setIsSending(true);

    try {
      let attachments: {
        id: string;
        name: string;
        storageId: string;
        size: number;
        type: string;
      }[] = [];

      if (pendingFiles.length > 0) {
        attachments = await uploadFiles();
      }

      await sendMessage({
        conversationId,
        content: messageText.trim() || (pendingFiles.length > 0 ? "Sent an attachment" : ""),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // Clear state
      setMessageText("");
      pendingFiles.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setPendingFiles([]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = isSending || isUploading;
  const canSend = (messageText.trim() || pendingFiles.length > 0) && !isDisabled;

  return (
    <div className="border-t bg-background p-4">
      {/* Pending files preview */}
      {pendingFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {pendingFiles.map((pending) => (
            <div
              key={pending.id}
              className="relative flex items-center gap-2 rounded-lg border bg-muted/50 p-2 pr-8"
            >
              {pending.preview ? (
                <img
                  src={pending.preview}
                  alt={pending.file.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{pending.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(pending.file.size)}
                </p>
              </div>
              <button
                onClick={() => removeFile(pending.id)}
                className="absolute right-1 top-1 rounded-full p-1 hover:bg-muted"
                disabled={isDisabled}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.zip,.mp3,.wav"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="relative flex-1">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-32 resize-none pr-12"
            disabled={isDisabled}
            rows={1}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0"
          size="icon"
        >
          {isSending || isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

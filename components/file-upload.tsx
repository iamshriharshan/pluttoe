"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/firestore";
import type { UploadKind, UploadedFileAsset } from "@/types";

const rules: Record<
  UploadKind,
  { accept: string; maxSize: number; label: string }
> = {
  resume: {
    accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    maxSize: 5 * 1024 * 1024,
    label: "PDF, DOC, DOCX up to 5MB",
  },
  portfolio: {
    accept: ".pdf,.ppt,.pptx,.zip,.doc,.docx,image/*",
    maxSize: 10 * 1024 * 1024,
    label: "Decks, docs, zips, or images up to 10MB",
  },
  logo: {
    accept: "image/png,image/jpeg,image/webp,image/svg+xml",
    maxSize: 10 * 1024 * 1024,
    label: "PNG, JPG, WEBP, SVG up to 10MB",
  },
};

interface FileUploadProps {
  kind: UploadKind;
  userId: string;
  onUploaded: (asset: UploadedFileAsset) => Promise<void> | void;
}

export function FileUpload({ kind, userId, onUploaded }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file?: File | null) {
    if (!file) return;
    const config = rules[kind];

    if (file.size > config.maxSize) {
      toast.error(`File is too large. ${config.label}`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const asset = await uploadFile({
        userId,
        kind,
        file,
        onProgress: setProgress,
      });
      await onUploaded(asset);
      toast.success("Upload complete");
    } catch (error) {
      console.error(error);
      toast.error(
        kind === "logo" && error instanceof Error
          ? error.message
          : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[24px] border border-dashed border-zinc-300 bg-zinc-50/80 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium capitalize text-zinc-950">{kind}</p>
          <p className="text-xs text-zinc-500">{rules[kind].label}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading..." : "Choose file"}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={rules[kind].accept}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {uploading ? <Progress value={progress} /> : null}
    </div>
  );
}

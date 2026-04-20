"use client";

import type { JSX } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WorkflowDeleteDialogProps = {
  open: boolean;
  workflowName: string;
  isDeleting: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function WorkflowDeleteDialog({
  open,
  workflowName,
  isDeleting,
  error = "",
  onClose,
  onConfirm,
}: WorkflowDeleteDialogProps): JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md rounded-[28px] border-white/70 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <CardHeader className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <CardTitle>Delete workflow?</CardTitle>
            <CardDescription className="leading-6">
              <span className="font-medium text-slate-800">{workflowName}</span> will be removed
              from your dashboard. This action cannot be undone.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isDeleting ? "Deleting..." : "Delete workflow"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState, type JSX } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WorkflowSaveDialogProps = {
  open: boolean;
  defaultName: string;
  defaultDescription?: string;
  mode: "create" | "update";
  isSaving: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
};

export function WorkflowSaveDialog({
  open,
  defaultName,
  defaultDescription = "",
  mode,
  isSaving,
  error = "",
  onClose,
  onSubmit,
}: WorkflowSaveDialogProps): JSX.Element | null {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(defaultName);
    setDescription(defaultDescription);
    setNameError("");
  }, [defaultDescription, defaultName, open]);

  if (!open) {
    return null;
  }

  function handleSubmit(): void {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("Please enter a workflow name.");
      return;
    }

    setNameError("");
    onSubmit(trimmedName, description.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md rounded-[28px] border-white/70 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Save workflow" : "Save changes"}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Give this workflow a name before saving it to your dashboard."
              : "Update the workflow name and save your latest changes."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-2" htmlFor="workflow-name">
            <span className="text-sm font-medium text-slate-800">Workflow name</span>
            <input
              id="workflow-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError("");
              }}
              placeholder="Enter workflow name"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label className="block space-y-2" htmlFor="workflow-description">
            <span className="text-sm font-medium text-slate-800">
              Description
              <span className="ml-2 text-xs font-normal text-slate-500">(Optional)</span>
            </span>
            <textarea
              id="workflow-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a short note about this workflow"
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          {nameError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {nameError}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSaving}>
              {isSaving
                ? mode === "create"
                  ? "Saving..."
                  : "Updating..."
                : mode === "create"
                  ? "Save workflow"
                  : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

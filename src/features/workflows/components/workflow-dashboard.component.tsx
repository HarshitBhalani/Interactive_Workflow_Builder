"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type JSX } from "react";
import { ArrowRight, FolderOpen, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/context/auth.context";
import { LogoutButton } from "@/features/auth/components/logout-button.component";
import { deleteWorkflowDocument, getUserWorkflowDocuments } from "@/features/workflows/services/workflow.service";
import type { SavedWorkflowRecord } from "@/features/workflows/types/workflow-doc.type";

function formatWorkflowDate(value: string | null): string {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function WorkflowDashboard(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<SavedWorkflowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const activeUser = user;
    let isCancelled = false;

    async function loadWorkflows(): Promise<void> {
      setIsLoading(true);
      setError("");

      const result = await getUserWorkflowDocuments(activeUser.uid);

      if (isCancelled) {
        return;
      }

      if (!result.success) {
        setError(result.message);
        setWorkflows([]);
        setIsLoading(false);
        return;
      }

      setWorkflows(result.workflows);
      setIsLoading(false);
    }

    void loadWorkflows();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  async function handleDeleteWorkflow(workflowId: string): Promise<void> {
    const isConfirmed = window.confirm("Delete this workflow?");

    if (!isConfirmed) {
      return;
    }

    setDeletingWorkflowId(workflowId);
    setError("");

    const result = await deleteWorkflowDocument({ workflowId });

    if (!result.success) {
      setError(result.message);
      setDeletingWorkflowId(null);
      return;
    }

    setWorkflows((currentWorkflows) =>
      currentWorkflows.filter((workflow) => workflow.id !== workflowId),
    );
    setDeletingWorkflowId(null);
  }

  return (
    <main className="h-screen overflow-hidden bg-[#edf0f2] px-3 py-3 text-foreground sm:px-6 sm:py-4">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[20px] border border-black/8 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <header className="flex flex-col gap-4 border-b border-black/8 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
              Dashboard
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Saved workflows
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Create, open, and manage the workflows saved to your account.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <LogoutButton />
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => router.push("/workflows/new")}
            >
              <Plus className="h-4 w-4" />
              New workflow
            </Button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-[18rem] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600" />
                <p className="mt-4 text-sm font-medium text-slate-600">
                  Loading your workflows...
                </p>
              </div>
            </div>
          ) : workflows.length === 0 ? (
            <Card className="rounded-[28px] border-dashed border-slate-300 bg-slate-50/80">
              <CardHeader className="items-center text-center">
                <CardTitle>No saved workflows yet</CardTitle>
                <CardDescription className="text-center">
                  Start a new workflow and save it to see it here.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={() => router.push("/workflows/new")}
                >
                  <Plus className="h-4 w-4" />
                  Create your first workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="rounded-[24px] border-slate-200 shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="space-y-2">
                      <CardTitle className="line-clamp-1 text-xl">{workflow.name}</CardTitle>
                      {workflow.description ? (
                        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                          {workflow.description}
                        </p>
                      ) : null}
                      <CardDescription>
                        Updated {formatWorkflowDate(workflow.updatedAt)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {workflow.snapshot.nodes.length} nodes
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {workflow.snapshot.edges.length} links
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => router.push(`/workflows/${workflow.id}`)}
                    >
                      <FolderOpen className="h-4 w-4" />
                      Open
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        className="rounded-xl"
                        onClick={() => router.push(`/workflows/${workflow.id}`)}
                      >
                        Edit
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => void handleDeleteWorkflow(workflow.id)}
                        disabled={deletingWorkflowId === workflow.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingWorkflowId === workflow.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

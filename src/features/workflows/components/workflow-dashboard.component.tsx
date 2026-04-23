"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type JSX } from "react";
import { ArrowRight, FolderOpen, LayoutGrid, List, Pencil, Pin, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/context/auth.context";
import { LogoutButton } from "@/features/auth/components/logout-button.component";
import { WorkflowDeleteDialog } from "@/features/workflows/components/workflow-delete-dialog.component";
import { WorkflowSaveDialog } from "@/features/workflows/components/workflow-save-dialog.component";
import {
  deleteWorkflowDocument,
  getUserWorkflowDocuments,
  renameWorkflowDocument,
  setWorkflowPinnedState,
} from "@/features/workflows/services/workflow.service";
import type { SavedWorkflowRecord } from "@/features/workflows/types/workflow-doc.type";
import type { WorkflowGraphNode, WorkflowSnapshot } from "@/app/modules/Home/types/workflow.type";

type WorkflowViewMode = "grid" | "list";

function WorkflowDashboardBrand(): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-100 bg-white shadow-[0_14px_32px_rgba(37,99,235,0.12)]">
        <svg
          aria-hidden="true"
          viewBox="0 0 40 40"
          className="h-9 w-9"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M35 3H25C23.8954 3 23 3.89543 23 5V15C23 16.1046 23.8954 17 25 17H35C36.1046 17 37 16.1046 37 15V5C37 3.89543 36.1046 3 35 3Z" stroke="#2563EB" strokeWidth="2" />
          <path d="M35 23H25C23.8954 23 23 23.8954 23 25V35C23 36.1046 23.8954 37 25 37H35C36.1046 37 37 36.1046 37 35V25C37 23.8954 36.1046 23 35 23Z" stroke="#1A192B" strokeWidth="2" />
          <path d="M15 23H5C3.89543 23 3 23.8954 3 25V35C3 36.1046 3.89543 37 5 37H15C16.1046 37 17 36.1046 17 35V25C17 23.8954 16.1046 23 15 23Z" stroke="#1A192B" strokeWidth="2" />
          <path d="M15 3H5C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H15C16.1046 17 17 16.1046 17 15V5C17 3.89543 16.1046 3 15 3Z" stroke="#1A192B" strokeWidth="2" />
          <path d="M17 13C18.6569 13 20 11.6569 20 10C20 8.34315 18.6569 7 17 7C15.3431 7 14 8.34315 14 10C14 11.6569 15.3431 13 17 13Z" fill="white" />
          <path d="M23 13C24.6569 13 26 11.6569 26 10C26 8.34315 24.6569 7 23 7C21.3431 7 20 8.34315 20 10C20 11.6569 21.3431 13 23 13Z" fill="white" />
          <path d="M30 20C31.6569 20 33 18.6569 33 17C33 15.3431 31.6569 14 30 14C28.3431 14 27 15.3431 27 17C27 18.6569 28.3431 20 30 20Z" fill="white" />
          <path d="M30 26C31.6569 26 33 24.6569 33 23C33 21.3431 31.6569 20 30 20C28.3431 20 27 21.3431 27 23C27 24.6569 28.3431 26 30 26Z" fill="white" />
          <path d="M17 33C18.6569 33 20 31.6569 20 30C20 28.3431 18.6569 27 17 27C15.3431 27 14 28.3431 14 30C14 31.6569 15.3431 33 17 33Z" fill="white" />
          <path d="M23 33C24.6569 33 26 31.6569 26 30C26 28.3431 24.6569 27 23 27C21.3431 27 20 28.3431 20 30C20 31.6569 21.3431 33 23 33Z" fill="white" />
          <path d="M30 25C31.1046 25 32 24.1046 32 23C32 21.8954 31.1046 21 30 21C28.8954 21 28 21.8954 28 23C28 24.1046 28.8954 25 30 25Z" fill="#1A192B" />
          <path d="M17 32C18.1046 32 19 31.1046 19 30C19 28.8954 18.1046 28 17 28C15.8954 28 15 28.8954 15 30C15 31.1046 15.8954 32 17 32Z" fill="#1A192B" />
          <path d="M23 32C24.1046 32 25 31.1046 25 30C25 28.8954 24.1046 28 23 28C21.8954 28 21 28.8954 21 30C21 31.1046 21.8954 32 23 32Z" fill="#1A192B" />
          <path d="M22 9.5H18V10.5H22V9.5Z" fill="#1A192B" opacity="0.35" />
          <path d="M29.5 17.5V21.5H30.5V17.5H29.5Z" fill="#1A192B" opacity="0.35" />
          <path d="M22 29.5H18V30.5H22V29.5Z" fill="#1A192B" opacity="0.35" />
          <path d="M17 12C18.1046 12 19 11.1046 19 10C19 8.89543 18.1046 8 17 8C15.8954 8 15 8.89543 15 10C15 11.1046 15.8954 12 17 12Z" fill="#1A192B" />
          <path d="M23 12C24.1046 12 25 11.1046 25 10C25 8.89543 24.1046 8 23 8C21.8954 8 21 8.89543 21 10C21 11.1046 21.8954 12 23 12Z" fill="#2563EB" />
          <path d="M30 19C31.1046 19 32 18.1046 32 17C32 15.8954 31.1046 15 30 15C28.8954 15 28 15.8954 28 17C28 18.1046 28.8954 19 30 19Z" fill="#2563EB" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
          Interactive
        </p>
        <p className="text-sm font-semibold text-slate-950 sm:text-base">
          Workflow Builder
        </p>
      </div>
    </div>
  );
}

function formatWorkflowDate(value: string | null): string {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getNodePreviewAccent(node: WorkflowGraphNode): string {
  if (typeof node.data.color === "string" && node.data.color.trim().length > 0) {
    return node.data.color;
  }

  switch (node.data.kind) {
    case "start":
      return "#10B981";
    case "action":
      return "#0EA5E9";
    case "condition":
      return "#F59E0B";
    case "end":
    default:
      return "#64748B";
  }
}

function WorkflowThumbnail({
  snapshot,
  workflowId,
  workflowName,
}: {
  snapshot: WorkflowSnapshot;
  workflowId: string;
  workflowName: string;
}): JSX.Element {
  const canvasWidth = 260;
  const canvasHeight = 108;
  const padding = 14;

  if (snapshot.nodes.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-[22px] border border-dashed border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#f1f5f9_100%)] text-sm text-slate-400">
        Blank workflow
      </div>
    );
  }

  const nodeRects = snapshot.nodes.map((node) => {
    const width = node.width ?? 92;
    const height = node.height ?? 54;

    return {
      ...node,
      previewWidth: width,
      previewHeight: height,
      minX: node.position.x,
      minY: node.position.y,
      centerX: node.position.x + width / 2,
      centerY: node.position.y + height / 2,
      accentColor: getNodePreviewAccent(node),
    };
  });

  const minX = Math.min(...nodeRects.map((node) => node.minX));
  const minY = Math.min(...nodeRects.map((node) => node.minY));
  const maxX = Math.max(...nodeRects.map((node) => node.minX + node.previewWidth));
  const maxY = Math.max(...nodeRects.map((node) => node.minY + node.previewHeight));
  const contentWidth = Math.max(maxX - minX, 1);
  const contentHeight = Math.max(maxY - minY, 1);
  const scale = Math.min(
    (canvasWidth - padding * 2) / contentWidth,
    (canvasHeight - padding * 2) / contentHeight,
  );
  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;
  const offsetX = (canvasWidth - scaledWidth) / 2;
  const offsetY = (canvasHeight - scaledHeight) / 2;
  const positionsById = new Map(
    nodeRects.map((node) => [
      node.id,
      {
        x: offsetX + (node.minX - minX) * scale,
        y: offsetY + (node.minY - minY) * scale,
        width: Math.max(node.previewWidth * scale, 18),
        height: Math.max(node.previewHeight * scale, 12),
        kind: node.data.kind,
        accentColor: node.accentColor,
      },
    ]),
  );

  const patternId = `workflow-grid-${workflowId}`;

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eef4ff_100%)] p-2">
      <svg
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        className="h-28 w-full"
        role="img"
        aria-label={`${workflowName} preview`}
      >
        <rect x="0" y="0" width={canvasWidth} height={canvasHeight} rx="18" fill="transparent" />
        <defs>
          <pattern id={patternId} width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="#D8E2F1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={canvasWidth} height={canvasHeight} fill={`url(#${patternId})`} opacity="0.7" />
        {snapshot.edges.map((edge) => {
          const source = positionsById.get(edge.source);
          const target = positionsById.get(edge.target);

          if (!source || !target) {
            return null;
          }

          const startX = source.x + source.width;
          const startY = source.y + source.height / 2;
          const endX = target.x;
          const endY = target.y + target.height / 2;
          const controlOffset = Math.max((endX - startX) * 0.45, 10);

          return (
            <path
              key={edge.id}
              d={`M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`}
              stroke="#94A3B8"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          );
        })}
        {nodeRects.map((node) => {
          const position = positionsById.get(node.id);

          if (!position) {
            return null;
          }

          return (
            <g key={node.id}>
              <rect
                x={position.x}
                y={position.y}
                width={position.width}
                height={position.height}
                rx={Math.min(position.height / 2.2, 12)}
                fill="white"
                stroke={position.accentColor}
                strokeWidth="2"
              />
              <circle
                cx={position.x + 8}
                cy={position.y + position.height / 2}
                r="2.6"
                fill={position.accentColor}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function WorkflowDashboard(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { toastError, toastSuccess } = useToast();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [workflows, setWorkflows] = useState<SavedWorkflowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<WorkflowViewMode>("grid");
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<string | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<SavedWorkflowRecord | null>(null);
  const [workflowPendingDelete, setWorkflowPendingDelete] = useState<SavedWorkflowRecord | null>(null);
  const [pinningWorkflowId, setPinningWorkflowId] = useState<string | null>(null);
  const [isUpdatingWorkflowMeta, setIsUpdatingWorkflowMeta] = useState(false);
  const [workflowMetaError, setWorkflowMetaError] = useState("");
  const [workflowDeleteError, setWorkflowDeleteError] = useState("");
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredWorkflows = normalizedSearchTerm
    ? workflows.filter((workflow) => {
        const workflowDescription = workflow.description ?? "";

        return (
          workflow.name.toLowerCase().includes(normalizedSearchTerm) ||
          workflowDescription.toLowerCase().includes(normalizedSearchTerm)
        );
      })
    : workflows;

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
        toastError("Could not load workflows", result.message);
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
  }, [toastError, user]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 639px)");

    function syncMobileView(event?: MediaQueryListEvent): void {
      const isMobileViewport = event?.matches ?? mediaQuery.matches;

      if (isMobileViewport) {
        setViewMode("grid");
      }
    }

    syncMobileView();

    mediaQuery.addEventListener("change", syncMobileView);

    return () => {
      mediaQuery.removeEventListener("change", syncMobileView);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";

      if (!isSearchShortcut) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleDeleteWorkflow(workflowId: string): Promise<void> {
    if (!workflowPendingDelete || workflowPendingDelete.id !== workflowId) {
      return;
    }

    setDeletingWorkflowId(workflowId);
    setError("");
    setWorkflowDeleteError("");

    const result = await deleteWorkflowDocument({ workflowId });

    if (!result.success) {
      setWorkflowDeleteError(result.message);
      toastError("Delete failed", result.message);
      setDeletingWorkflowId(null);
      return;
    }

    setWorkflows((currentWorkflows) =>
      currentWorkflows.filter((workflow) => workflow.id !== workflowId),
    );
    setDeletingWorkflowId(null);
    setWorkflowDeleteError("");
    setWorkflowPendingDelete(null);
    toastSuccess("Workflow deleted", "The workflow was removed from your dashboard.");
  }

  async function handleRenameWorkflowDetails(
    name: string,
    description: string,
  ): Promise<void> {
    if (!editingWorkflow) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (
      !trimmedName ||
      (trimmedName === editingWorkflow.name &&
        trimmedDescription === (editingWorkflow.description ?? ""))
    ) {
      setEditingWorkflow(null);
      setWorkflowMetaError("");
      return;
    }

    setIsUpdatingWorkflowMeta(true);
    setError("");
    setWorkflowMetaError("");

    const result = await renameWorkflowDocument({
      workflowId: editingWorkflow.id,
      name: trimmedName,
      description: trimmedDescription,
    });

    if (!result.success) {
      setWorkflowMetaError(result.message);
      toastError("Could not update workflow", result.message);
      setIsUpdatingWorkflowMeta(false);
      return;
    }

    setWorkflows((currentWorkflows) =>
      currentWorkflows.map((workflow) =>
        workflow.id === editingWorkflow.id
          ? {
              ...workflow,
              name: trimmedName,
              description: trimmedDescription || null,
              updatedAt: new Date().toISOString(),
            }
          : workflow,
      ),
    );
    setIsUpdatingWorkflowMeta(false);
    setWorkflowMetaError("");
    setEditingWorkflow(null);
    toastSuccess("Workflow details updated");
  }

  async function handleTogglePinnedWorkflow(workflow: SavedWorkflowRecord): Promise<void> {
    const nextPinnedState = !workflow.isPinned;

    setPinningWorkflowId(workflow.id);

    const result = await setWorkflowPinnedState({
      workflowId: workflow.id,
      isPinned: nextPinnedState,
    });

    if (!result.success) {
      toastError("Could not update pin", result.message);
      setPinningWorkflowId(null);
      return;
    }

    setWorkflows((currentWorkflows) =>
      [...currentWorkflows]
        .map((currentWorkflow) =>
          currentWorkflow.id === workflow.id
            ? {
                ...currentWorkflow,
                isPinned: nextPinnedState,
                updatedAt: new Date().toISOString(),
              }
            : currentWorkflow,
        )
        .sort((firstWorkflow, secondWorkflow) => {
          if (firstWorkflow.isPinned !== secondWorkflow.isPinned) {
            return firstWorkflow.isPinned ? -1 : 1;
          }

          return (secondWorkflow.updatedAt ?? "").localeCompare(firstWorkflow.updatedAt ?? "");
        }),
    );

    setPinningWorkflowId(null);
    toastSuccess(nextPinnedState ? "Workflow pinned" : "Workflow unpinned");
  }

  return (
    <main className="min-h-dvh bg-[#edf0f2] px-3 py-3 text-foreground sm:px-6 sm:py-4">
      <div className="mx-auto w-full max-w-6xl rounded-[20px] border border-black/8 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <header className="relative flex flex-col gap-4 border-b border-black/8 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <span className="absolute right-4 top-5 inline-flex shrink-0 rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white sm:right-6">
            Dashboard
          </span>
          <div className="space-y-2">
            <WorkflowDashboardBrand />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Saved workflows
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Create, open, and manage the workflows saved to your account.
              </p>
            </div>
          </div>

          <div className="min-w-0 pt-12 sm:pt-10 lg:pt-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <LogoutButton />
            <Button
              type="button"
              className="w-full rounded-xl sm:w-auto"
              onClick={() => router.push("/workflows/new")}
            >
              <Plus className="h-4 w-4" />
              New workflow
            </Button>
            </div>
          </div>
        </header>

        <section className="px-4 py-5 sm:px-6">
          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-col gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:px-6">
            <label className="relative block flex-1" htmlFor="workflow-search">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                id="workflow-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search workflows by name or description"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-24 text-sm text-slate-950 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium tracking-wide text-slate-500 shadow-sm">
                Ctrl K
              </span>
            </label>
            <div className="hidden items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex">
              <Button
                type="button"
                size="icon"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                className="h-10 w-10 rounded-xl"
                onClick={() => setViewMode("grid")}
                aria-label="Show workflows in grid view"
                title="Grid view"
              >
                <LayoutGrid className="h-4.5 w-4.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                className="h-10 w-10 rounded-xl"
                onClick={() => setViewMode("list")}
                aria-label="Show workflows in list view"
                title="List view"
              >
                <List className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card
                  key={`workflow-dashboard-skeleton-${index}`}
                  className="rounded-3xl border-slate-200 shadow-sm"
                >
                  <CardHeader className="space-y-4">
                    <div className="space-y-3">
                      <Skeleton className="h-7 w-40 max-w-full" />
                      <Skeleton className="h-4 w-52 max-w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-7 w-20 rounded-full" />
                      <Skeleton className="h-7 w-20 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <Skeleton className="h-10 w-24 rounded-xl" />
                    <div className="flex gap-2">
                      <Skeleton className="h-10 w-24 rounded-xl" />
                      <Skeleton className="h-10 w-24 rounded-xl" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <Card className="rounded-[28px] border-dashed border-slate-300 bg-slate-50/80">
              <CardHeader className="items-center text-center">
                <CardTitle>No saved workflows yet</CardTitle>
                <CardDescription className="text-center">
                  Pick a starting point and save your first workflow to see it here.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={() => router.push("/workflows/new?template=blank")}
                >
                  <Plus className="h-4 w-4" />
                  Start from blank
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => router.push("/workflows/new")}
                >
                  <FolderOpen className="h-4 w-4" />
                  Start from approval flow
                </Button>
              </CardContent>
            </Card>
          ) : filteredWorkflows.length === 0 ? (
            <Card className="rounded-[28px] border-dashed border-slate-300 bg-slate-50/80">
              <CardHeader className="items-center text-center">
                <CardTitle>No matching workflows</CardTitle>
                <CardDescription className="text-center">
                  Try a different name or description search.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setSearchTerm("")}
                >
                  Clear search
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredWorkflows.map((workflow) => (
                <Card key={workflow.id} className="min-w-0 rounded-3xl border-slate-200 shadow-sm">
                  <CardHeader className="space-y-3">
                    <WorkflowThumbnail
                      snapshot={workflow.snapshot}
                      workflowId={workflow.id}
                      workflowName={workflow.name}
                    />
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="min-w-0 line-clamp-2 text-xl">
                          {workflow.name}
                        </CardTitle>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-10 rounded-xl px-0"
                            onClick={() => void handleTogglePinnedWorkflow(workflow)}
                            disabled={pinningWorkflowId === workflow.id}
                            aria-label={workflow.isPinned ? `Unpin ${workflow.name}` : `Pin ${workflow.name}`}
                            title={workflow.isPinned ? "Unpin workflow" : "Pin workflow"}
                          >
                            <Pin
                              className={`h-4 w-4 ${workflow.isPinned ? "fill-slate-950 text-slate-950" : ""}`}
                            />
                            <span className="sr-only">
                              {workflow.isPinned ? "Unpin workflow" : "Pin workflow"}
                            </span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-10 rounded-xl px-0"
                            onClick={() => {
                              setEditingWorkflow(workflow);
                              setWorkflowMetaError("");
                            }}
                            aria-label={`Edit details for ${workflow.name}`}
                            title="Edit details"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit details</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-10 rounded-xl border-rose-200 px-0 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => {
                              setWorkflowPendingDelete(workflow);
                              setWorkflowDeleteError("");
                            }}
                            aria-label={`Delete ${workflow.name}`}
                            title="Delete workflow"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
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
                      {workflow.isPinned ? (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                          Pinned
                        </span>
                      ) : null}
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {workflow.snapshot.nodes.length} nodes
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {workflow.snapshot.edges.length} links
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid w-full grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={() => router.push(`/workflows/${workflow.id}`)}
                      >
                        <FolderOpen className="h-4 w-4" />
                        Open
                      </Button>
                      <Button
                        type="button"
                        className="w-full rounded-xl"
                        onClick={() => router.push(`/workflows/${workflow.id}`)}
                      >
                        Edit
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredWorkflows.map((workflow) => (
                <Card
                  key={workflow.id}
                  className="rounded-[28px] border-slate-200 shadow-sm"
                >
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5">
                    <div className="w-full shrink-0 sm:w-72">
                      <WorkflowThumbnail
                        snapshot={workflow.snapshot}
                        workflowId={workflow.id}
                        workflowName={workflow.name}
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="min-w-0 text-xl font-semibold text-slate-950">
                              {workflow.name}
                            </h2>
                            {workflow.isPinned ? (
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                                Pinned
                              </span>
                            ) : null}
                          </div>
                          {workflow.description ? (
                            <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                              {workflow.description}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              Updated {formatWorkflowDate(workflow.updatedAt)}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {workflow.snapshot.nodes.length} nodes
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {workflow.snapshot.edges.length} links
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-10 rounded-xl px-0"
                            onClick={() => void handleTogglePinnedWorkflow(workflow)}
                            disabled={pinningWorkflowId === workflow.id}
                            aria-label={workflow.isPinned ? `Unpin ${workflow.name}` : `Pin ${workflow.name}`}
                            title={workflow.isPinned ? "Unpin workflow" : "Pin workflow"}
                          >
                            <Pin
                              className={`h-4 w-4 ${workflow.isPinned ? "fill-slate-950 text-slate-950" : ""}`}
                            />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-10 rounded-xl px-0"
                            onClick={() => {
                              setEditingWorkflow(workflow);
                              setWorkflowMetaError("");
                            }}
                            aria-label={`Edit details for ${workflow.name}`}
                            title="Edit details"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-10 rounded-xl border-rose-200 px-0 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => {
                              setWorkflowPendingDelete(workflow);
                              setWorkflowDeleteError("");
                            }}
                            aria-label={`Delete ${workflow.name}`}
                            title="Delete workflow"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => router.push(`/workflows/${workflow.id}`)}
                          >
                            <FolderOpen className="h-4 w-4" />
                            Open
                          </Button>
                          <Button
                            type="button"
                            className="rounded-xl"
                            onClick={() => router.push(`/workflows/${workflow.id}`)}
                          >
                            Edit
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
      <WorkflowSaveDialog
        key={`${editingWorkflow?.id ?? "none"}-${editingWorkflow?.updatedAt ?? "new"}-${editingWorkflow?.name ?? ""}-${editingWorkflow?.description ?? ""}`}
        open={editingWorkflow !== null}
        defaultName={editingWorkflow?.name ?? ""}
        defaultDescription={editingWorkflow?.description ?? ""}
        mode="update"
        isSaving={isUpdatingWorkflowMeta}
        error={workflowMetaError}
        onClose={() => {
          if (isUpdatingWorkflowMeta) {
            return;
          }

          setEditingWorkflow(null);
          setWorkflowMetaError("");
        }}
        onSubmit={(name, description) => void handleRenameWorkflowDetails(name, description)}
      />
      <WorkflowDeleteDialog
        open={workflowPendingDelete !== null}
        workflowName={workflowPendingDelete?.name ?? "this workflow"}
        isDeleting={deletingWorkflowId === workflowPendingDelete?.id}
        error={workflowDeleteError}
        onClose={() => {
          if (deletingWorkflowId) {
            return;
          }

          setWorkflowPendingDelete(null);
          setWorkflowDeleteError("");
        }}
        onConfirm={() => {
          if (!workflowPendingDelete) {
            return;
          }

          void handleDeleteWorkflow(workflowPendingDelete.id);
        }}
      />
    </main>
  );
}

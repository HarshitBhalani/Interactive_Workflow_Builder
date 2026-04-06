"use client";

import { useState } from "react";
import type { Connection, IsValidConnection, XYPosition } from "reactflow";
import { WorkflowHeading } from "./workflowHeading.component";
import { WorkflowCanvas } from "./workflowCanvas.component";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkflowSnapshot } from "../types/workflow.type";
import { useWorkflowStore } from "../stores/workflow.store";
import {
  createWorkflowSnapshot,
  parseWorkflowSnapshot,
} from "../utils/workflowPersistence.util";
import { workflowSidebarNodeKinds } from "../utils/workflowNodeFactory.util";
import { isValidWorkflowConnection } from "../utils/workflowValidation.util";

export function WorkflowShell() {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const handleNodesChange = useWorkflowStore((state) => state.handleNodesChange);
  const handleEdgesChange = useWorkflowStore((state) => state.handleEdgesChange);
  const handleNodesDelete = useWorkflowStore((state) => state.handleNodesDelete);
  const addNode = useWorkflowStore((state) => state.addNode);
  const connectNodes = useWorkflowStore((state) => state.connectNodes);
  const updateNodeDetails = useWorkflowStore((state) => state.updateNodeDetails);
  const loadWorkflowSnapshot = useWorkflowStore(
    (state) => state.loadWorkflowSnapshot
  );
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSubtitle, setDraftSubtitle] = useState("");
  const [workflowJson, setWorkflowJson] = useState("");
  const [jsonModalMode, setJsonModalMode] = useState<"export" | "import" | null>(
    null
  );
  const [jsonError, setJsonError] = useState("");

  function handleConnect(connection: Connection) {
    connectNodes(connection);
  }

  const validateConnection: IsValidConnection = (connection) =>
    isValidWorkflowConnection(connection, nodes, edges);

  function handleOpenNodeEditor(nodeId: string) {
    const node = nodes.find((currentNode) => currentNode.id === nodeId);

    if (!node) {
      return;
    }

    setEditingNodeId(nodeId);
    setDraftTitle(node.data.title);
    setDraftSubtitle(node.data.subtitle);
  }

  function handleCloseNodeEditor() {
    setEditingNodeId(null);
    setDraftTitle("");
    setDraftSubtitle("");
  }

  function handleOpenExportModal() {
    const snapshot: WorkflowSnapshot = createWorkflowSnapshot(nodes, edges);

    setWorkflowJson(JSON.stringify(snapshot, null, 2));
    setJsonError("");
    setJsonModalMode("export");
  }

  function handleOpenImportModal() {
    setWorkflowJson("");
    setJsonError("");
    setJsonModalMode("import");
  }

  function handleCloseJsonModal() {
    setJsonModalMode(null);
    setWorkflowJson("");
    setJsonError("");
  }

  function handleAddNode(kind: (typeof workflowSidebarNodeKinds)[number]) {
    addNode(kind);
  }

  function handleDropNode(
    kind: (typeof workflowSidebarNodeKinds)[number],
    position: XYPosition
  ) {
    addNode(kind, position);
  }

  function handleNodeTypeDragStart(
    event: React.DragEvent<HTMLDivElement>,
    kind: (typeof workflowSidebarNodeKinds)[number]
  ) {
    event.dataTransfer.setData("application/workflow-node-kind", kind);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleSaveNodeDetails() {
    if (!editingNodeId) {
      return;
    }

    updateNodeDetails(editingNodeId, {
      title: draftTitle,
      subtitle: draftSubtitle,
    });

    handleCloseNodeEditor();
  }

  function handleImportWorkflow() {
    try {
      const snapshot = parseWorkflowSnapshot(workflowJson);

      loadWorkflowSnapshot(snapshot);
      handleCloseJsonModal();
      handleCloseNodeEditor();
    } catch (error) {
      setJsonError(
        error instanceof Error
          ? error.message
          : "Could not import the workflow JSON."
      );
    }
  }

  const canvasNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onEdit: handleOpenNodeEditor,
    },
  }));

  return (
    <main className="min-h-screen bg-[#edf0f2] px-4 py-4 text-foreground sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[20px] border border-black/8 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <header className="flex flex-col gap-4 border-b border-black/8 px-5 py-5 lg:flex-row lg:items-end lg:justify-between lg:px-6">
          <div className="min-w-0">
            <div className="mt-1">
              <WorkflowHeading />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" type="button" onClick={handleOpenImportModal}>
              Import JSON
            </Button>
            <Button type="button" onClick={handleOpenExportModal}>
              Export JSON
            </Button>
          </div>
        </header>

        <section className="grid flex-1 gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-b border-black/8 bg-[#f6f8f9] p-5 lg:border-r lg:border-b-0">
            <Card className="rounded-[16px]">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-base">Node types</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid gap-3">
                  {workflowSidebarNodeKinds.map((nodeKind) => (
                    <div
                      key={nodeKind}
                      draggable
                      onDragStart={(event) =>
                        handleNodeTypeDragStart(event, nodeKind)
                      }
                      className="flex cursor-grab items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100 active:cursor-grabbing"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize text-slate-900">
                          {nodeKind}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Drag to canvas
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 bg-white"
                        onClick={() => handleAddNode(nodeKind)}
                      >
                        +
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="bg-[#f1f4f5] p-5 lg:p-6">
            <Card className="flex h-full min-h-[420px] flex-col rounded-[18px]">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Workflow canvas</CardTitle>
                  <CardDescription className="mt-1">
                    Add nodes from the sidebar and place them where needed.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Badge variant="outline">100%</Badge>
                  <Badge variant="outline">Center</Badge>
                </div>
              </div>

              <div className="relative flex flex-1 overflow-hidden rounded-b-[18px] bg-[#fbfcfd]">
                <WorkflowCanvas
                  nodes={canvasNodes}
                  edges={edges}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={handleEdgesChange}
                  onNodesDelete={handleNodesDelete}
                  onConnect={handleConnect}
                  isValidConnection={validateConnection}
                  onDropNode={handleDropNode}
                />
              </div>
            </Card>
          </div>
        </section>
      </div>

      {editingNodeId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Edit node</h2>
              <p className="mt-1 text-sm text-slate-500">
                Update the label shown on the workflow.
              </p>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="space-y-2">
                <label
                  htmlFor="edit-node-title"
                  className="text-sm font-medium text-slate-700"
                >
                  Title
                </label>
                <input
                  id="edit-node-title"
                  type="text"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-node-subtitle"
                  className="text-sm font-medium text-slate-700"
                >
                  Subtitle
                </label>
                <textarea
                  id="edit-node-subtitle"
                  value={draftSubtitle}
                  onChange={(event) => setDraftSubtitle(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <Button variant="outline" type="button" onClick={handleCloseNodeEditor}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveNodeDetails}>
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {jsonModalMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                {jsonModalMode === "export"
                  ? "Export workflow JSON"
                  : "Import workflow JSON"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {jsonModalMode === "export"
                  ? "Copy this snapshot to save the current workflow."
                  : "Paste a saved workflow snapshot to load it into the canvas."}
              </p>
            </div>

            <div className="space-y-4 px-5 py-5">
              <textarea
                value={workflowJson}
                onChange={(event) => setWorkflowJson(event.target.value)}
                readOnly={jsonModalMode === "export"}
                rows={16}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />

              {jsonError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {jsonError}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <Button variant="outline" type="button" onClick={handleCloseJsonModal}>
                Close
              </Button>
              {jsonModalMode === "import" ? (
                <Button type="button" onClick={handleImportWorkflow}>
                  Load workflow
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

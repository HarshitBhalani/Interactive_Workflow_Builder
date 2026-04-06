"use client";

import { useState } from "react";
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
import {
  MarkerType,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  getConnectedEdges,
  type IsValidConnection,
  type NodeChange,
  useEdgesState,
  useNodesState,
} from "reactflow";
import { workflowPreviewEdges, workflowPreviewNodes } from "../configs/workflowPreview.config";
import { createWorkflowNode, workflowSidebarNodeKinds } from "../utils/workflowNodeFactory.util";
import { isValidWorkflowConnection } from "../utils/workflowValidation.util";

export function WorkflowShell() {
  const [nodes, setNodes] = useNodesState(workflowPreviewNodes);
  const [edges, setEdges] = useEdgesState(workflowPreviewEdges);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSubtitle, setDraftSubtitle] = useState("");

  function handleNodesChange(changes: NodeChange[]) {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }

  function handleEdgesChange(changes: EdgeChange[]) {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }

  function handleNodesDelete(deletedNodes: typeof nodes) {
    setEdges((currentEdges) => {
      const connectedEdges = getConnectedEdges(deletedNodes, currentEdges);

      if (connectedEdges.length === 0) {
        return currentEdges;
      }

      const connectedIds = new Set(connectedEdges.map((edge) => edge.id));

      return currentEdges.filter((edge) => !connectedIds.has(edge.id));
    });
  }

  function handleConnect(connection: Connection) {
    if (!isValidWorkflowConnection(connection, nodes, edges)) {
      return;
    }

    const label =
      connection.sourceHandle === "yes"
        ? "Yes"
        : connection.sourceHandle === "no"
          ? "No"
          : undefined;

    const strokeColor =
      connection.sourceHandle === "yes"
        ? "#16a34a"
        : connection.sourceHandle === "no"
          ? "#e11d48"
          : "#475569";

    setEdges((currentEdges) =>
      addEdge(
        {
          ...connection,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
          },
          label,
          labelStyle: label
            ? {
                fill: "#0f172a",
                fontWeight: 600,
              }
            : undefined,
          style: {
            stroke: strokeColor,
            strokeWidth: 1.5,
          },
        },
        currentEdges
      )
    );
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

  function handleAddNode(kind: (typeof workflowSidebarNodeKinds)[number]) {
    setNodes((currentNodes) => {
      const nextNode = createWorkflowNode(kind, currentNodes);

      return [
        ...currentNodes.map((node) => ({ ...node, selected: false })),
        nextNode,
      ];
    });
  }

  function handleSaveNodeDetails() {
    if (!editingNodeId) {
      return;
    }

    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === editingNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                title: draftTitle,
                subtitle: draftSubtitle,
              },
            }
          : node
      )
    );

    handleCloseNodeEditor();
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
            <Badge variant="secondary" className="px-3 py-2 text-sm">
              Draft
            </Badge>
            <Button variant="outline">
              Save
            </Button>
            <Button>
              Validate
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
                    <Button
                      key={nodeKind}
                      type="button"
                      variant="outline"
                      className="h-auto w-full justify-between rounded-xl bg-slate-50 px-4 py-3 text-left"
                      onClick={() => handleAddNode(nodeKind)}
                    >
                      <span className="capitalize">{nodeKind}</span>
                      <span className="text-slate-400">+</span>
                    </Button>
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
                  <Badge variant="outline">
                    100%
                  </Badge>
                  <Badge variant="outline">
                    Center
                  </Badge>
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
              <h2 className="text-lg font-semibold text-slate-950">
                Edit node
              </h2>
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
    </main>
  );
}

"use client";

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

  function handleAddNode(kind: (typeof workflowSidebarNodeKinds)[number]) {
    setNodes((currentNodes) => {
      const nextNode = createWorkflowNode(kind, currentNodes);

      return [
        ...currentNodes.map((node) => ({ ...node, selected: false })),
        nextNode,
      ];
    });
  }

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
                  nodes={nodes}
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
    </main>
  );
}

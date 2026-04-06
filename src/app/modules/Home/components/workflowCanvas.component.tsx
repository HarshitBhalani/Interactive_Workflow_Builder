"use client";

import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type IsValidConnection,
  getConnectedEdges,
  type EdgeChange,
  type NodeChange,
  type NodeTypes,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { workflowPreviewEdges, workflowPreviewNodes } from "../configs/workflowPreview.config";
import { isValidWorkflowConnection } from "../utils/workflowValidation.util";
import { WorkflowNode } from "./workflowNode.component";

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

export function WorkflowCanvas() {
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

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodesDelete={handleNodesDelete}
        onConnect={handleConnect}
        isValidConnection={validateConnection}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        deleteKeyCode={["Backspace", "Delete"]}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.1}
          color="#cbd5e1"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

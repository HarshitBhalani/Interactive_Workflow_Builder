"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow"; //bcaz Zustand me object selector use karte time unnecessary re-render avoid karne ke liye
import type { JSX } from "react";
import { ChevronDown, ChevronUp, PanelLeftClose, PanelRightClose } from "lucide-react";
import type {
  Connection,
  IsValidConnection,
  ReactFlowInstance,
  XYPosition,
} from "reactflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/common/utils/cn.util";
import { useWorkflowStore } from "../stores/workflow.store";
import type {
  WorkflowExecutionLog,
  WorkflowValidationSummary,
  WorkflowCanvasNode,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowNodeKind,
  WorkflowSnapshot,
} from "../types/workflow.type";
import {
  createWorkflowSnapshot,
  parseWorkflowSnapshot,
} from "../utils/workflowPersistence.util";
import {
  workflowNodeAppearanceByKind,
  workflowNodeCatalog,
} from "../utils/workflowNodeFactory.util";
import {
  isValidWorkflowConnection,
  validateWorkflow,
} from "../utils/workflowValidation.util";
import WorkflowCanvas from "./workflowCanvas.component";
import { WorkflowHeading } from "./workflowHeading.component";

type JsonModalMode = "export" | "import" | null;

type NodeEditorState ={
  editingNodeId:string | null;
  draftTitle:string;
  draftSubtitle:string;
};

type JsonModalState={
  mode: JsonModalMode;
  workflowJson:string;
  jsonError:string;
};

type CanvasState ={
  reactFlowInstance:ReactFlowInstance<WorkflowCanvasNode, WorkflowGraphEdge> | null;
};

type MobileDragState = {
  kind: WorkflowNodeKind;
  label: string;
  touchId: number;
  clientX: number;
  clientY: number;
};

type ValidationIssueItem = {
  key: string;
  nodeId: string | null;
  message: string;
};

const dragDataKey="application/workflow-node-kind";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase(); 

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

export function WorkflowShell(): JSX.Element {


  const workflowStore = useWorkflowStore(

    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      handleNodesChange: state.handleNodesChange,
      handleEdgesChange: state.handleEdgesChange,
      handleNodesDelete: state.handleNodesDelete,
      addNode: state.addNode,
      pasteNode: state.pasteNode,
      connectNodes: state.connectNodes,
      updateNodeDetails: state.updateNodeDetails,
      loadWorkflowSnapshot: state.loadWorkflowSnapshot,
      resetWorkflow: state.resetWorkflow,
      resetExecution: state.resetExecution,
      runWorkflow: state.runWorkflow,
      undo: state.undo,
      redo: state.redo,
      canUndo: state.canUndo,
      canRedo: state.canRedo,
      isRunning: state.isRunning,
      logs: state.logs,

    })),

  );

  const {
    nodes,
    edges,
    handleNodesChange,
    handleEdgesChange,
    handleNodesDelete,
    addNode,
    pasteNode,
    connectNodes,
    updateNodeDetails,
    loadWorkflowSnapshot,
    resetWorkflow,
    resetExecution,
    runWorkflow,
    undo,
    redo,
    canUndo,
    canRedo,
    isRunning,
    logs,
  } = workflowStore;

  const [nodeEditor,setNodeEditor] = useState<NodeEditorState>({ 
    editingNodeId: null,
    draftTitle: "",
    draftSubtitle: "",

  });

  const [jsonModal, setJsonModal] =useState<JsonModalState>({
    mode: null,
    workflowJson: "",
    jsonError: "",
  });

  const [canvasState, setCanvasState]= useState<CanvasState>({
    reactFlowInstance: null,
  });
  const [viewportResetToken, setViewportResetToken] = useState(0);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [mobileAddFeedback, setMobileAddFeedback] = useState<WorkflowNodeKind | null>(null);
  const [isNodeSidebarOpen, setIsNodeSidebarOpen] = useState(true);
  const [isExecutionLogsOpen, setIsExecutionLogsOpen] = useState(true);
  const [showValidationFeedback, setShowValidationFeedback] = useState(false);
  const [mobileDragState, setMobileDragState] = useState<MobileDragState | null>(null);


  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const copiedNodeRef = useRef<WorkflowGraphNode | null>(null);
  const pasteCountRef = useRef(0);

  const selectedNode =nodeEditor.editingNodeId
    ? (nodes.find((node)=>node.id===nodeEditor.editingNodeId) ?? null) : null;


  const selectedCanvasNode =nodes.find((node) => node.selected) ?? null;
  const validationSummary: WorkflowValidationSummary = validateWorkflow(nodes, edges);
  const firstValidationMessageByNodeId = Object.fromEntries(
    Object.entries(validationSummary.nodeErrors).map(([nodeId, messages]) => [
      nodeId,
      messages[0] ?? null,
    ]),
  );
  const validationIssueItems: ValidationIssueItem[] = [
    ...validationSummary.workflowErrors.map((message, index) => ({
      key: `workflow-${index}`,
      nodeId: null,
      message,
    })),
    ...Object.entries(validationSummary.nodeErrors).flatMap(([nodeId, messages]) =>
      messages.map((message, index) => ({
        key: `${nodeId}-${index}`,
        nodeId,
        message,
      })),
    ),
  ];

  const canvasNodes: WorkflowCanvasNode[]=nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      validationMessage: showValidationFeedback
        ? (firstValidationMessageByNodeId[node.id] ?? null)
        : null,
      onEdit: openNodeEditor,
      onDelete: deleteNode,
    },
  }));

  const validateConnection: IsValidConnection = (connection) => isValidWorkflowConnection(connection, nodes, edges);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = (event?: MediaQueryListEvent): void => {
      setIsCompactViewport(event?.matches ?? mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    setIsNodeSidebarOpen(!isCompactViewport);
  }, [isCompactViewport]);

  useEffect(() => {
    setIsExecutionLogsOpen(!isCompactViewport);
  }, [isCompactViewport]);

  useEffect(() => {
    if (!isCompactViewport || typeof document === "undefined") {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (isExecutionLogsOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isCompactViewport, isExecutionLogsOpen]);

  useEffect(() => {
    if (!isCompactViewport || !mobileAddFeedback) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMobileAddFeedback(null);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isCompactViewport, mobileAddFeedback]);

  function getViewportCenterPosition(): XYPosition | null {
    if (!canvasState.reactFlowInstance || !canvasContainerRef.current) {
      return null;
    }

    const { x, y, zoom } = canvasState.reactFlowInstance.getViewport();
    const bounds = canvasContainerRef.current.getBoundingClientRect();

    return {
      x: (bounds.width / 2 - x) / zoom,
      y: (bounds.height / 2 - y) / zoom,
    };
  }

  function handleCanvasNodesChange(changes: Parameters<typeof handleNodesChange>[0]): void {
    handleNodesChange(changes);
  }

  function handleCanvasEdgesChange(changes: Parameters<typeof handleEdgesChange>[0]): void {
    handleEdgesChange(changes);
  }

  function handleCanvasNodesDelete(deletedNodes: WorkflowCanvasNode[]): void{
    handleNodesDelete(deletedNodes);
  }

  function openNodeEditor(nodeId: string): void {
    const node = nodes.find((currentNode) => currentNode.id === nodeId);

    if (!node) {
      return;
    }

    setNodeEditor(
      {
      editingNodeId: nodeId,
      draftTitle: node.data.title,
      draftSubtitle: node.data.subtitle,
    }
    );
  }

  function closeNodeEditor(): void{
    setNodeEditor({
      editingNodeId:null,
      draftTitle: "",
      draftSubtitle: "",
    });
  }

  function deleteNode(nodeId:string): void {
    const node = nodes.find((currentNode) => currentNode.id===nodeId);

    if (!node){
      return;
    }

    if (nodeEditor.editingNodeId===nodeId) {
      closeNodeEditor();
    }

    handleNodesDelete([node]);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function openExportModal(): void {
    const snapshot: WorkflowSnapshot = createWorkflowSnapshot(nodes, edges);


    setJsonModal({
      mode: "export",
      workflowJson: JSON.stringify(snapshot,null,2),
      jsonError: "",

    });
  }

  function openImportModal(): void {
    setJsonModal({

      mode: "import",
      workflowJson: "",
      jsonError: "",
    });
  }

  function closeJsonModal(): void{

    setJsonModal({
      mode: null,
      workflowJson: "",
      jsonError: "",
    });
  }

  function handleConnect(connection: Connection): void {
    connectNodes(connection);
  }

  function getLogCardClassName(log:WorkflowExecutionLog):string 
  {
    switch (log.status) {
      case "error":
        return "border-rose-200 bg-rose-50 text-rose-700";

      case "success":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "running":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "info":
        return "border-sky-200 bg-sky-50 text-sky-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-700";
    }

  }

  function focusNodeById(nodeId: string): void {
    const targetNode = nodes.find((node) => node.id === nodeId);
    const reactFlowInstance = canvasState.reactFlowInstance;

    if (!targetNode || !reactFlowInstance) {
      return;
    }

    reactFlowInstance.setCenter(
      targetNode.position.x + 120,
      targetNode.position.y + 60,
      {
        zoom: Math.max(reactFlowInstance.getZoom(), 0.9),
        duration: 300,
      },
    );
  }

  function handleCanvasInit(
    instance:ReactFlowInstance<WorkflowCanvasNode,WorkflowGraphEdge>
  ): void {
    setCanvasState({ //because reactFlowInstance in handleAddNode function to calculate the position of new node based on canvas center
      reactFlowInstance:instance,
    });
  }

  const handleUndo= useCallback((): void => {
    closeNodeEditor();
    closeJsonModal();
    undo();
  },[undo]);

  const handleRedo=useCallback((): void =>{
    closeNodeEditor();
    closeJsonModal();
    redo();
  },[redo]);

  const handleReset = useCallback(():void=>{
    setShowValidationFeedback(false);
    closeNodeEditor();
    closeJsonModal();
    resetWorkflow();
    setViewportResetToken((currentToken) => currentToken + 1);

    if (isCompactViewport) {
      canvasContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  },[isCompactViewport, resetWorkflow]);

  const handleRunWorkflow=useCallback(():void=>{
    setShowValidationFeedback(true);
    closeNodeEditor();
    closeJsonModal();
    void runWorkflow();
  },[runWorkflow]);

  const handleResetExecution=useCallback((): void => 
    {
    resetExecution();
  },[resetExecution]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleAddNode(kind:WorkflowNodeKind): void {
    if(!canvasState.reactFlowInstance || !canvasContainerRef.current) {
      addNode(kind);
      return;
    }

    const viewportPosition = isCompactViewport ? getViewportCenterPosition() : null;
    const canvasBounds = canvasContainerRef.current.getBoundingClientRect();
    const position = viewportPosition ?? canvasState.reactFlowInstance.screenToFlowPosition({
      x: canvasBounds.left +canvasBounds.width / 2,
      y: canvasBounds.top +canvasBounds.height / 2,
    });

  
    addNode(kind, position);
  }

  function handleAddNodeFromButton(kind: WorkflowNodeKind): void {
    
    if (isCompactViewport) {
      setMobileAddFeedback(kind);
      canvasContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    handleAddNode(kind);
  }

  function handleDropNode(kind: WorkflowNodeKind, position: XYPosition): void {
    addNode(kind, position);
  }

  function handleMobileNodeTouchStart(
    event: React.TouchEvent<HTMLDivElement>,
    kind: WorkflowNodeKind,
    label: string,
  ): void {
    if (!isCompactViewport) {
      return;
    }

    event.preventDefault();

    const [touch] = Array.from(event.changedTouches);

    if (!touch) {
      return;
    }

    setMobileDragState({
      kind,
      label,
      touchId: touch.identifier,
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
  }

  const handleCopyNode = useCallback((): void => {
    if (!selectedCanvasNode) {
      return;
    }

    copiedNodeRef.current = {
      ...selectedCanvasNode,
      position: { ...selectedCanvasNode.position },
      data: { ...selectedCanvasNode.data },
    };
    pasteCountRef.current = 0;
  }, [selectedCanvasNode]);

  const handlePasteNode = useCallback((): void => {
    const copiedNode = copiedNodeRef.current;

    if (!copiedNode) {
      return;
    }

    pasteCountRef.current += 1;

    const position = {
      x: copiedNode.position.x + pasteCountRef.current * 40,
      y: copiedNode.position.y + pasteCountRef.current * 40,
    };

    pasteNode(copiedNode, position);
  }, [pasteNode]);

  function handleNodeTypeDragStart(
    event: React.DragEvent<HTMLDivElement>,
    kind: WorkflowNodeKind,
  ): void {
    event.dataTransfer.setData(dragDataKey, kind);
    event.dataTransfer.effectAllowed = "move";
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function saveNodeDetails(): void {
    if (!nodeEditor.editingNodeId) {
      return;
    }

    updateNodeDetails(nodeEditor.editingNodeId, {
      title: nodeEditor.draftTitle.trim() || "Untitled node",
      subtitle: nodeEditor.draftSubtitle.trim() || "Add a short description",
    });

    closeNodeEditor();
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function importWorkflow(): void {
    try {
      setShowValidationFeedback(false);
      const snapshot = parseWorkflowSnapshot(jsonModal.workflowJson);

      loadWorkflowSnapshot(snapshot);
      closeJsonModal();
      closeNodeEditor();
    } catch (error) {
      setJsonModal((currentModal) => (
        {
        ...currentModal,
        jsonError:
          error instanceof Error
            ? error.message
            : "Could not import the workflow JSON.",
        }
    ));
    }
  }

  useEffect(()=>{
    function handleKeyDown(event: KeyboardEvent): void {
      const pressedKey = event.key.toLowerCase();
      const isPrimaryModifierPressed = event.ctrlKey || event.metaKey;
      const isEditorOpen = nodeEditor.editingNodeId !== null || jsonModal.mode !== null; //because both node editor and json modal are considered as "editor" in this context
      const isTyping = isTypingTarget(event.target);

      switch(pressedKey){
        case "escape":
          if (nodeEditor.editingNodeId !==null){
            closeNodeEditor();
          }

          if (jsonModal.mode !==null){
            closeJsonModal();
          }

          return;


        case "enter":
          if(isTyping  && isPrimaryModifierPressed){
            if(nodeEditor.editingNodeId !==null){

              event.preventDefault();
              saveNodeDetails();
            }

            if(jsonModal.mode==="import") {
              event.preventDefault();

              importWorkflow();
            }

          }

          if(isTyping){
            return;
          }


          break;

        default:
          if(isTyping) {
            return;
          }

      }

      if (isPrimaryModifierPressed) {
        switch (pressedKey) {
          case "z":
            event.preventDefault();

            if (event.shiftKey){
              handleRedo();
            } else {
              handleUndo();
            }


            return;

          case "y":

            event.preventDefault();
            handleRedo();
            return;


          case "s":
            event.preventDefault();
            openExportModal();
            return;


          case "c":
            if(selectedCanvasNode) {

              event.preventDefault();
              handleCopyNode();
            }

            return;

          case "v":
            if(copiedNodeRef.current) {
              event.preventDefault();

              handlePasteNode();
            }

            return;

          case "o":
            event.preventDefault();
            openImportModal();
            return;

          default:
            break;
        }


      }

      if(isEditorOpen) {
          return;
      }

      switch (pressedKey) {
        case "s":
          handleAddNode("start");
          return;

        case "a":
          handleAddNode("action");
          return;

        case "c":
          handleAddNode("condition");
          return;

        case "e":
          handleAddNode("end");
          return;

        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, 
  
  [
    nodeEditor.editingNodeId,
    jsonModal.mode,
    nodes,
    edges,
    selectedCanvasNode,
    saveNodeDetails,
    importWorkflow,
    openExportModal,
    handleAddNode,
    handleCopyNode,
    handlePasteNode,
    handleUndo,
    handleRedo,
  ]
);

  useEffect(() => {
    if (!isCompactViewport || !mobileDragState) {
      return;
    }

    const activeMobileDrag = mobileDragState;

    function findTrackedTouch(touchList: TouchList): Touch | null {
      return (
        Array.from(touchList).find(
          (touch) => touch.identifier === activeMobileDrag.touchId
        ) ?? null
      );
    }

    function handleTouchMove(event: TouchEvent): void {
      const trackedTouch = findTrackedTouch(event.touches);

      if (!trackedTouch) {
        return;
      }

      event.preventDefault();
      setMobileDragState((currentState) =>
        currentState
          ? {
              ...currentState,
              clientX: trackedTouch.clientX,
              clientY: trackedTouch.clientY,
            }
          : currentState
      );
    }

    function handleTouchEnd(event: TouchEvent): void {
      const trackedTouch = findTrackedTouch(event.changedTouches);

      if (!trackedTouch) {
        return;
      }

      event.preventDefault();

      const canvasBounds = canvasContainerRef.current?.getBoundingClientRect();
      const droppedInsideCanvas = canvasBounds
        ? trackedTouch.clientX >= canvasBounds.left &&
          trackedTouch.clientX <= canvasBounds.right &&
          trackedTouch.clientY >= canvasBounds.top &&
          trackedTouch.clientY <= canvasBounds.bottom
        : false;

      if (droppedInsideCanvas && canvasState.reactFlowInstance) {
        const position = canvasState.reactFlowInstance.screenToFlowPosition({
          x: trackedTouch.clientX,
          y: trackedTouch.clientY,
        });

        addNode(activeMobileDrag.kind, position);
        setMobileAddFeedback(activeMobileDrag.kind);
      }

      setMobileDragState(null);
    }

    function handleTouchCancel(): void {
      setMobileDragState(null);
    }

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });
    window.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [addNode, canvasState.reactFlowInstance, isCompactViewport, mobileDragState]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#edf0f2] px-3 py-3 text-foreground sm:px-6 sm:py-4 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col rounded-[20px] border border-black/8 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)] lg:h-full lg:min-h-0 lg:overflow-hidden">
        <header className="flex flex-col gap-4 border-b border-black/8 px-4 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-end lg:justify-between lg:px-6">
          <WorkflowHeading />

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-start">


            <Button
              variant="outline"
              type="button"
              onClick={openImportModal}
              className="w-full sm:w-auto"
            >
              Import JSON
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={openExportModal}
              className="col-span-2 w-full sm:col-span-1 sm:w-auto"
            >Export JSON</Button>

            <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
              <Button
                type="button"
                onClick={handleRunWorkflow}
                className="w-full sm:w-auto"
                disabled={isRunning || nodes.length === 0}
              >
                {isRunning ? "Running..." : "Run Workflow"}
              </Button>
            </div>
          </div>
        </header>

        <section
          className={cn(
            "relative grid min-h-0 flex-1 gap-0",
            isExecutionLogsOpen
              ? "lg:grid-cols-[auto_minmax(0,1fr)_22rem]"
              : "lg:grid-cols-[auto_minmax(0,1fr)]",
          )}
        >
          <aside
            className={cn(
              "relative overflow-visible bg-[#f6f8f9] transition-[width,max-height,padding] duration-300 ease-out lg:border-r lg:border-b-0",
              isCompactViewport
                ? cn(
                    "border-b border-black/8",
                    isNodeSidebarOpen
                      ? "max-h-105 p-4 sm:p-5"
                      : "max-h-0 p-0"
                  )
                : cn(
                    "border-b border-black/8",
                    isNodeSidebarOpen
                      ? "w-full p-4 sm:p-5 lg:w-70"
                      : "w-0 p-0"
                  )
            )}
          >
            <div
              className={cn(
                "transition-all duration-200",
                isNodeSidebarOpen
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0"
              )}
            >
              <Card className="rounded-2xl">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-base">Node state</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {workflowNodeCatalog.map((nodeItem) => (
                      <div
                        key={nodeItem.kind}
                        draggable={!isCompactViewport}
                        onDragStart={(event) =>
                          handleNodeTypeDragStart(event, nodeItem.kind)
                        }
                        onTouchStart={(event) =>
                          handleMobileNodeTouchStart(
                            event,
                            nodeItem.kind,
                            nodeItem.badge
                          )
                        }
                        className={`workflow-node-palette-item flex cursor-grab flex-col items-center gap-3 rounded-xl border px-4 py-3 text-center transition active:cursor-grabbing sm:flex-row sm:items-start sm:justify-between sm:text-left ${workflowNodeAppearanceByKind[nodeItem.kind].sidebarClassName}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {nodeItem.badge}
                          </p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:whitespace-nowrap">
                            {nodeItem.defaultSubtitle}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`w-full sm:w-auto sm:shrink-0 ${workflowNodeAppearanceByKind[nodeItem.kind].sidebarButtonClassName} ${isCompactViewport && mobileAddFeedback===nodeItem.kind ? "animate-pulse ring-2 ring-sky-400/60" : ""}`}
                          onClick={() => handleAddNodeFromButton(nodeItem.kind)}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <button
              type="button"
              aria-label={isNodeSidebarOpen ? "Collapse node sidebar" : "Expand node sidebar"}
              title={isNodeSidebarOpen ? "Collapse node sidebar" : "Expand node sidebar"}
              onClick={() => setIsNodeSidebarOpen((currentState) => !currentState)}
              className={cn(
                "absolute z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-slate-900",
                isCompactViewport
                  ? isNodeSidebarOpen
                    ? "right-4 -bottom-5"
                    : "right-4 top-3"
                  : isNodeSidebarOpen
                    ? "-right-5 top-5"
                    : "left-3 top-5"
              )}
            >
              {isCompactViewport ? (
                isNodeSidebarOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )
              ) : (
                <svg
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isNodeSidebarOpen ? "" : "rotate-180"
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              )}
            </button>
          </aside>

          <div className="min-h-0 bg-[#f1f4f5] p-3 sm:p-5 lg:p-6">
            <Card className="flex h-full min-h-[65vh] flex-col rounded-[18px] sm:min-h-[70vh] lg:min-h-0">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <CardTitle>Workflow canvas</CardTitle>
                  <CardDescription className="mt-1">
                    Make a workflow
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  <Badge variant="outline">{nodes.length} nodes</Badge>
                  <Badge variant="outline">{edges.length} links</Badge>
                </div>
              </div>

              <div
                ref={canvasContainerRef}
                className="relative flex min-h-[55vh] flex-1 overflow-hidden rounded-b-[18px] bg-[#fbfcfd] sm:min-h-[60vh] lg:min-h-0"
              >
                <WorkflowCanvas
                  key={viewportResetToken}
                  nodes={canvasNodes}
                  edges={edges}
                  onNodesChange={handleCanvasNodesChange}
                  onEdgesChange={handleCanvasEdgesChange}
                  onNodesDelete={handleCanvasNodesDelete}
                  onConnect={handleConnect}
                  isValidConnection={validateConnection}
                  onDropNode={handleDropNode}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onReset={handleReset}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  hideCanvasActions={isCompactViewport && isExecutionLogsOpen}
                  onCanvasInit={handleCanvasInit}
                  viewportResetToken={viewportResetToken}
                />
              </div>
            </Card>
          </div>

          {isCompactViewport && isExecutionLogsOpen ? (
            <button
              type="button"
              aria-label="Close execution logs overlay"
              title="Close execution logs overlay"
              onClick={() => setIsExecutionLogsOpen(false)}
              className="absolute inset-0 z-20 bg-slate-950/20"
            />
          ) : null}

          <aside
            className={cn(
              "relative min-h-0 border-t border-black/8 bg-[#f8fafb] p-3 sm:p-5 lg:border-t-0",
              isCompactViewport
                ? cn(
                    "fixed bottom-0 left-0 top-0 z-30 w-[min(88vw,24rem)] max-w-sm border-r border-black/8 shadow-[18px_0_36px_rgba(15,23,42,0.16)] transition-transform duration-300 ease-out",
                    isExecutionLogsOpen ? "translate-x-0" : "-translate-x-full",
                  )
                : isExecutionLogsOpen
                  ? "lg:border-l lg:p-6"
                  : "hidden",
            )}
          >
            <Card className="flex h-full min-h-0 flex-col rounded-[18px]">
              <CardHeader className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div>
                    <CardTitle>Execution logs</CardTitle>
                    <CardDescription className="mt-1">
                      Follow each workflow step as it runs.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col gap-3 px-5 py-5">
                {showValidationFeedback && validationSummary.hasErrors ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <div className="font-medium">Validation issues found</div>
                    <div
                      className={cn(
                        "mt-2 space-y-2",
                        validationIssueItems.length > 5 ? "max-h-64 overflow-y-auto pr-1" : "",
                      )}
                    >
                      {validationIssueItems.map((issue) =>
                        issue.nodeId ? (
                          <button
                            key={issue.key}
                            type="button"
                            onClick={() => {
                              if (issue.nodeId) {
                                focusNodeById(issue.nodeId);
                              }
                            }}
                            className="block w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-left text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                          >
                            <span className="font-medium">{issue.nodeId}</span>: {issue.message}
                          </button>
                        ) : (
                          <div
                            key={issue.key}
                            className="rounded-lg border border-rose-200 bg-white px-3 py-2"
                          >
                            {issue.message}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{logs.length} logs</Badge>
                    <Badge variant="outline">{isRunning ? "Active run" : "Idle"}</Badge>
                    {showValidationFeedback && validationSummary.hasErrors ? (
                      <Badge variant="outline" className="border-rose-200 text-rose-700">
                        Validation errors
                      </Badge>
                    ) : null}
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={handleResetExecution}
                    disabled={isRunning}
                  >
                    Reset Execution
                  </Button>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">

                  {logs.length === 0 ? (

                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                      Run the workflow to see live execution updates.
                    </div>

                  ) : (
                    logs.map((log)=>(
                      <div
                        key={log.id}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-sm",
                          getLogCardClassName(log),
                        )}>

                        <div className="font-medium">{log.message}</div>
                        
                        <div className="mt-1 text-[11px] uppercase tracking-[0.08em] opacity-75">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {isExecutionLogsOpen ? (
              <button
                type="button"
                aria-label="Hide execution logs"
                title="Hide execution logs"
                onClick={() => setIsExecutionLogsOpen(false)}
                className={cn(
                  "absolute z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-slate-900",
                  isCompactViewport
                    ? "-right-5 top-1/2 -translate-y-1/2"
                    : "lg:-left-5 lg:top-5",
                )}
              >
                {isCompactViewport ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelRightClose className="h-4 w-4" />
                )}
              </button>
            ) : null}
          </aside>

          {!isExecutionLogsOpen ? (
            <button
              type="button"
              aria-label="Show execution logs"
              title="Show execution logs"
              onClick={() => setIsExecutionLogsOpen(true)}
              className={cn(
                "absolute z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-slate-900",
                isCompactViewport ? "-left-2 top-1/2 -translate-y-1/2" : "lg:right-4 lg:top-5",
              )}
            >
              {isCompactViewport ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </section>
      </div>

      {nodeEditor.editingNodeId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-3 sm:px-4">
          <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:max-h-[calc(100vh-2rem)]">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Edit node
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedNode
                  ? `Update the content for the ${selectedNode.data.kind} node.`
                  : "Update the label shown on the workflow."}
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
                  value={nodeEditor.draftTitle}

                  onChange={(event) =>
                    setNodeEditor((currentEditor) => ({
                      ...currentEditor,
                      draftTitle: event.target.value,
                    }))

                  }
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
                  value={nodeEditor.draftSubtitle}

                  onChange={(event) =>
                    setNodeEditor((currentEditor) => ({
                      ...currentEditor,
                      draftSubtitle: event.target.value,
                    }))

                  }
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <Button variant="outline" type="button" onClick={closeNodeEditor}>
                Cancel
              </Button>
              <Button type="button" onClick={saveNodeDetails}>
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {jsonModal.mode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-3 sm:px-4">
          <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:max-h-[calc(100vh-2rem)]">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                {jsonModal.mode === "export"
                  ? "Export workflow JSON"
                  : "Import workflow JSON"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {jsonModal.mode==="export"
                  ? "Copy this snapshot if you want to save or share the current flow."
                  : "Paste a saved workflow snapshot to load it into the canvas."}
              </p>
            </div>

            <div className="space-y-4 px-5 py-5">
              <textarea
                value={jsonModal.workflowJson}

                onChange={(event) =>
                  setJsonModal((currentModal) => ({
                    ...currentModal,
                    workflowJson: event.target.value,
                  }))
                  
                }
                readOnly={jsonModal.mode === "export"}
                rows={16}
                className="min-h-80 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-400 sm:resize-none"
              />

              {jsonModal.jsonError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {jsonModal.jsonError}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <Button variant="outline" type="button" onClick={closeJsonModal}>
                Close
              </Button>
              {jsonModal.mode === "import" ? (
                <Button type="button" onClick={importWorkflow}>
                  Load Workflow
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {mobileDragState ? (
        <div className="pointer-events-none fixed inset-0 z-50">
          <div
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-sm font-medium text-slate-900 shadow-[0_18px_36px_rgba(15,23,42,0.18)]",
              workflowNodeAppearanceByKind[mobileDragState.kind].sidebarClassName
            )}
            style={{
              left: mobileDragState.clientX,
              top: mobileDragState.clientY,
            }}
          >
            {mobileDragState.label}
          </div>
        </div>
      ) : null}
    </main>
  );
}

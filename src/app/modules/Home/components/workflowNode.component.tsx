"use client";

import type { JSX } from "react";
import { AlertCircle, Info, Lock, Settings2 } from "lucide-react";
import {
  Handle,
  NodeResizeControl,
  Position,
  useNodeId,
  useStore,
  type NodeProps,
} from "reactflow";
import { cn } from "@/common/utils/cn.util";
import type { WorkflowNodeData } from "../types/workflow.type";
import {
  workflowNodeAppearanceByKind,
  workflowNodeShapeAppearanceByShape,
} from "../utils/workflowNodeFactory.util";

const statusAppearance = {
  idle: {
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-600",
    shellClassName: "border-slate-200",
    label: "Idle",
  },
  running: {
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-700",
    shellClassName: "border-amber-400 ring-2 ring-amber-300/70",
    label: "Running",
  },
  success: {
    badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
    shellClassName: "",
    label: "Success",
  },
  error: {
    badgeClassName: "border-rose-200 bg-rose-100 text-rose-700",
    shellClassName: "border-rose-400 ring-2 ring-rose-300/70",
    label: "Error",
  },
} as const;

const shapeOutlineAppearance = {
  start: "border-emerald-400/85",
  action: "border-sky-400/85",
  condition: "border-amber-400/90",
  end: "border-slate-400/85",
} as const;

function toAlphaColor(color: string, alpha: number): string {
  if (color.startsWith("#")) {
    const normalizedHex = color.slice(1);
    const hexValue =
      normalizedHex.length === 3
        ? normalizedHex
            .split("")
            .map((part) => part + part)
            .join("")
        : normalizedHex;

    if (hexValue.length === 6) {
      const red = Number.parseInt(hexValue.slice(0, 2), 16);
      const green = Number.parseInt(hexValue.slice(2, 4), 16);
      const blue = Number.parseInt(hexValue.slice(4, 6), 16);

      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
  }

  return color;
}

export function WorkflowNode({
  id,
  data,
  selected,
}: NodeProps<WorkflowNodeData>): JSX.Element {
  const currentNodeId = useNodeId();
  const internalNode = useStore((state) =>
    currentNodeId ? state.nodeInternals.get(currentNodeId) : null,
  );
  const isCondition = data.kind === "condition";
  const nodeAppearance =
    workflowNodeAppearanceByKind[data.kind] ?? workflowNodeAppearanceByKind.action;
  const nodeShapeAppearance =
    workflowNodeShapeAppearanceByShape.rectangle;
  const currentStatusAppearance =
    statusAppearance[data.status] ?? statusAppearance.idle;
  const hasValidationError = Boolean(data.validationMessage);
  const leftTargetHandleClassName =
    "!left-0 !top-1/2 !-translate-x-1/2 !-translate-y-1/2";
  const accentColor = data.color ?? null;
  const customNodeSurfaceStyle = accentColor
    ? {
        borderColor: accentColor,
        backgroundColor: toAlphaColor(accentColor, 0.08),
      }
    : undefined;
  const customNodeOutlineStyle = accentColor
    ? {
        borderColor: accentColor,
      }
    : undefined;
  const customTitleBadgeStyle = accentColor
    ? {
        borderColor: toAlphaColor(accentColor, 0.28),
        backgroundColor: toAlphaColor(accentColor, 0.14),
        color: accentColor,
      }
    : undefined;
  const resizedFrameStyle =
    internalNode?.width || internalNode?.height
      ? {
          width: internalNode?.width ?? undefined,
          minHeight: internalNode?.height ?? undefined,
          height: internalNode?.height ?? undefined,
        }
      : undefined;

  return (
    <div
      className={cn(
        "group relative max-w-[75vw] pt-7 transition-all",
        nodeShapeAppearance.frameClassName,
      )}
      style={resizedFrameStyle}
    >
      <div
        className={cn(
          "absolute inset-0 border shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all",
          nodeAppearance.cardClassName,
          nodeShapeAppearance.shellClassName,
        currentStatusAppearance.shellClassName,
        hasValidationError ? "border-rose-400! ring-2 ring-rose-200/80" : "",
        selected
          ? "ring-2 ring-slate-900/20 shadow-[0_0_0_2px_rgba(15,23,42,0.1),0_14px_30px_rgba(15,23,42,0.16)]"
          : "",
        )}
        style={customNodeSurfaceStyle}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 border-2",
          nodeShapeAppearance.shellClassName,
          shapeOutlineAppearance[data.kind],
          selected ? "opacity-100" : "opacity-80",
          hasValidationError ? "border-rose-400!" : "",
        )}
        style={customNodeOutlineStyle}
      />
      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2">
        <div
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] shadow-sm",
            currentStatusAppearance.badgeClassName,
          )}
        >
          {currentStatusAppearance.label}
        </div>
      </div>

      <NodeResizeControl
        minWidth={180}
        minHeight={110}
        position="bottom-right"
        className={cn(
          "nodrag nopan !h-6 !w-6 !rounded-full !border !border-slate-200 !bg-white !text-slate-500 !shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition hover:!border-slate-300 hover:!text-slate-900",
          data.isLocked ? "!pointer-events-none !opacity-0" : "",
          selected ? "!opacity-100" : "!opacity-0 group-hover:!opacity-100",
        )}
      >
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M6 13H13V6" />
          <path d="M9 13L13 9" />
        </svg>
      </NodeResizeControl>

      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "h-3.5! w-3.5! border-2! border-white! bg-slate-400! opacity-80! shadow-[0_0_0_0_rgba(148,163,184,0.0)]! transition-all duration-200 group-hover:scale-110! group-hover:opacity-100! group-hover:shadow-[0_0_0_6px_rgba(148,163,184,0.16)]! hover:scale-115! hover:shadow-[0_0_0_8px_rgba(148,163,184,0.22)]!",
          leftTargetHandleClassName,
          selected
            ? "scale-110! opacity-100! shadow-[0_0_0_6px_rgba(148,163,184,0.16)]!"
            : "",
        )}
      />

      <div
        className={cn(
          "relative z-10 flex h-full flex-col",
          nodeShapeAppearance.contentClassName,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className={cn(
                "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                nodeAppearance.badgeClassName,
              )}
              style={customTitleBadgeStyle}
            >
              {data.title}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {data.isLocked ? (
              <div
                className="inline-flex items-center justify-center rounded-md border border-amber-200 bg-amber-50 p-1.5 text-amber-700"
                title="Locked node"
                aria-label="Locked node"
              >
                <Lock className="h-4 w-4" />
              </div>
            ) : null}
            {data.validationMessage ? (
              <div className="group/info relative">
                <button
                  type="button"
                  aria-label="View validation details"
                  title={data.validationMessage}
                  className="nodrag nopan inline-flex cursor-help items-center justify-center rounded-md border border-rose-200 bg-rose-50 p-1.5 text-rose-700 transition hover:bg-rose-100"
                >
                  <Info className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs leading-5 text-rose-700 opacity-0 shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition duration-150 group-hover/info:opacity-100">
                  {data.validationMessage}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              aria-label={`Open settings for ${data.title}`}
              title="Node settings"
              onClick={() => data.onEdit?.(id)}
              className="nodrag nopan cursor-pointer rounded-md border border-slate-200 bg-white/80 p-1.5 text-slate-700 transition hover:bg-white hover:text-slate-950"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">{data.subtitle}</p>

        {data.lastError ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {data.lastError}
          </div>
        ) : null}
        {isCondition ? (
          <>
            <Handle
              id="yes"
              type="source"
              position={Position.Right}
              style={{top: "34%"}}

              className={cn(
                "!left-auto !right-[-7px] !-translate-y-1/2 !translate-x-0 h-3.5! w-3.5! border-2! border-white! bg-emerald-500! opacity-85! shadow-[0_0_0_0_rgba(16,185,129,0.0)]! transition-all duration-200 group-hover:scale-110! group-hover:opacity-100! group-hover:shadow-[0_0_0_6px_rgba(16,185,129,0.18)]! hover:scale-115! hover:shadow-[0_0_0_8px_rgba(16,185,129,0.24)]!",

                selected
                  ? "scale-110! opacity-100! shadow-[0_0_0_6px_rgba(16,185,129,0.18)]!"
                  : "",
                data.isLocked ? "!pointer-events-none !opacity-40" : "",
              )}

            />

            <Handle
              id="no"
              type="source"
              position={Position.Right}
              style={{ top: "66%" }}
              className={cn(
                "!left-auto !right-[-7px] !-translate-y-1/2 !translate-x-0 h-3.5! w-3.5! border-2! border-white! bg-rose-500! opacity-85! shadow-[0_0_0_0_rgba(244,63,94,0.0)]! transition-all duration-200 group-hover:scale-110! group-hover:opacity-100! group-hover:shadow-[0_0_0_6px_rgba(244,63,94,0.18)]! hover:scale-115! hover:shadow-[0_0_0_8px_rgba(244,63,94,0.24)]!",

                selected
                  ? "scale-110! opacity-100! shadow-[0_0_0_6px_rgba(244,63,94,0.18)]!"
                  : "",
                data.isLocked ? "!pointer-events-none !opacity-40" : "",


              )
            }
            />
            <div className="mt-auto pt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
              <div className="flex justify-end gap-2">
                <span>Yes</span>
                <span>No</span>
              </div>
            </div>
          </>
        ) : (
          <Handle
            type="source"
            position={Position.Right}
            className={cn(
              "!left-auto !right-[-7px] !top-1/2 !-translate-y-1/2 !translate-x-0 h-3.5! w-3.5! border-2! border-white! bg-slate-400! opacity-80! shadow-[0_0_0_0_rgba(148,163,184,0.0)]! transition-all duration-200 group-hover:scale-110! group-hover:opacity-100! group-hover:shadow-[0_0_0_6px_rgba(148,163,184,0.16)]! hover:scale-115! hover:shadow-[0_0_0_8px_rgba(148,163,184,0.22)]!",
              selected
                ? "scale-110! opacity-100! shadow-[0_0_0_6px_rgba(148,163,184,0.16)]!"
                : "",
              data.isLocked ? "!pointer-events-none !opacity-40" : "",
            )}
          />
        )}
      </div>

      {hasValidationError ? (
        <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 translate-y-1/2">
          <div className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-700 shadow-sm">
            <AlertCircle className="h-3.5 w-3.5" />
            Invalid
          </div>
        </div>
      ) : null}
    </div>
  );
}

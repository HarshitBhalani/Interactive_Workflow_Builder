"use client";

import type { JSX } from "react";
import { AlertCircle, Info } from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/common/utils/cn.util";
import type { WorkflowNodeData } from "../types/workflow.type";
import { workflowNodeAppearanceByKind } from "../utils/workflowNodeFactory.util";

const statusAppearance = 
{
  idle: {
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-600",
    cardClassName: "",
    label: "Idle",
  },

  running: {
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-700",
    cardClassName: "ring-2 ring-amber-300/70",
    label: "Running",
  },

  success: {
    badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
    cardClassName: "ring-2 ring-emerald-300/70",
    label: "Success",
  },
  error: {

    badgeClassName: "border-rose-200 bg-rose-100 text-rose-700",
    cardClassName: "ring-2 ring-rose-300/70",
    label: "Error",
  },
  
} as const;

export function WorkflowNode({
  id,
  data,
  selected,
}: NodeProps<WorkflowNodeData>): JSX.Element{ //JSX elemet because we are using reactflow and it expects a JSX element to be returned from the node component
  const isCondition = data.kind==="condition";
  const nodeAppearance = workflowNodeAppearanceByKind[data.kind] ?? workflowNodeAppearanceByKind.action;
  const currentStatusAppearance =statusAppearance[data.status] ?? statusAppearance.idle;
  const hasValidationError = Boolean(data.validationMessage);

  return (
    <div
      className={cn(
        "group relative w-55 max-w-[75vw] rounded-2xl border p-4 pt-7 transition-all sm:w-60",
        nodeAppearance.cardClassName,
        currentStatusAppearance.cardClassName,
        hasValidationError ? "border-rose-400! ring-2 ring-rose-200/80" : "",

        selected
          ? "border-slate-900 shadow-[0_0_0_2px_rgba(15,23,42,0.08),0_14px_30px_rgba(15,23,42,0.16)]"
          : "shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
      )}
    >
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
        <div
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] shadow-sm",
            currentStatusAppearance.badgeClassName,
          )}
        >
          {currentStatusAppearance.label}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "h-3.5! w-3.5! border-2! border-white! bg-slate-400! opacity-80! shadow-[0_0_0_0_rgba(148,163,184,0.0)]! transition-all duration-200 group-hover:scale-110! group-hover:opacity-100! group-hover:shadow-[0_0_0_6px_rgba(148,163,184,0.16)]! hover:scale-115! hover:shadow-[0_0_0_8px_rgba(148,163,184,0.22)]!",
          selected
            ? "scale-110! opacity-100! shadow-[0_0_0_6px_rgba(148,163,184,0.16)]!"
            : ""
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={cn(
              "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
              nodeAppearance.badgeClassName
            )}
          >
            {data.title}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
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
            aria-label={`Edit ${data.title}`}
            title="Edit node"
            onClick={() => data.onEdit?.(id)}
            className="nodrag nopan cursor-pointer rounded-md border border-slate-200 p-1.5 text-blue-600 transition hover:bg-slate-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          <button
            type="button"
            aria-label={`Delete ${data.title}`}
            title="Delete node"
            onClick={() => data.onDelete?.(id)}
            className="nodrag nopan cursor-pointer rounded-md border border-slate-200 p-1.5 text-red-600 transition hover:bg-slate-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{data.subtitle}</p>

      {data.lastError ? (

        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {data.lastError}
        </div>

      ) : null}

      {selected ? (
        
        <div className="mt-3 text-xs font-medium text-slate-500">Selected</div>
      ) : null}

      {isCondition ? (
        <>
          <Handle
            id="yes"
            type="source"
            position={Position.Right}
            style={{ top: "38%" }}
            className={cn(
              "h-3.5! w-3.5! border-2! border-white! bg-emerald-500! opacity-85! shadow-[0_0_0_0_rgba(16,185,129,0.0)]! transition-all duration-200 group-hover:scale-110! group-hover:opacity-100! group-hover:shadow-[0_0_0_6px_rgba(16,185,129,0.18)]! hover:scale-115! hover:shadow-[0_0_0_8px_rgba(16,185,129,0.24)]!",
              selected
                ? "scale-110! opacity-100! shadow-[0_0_0_6px_rgba(16,185,129,0.18)]!"
                : ""
            )}
          />
          <Handle
            id="no"
            type="source"
            position={Position.Right}
            style={{ top: "70%" }}
            className={cn(
              "h-3.5! w-3.5! border-2! border-white! bg-rose-500! opacity-85! shadow-[0_0_0_0_rgba(244,63,94,0.0)]! transition-all duration-200 group-hover:scale-110! group-hover:opacity-100! group-hover:shadow-[0_0_0_6px_rgba(244,63,94,0.18)]! hover:scale-115! hover:shadow-[0_0_0_8px_rgba(244,63,94,0.24)]!",
              selected
                ? "scale-110! opacity-100! shadow-[0_0_0_6px_rgba(244,63,94,0.18)]!"
                : ""
            )}
          />
          <div className="mt-4 flex justify-end gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
            <span>Yes</span>
            <span>No</span>
          </div>
        </>
      ) : (
        <>
          <Handle
            type="source"
            position={Position.Right}
            className={cn(
              "h-3.5! w-3.5! border-2! border-white! bg-slate-400! opacity-80! shadow-[0_0_0_0_rgba(148,163,184,0.0)]! transition-all duration-200 group-hover:scale-110! group-hover:opacity-100! group-hover:shadow-[0_0_0_6px_rgba(148,163,184,0.16)]! hover:scale-115! hover:shadow-[0_0_0_8px_rgba(148,163,184,0.22)]!",
              selected
                ? "scale-110! opacity-100! shadow-[0_0_0_6px_rgba(148,163,184,0.16)]!"
                : ""
            )}
          />
        </>
      )}

      {hasValidationError ? (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-700 shadow-sm">
            <AlertCircle className="h-3.5 w-3.5" />
            Invalid
          </div>
        </div>
      ) : null}
    </div>
  );
}

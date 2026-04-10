"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import type { WorkflowNodeData } from "../types/workflow.type";

const nodeTone = {
  start: "border-emerald-200 bg-emerald-50 text-emerald-700",
  action: "border-sky-200 bg-sky-50 text-sky-700",
  condition: "border-amber-200 bg-amber-50 text-amber-700",
  end: "border-slate-200 bg-slate-100 text-slate-700",
} satisfies Record<WorkflowNodeData["kind"], string>;

export function WorkflowNode({
  id,
  data,
  selected,
}: NodeProps<WorkflowNodeData>){
  const isCondition = data.kind==="condition";

  return (
    <div
      className={`w-55 max-w-[75vw] rounded-2xl border bg-white p-4 transition-shadow sm:w-60 ${
        selected
          ? "border-slate-900 shadow-[0_0_0_2px_rgba(15,23,42,0.08),0_14px_30px_rgba(15,23,42,0.16)]"
          : "border-slate-200 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="h-3! w-3! border-2! border-white! bg-slate-400!"
      />

      <div className="flex items-start justify-between gap-3">
        <div
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${nodeTone[data.kind]}`}
        >
          {data.title}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
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
            className="h-3! w-3! border-2! border-white! bg-emerald-500!"
          />
          <Handle
            id="no"
            type="source"
            position={Position.Right}
            style={{ top: "70%" }}
            className="h-3! w-3! border-2! border-white! bg-rose-500!"
          />
          <div className="mt-4 flex justify-end gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
            <span>Yes</span>
            <span>No</span>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="h-3! w-3! border-2! border-white! bg-slate-400!"
        />
      )}
    </div>
  );
}

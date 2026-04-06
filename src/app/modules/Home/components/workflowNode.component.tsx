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
}: NodeProps<WorkflowNodeData>) {
  const isCondition = data.kind === "condition";

  return (
    <div
      className={`min-w-47.5 rounded-2xl border bg-white p-4 transition-shadow ${
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
        <button
          type="button"
          onClick={() => data.onEdit?.(id)}
          className="nodrag nopan rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Edit
        </button>
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

"use client";

import type { JSX } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "reactflow";

export function WorkflowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  markerStart,
  style,
  label,
  selected,
  interactionWidth,
}: EdgeProps): JSX.Element {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        interactionWidth={interactionWidth}
        style={{
          ...style,
          strokeWidth: selected ? 3 : style?.strokeWidth ?? 1.5,
          filter: selected
            ? "drop-shadow(0 0 2px rgba(15, 23, 42, 0.18)) drop-shadow(0 0 10px rgba(15, 23, 42, 0.2))"
            : "none",
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {label ? (
            <span
              className="rounded-full border border-white/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
              style={{
                filter: selected
                  ? "drop-shadow(0 0 8px rgba(15, 23, 42, 0.18))"
                  : "none",
                transform: selected ? "scale(1.04)" : "scale(1)",
              }}
            >
              {String(label)}
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

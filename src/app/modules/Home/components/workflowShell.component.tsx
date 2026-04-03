import { WorkflowHeading } from "./workflowHeading.component";

const nodeTypes = ["Start", "Action", "Condition", "End"];

export function WorkflowShell() {
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
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
              Draft
            </span>
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Save
            </button>
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
              Validate
            </button>
          </div>
        </header>

        <section className="grid flex-1 gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-b border-black/8 bg-[#f6f8f9] p-5 lg:border-r lg:border-b-0">
            <div className="rounded-[16px] border border-slate-200 bg-white p-4">
              <h2 className="text-base font-semibold text-slate-950">
                Node types
              </h2>
              <div className="mt-4 grid gap-3">
                {nodeTypes.map((nodeType) => (
                  <button
                    key={nodeType}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <span>{nodeType}</span>
                    <span className="text-slate-400">+</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="bg-[#f1f4f5] p-5 lg:p-6">
            <div className="flex h-full min-h-[420px] flex-col rounded-[18px] border border-slate-200 bg-white">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Workflow canvas
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Empty workspace for the first layout milestone.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span className="rounded-md border border-slate-200 px-3 py-1">
                    100%
                  </span>
                  <span className="rounded-md border border-slate-200 px-3 py-1">
                    Center
                  </span>
                </div>
              </div>

              <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-b-[18px] bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.12)_1px,_transparent_1px)] bg-[length:24px_24px] px-6 py-10">
                <div className="absolute inset-6 rounded-[14px] border border-dashed border-slate-300" />

                <div className="relative z-10 w-full max-w-sm rounded-[16px] border border-slate-200 bg-white px-6 py-6 text-center shadow-sm">
                  <h3 className="text-xl font-semibold text-slate-950">
                    Canvas is empty
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The layout is in place. Next we will render the first nodes
                    here and start wiring basic interactions.
                  </p>
                  <div className="mt-5 flex justify-center">
                    <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                      Add first node
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

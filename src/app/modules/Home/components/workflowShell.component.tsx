import { WorkflowHeading } from "./workflowHeading.component";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
                {nodeTypes.map((nodeType) => (
                  <Button
                    key={nodeType}
                    variant="outline"
                    className="h-auto w-full justify-between rounded-xl bg-slate-50 px-4 py-3 text-left"
                  >
                    <span>{nodeType}</span>
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
                    Empty workspace for the first layout milestone.
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

              <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-b-[18px] bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.12)_1px,_transparent_1px)] bg-[length:24px_24px] px-6 py-10">
                <div className="absolute inset-6 rounded-[14px] border border-dashed border-slate-300" />

                <Card className="relative z-10 w-full max-w-sm rounded-[16px] text-center shadow-sm">
                  <CardHeader className="px-6 py-6 pb-2">
                    <CardTitle className="text-xl">Canvas is empty</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                    The layout is in place. Next we will render the first nodes
                    here and start wiring basic interactions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-1">
                    <div className="mt-3 flex justify-center">
                    <Button>
                      Add first node
                    </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

import { APP_NAME } from "@/common/constants/app.constant";

export function WorkflowHeading() {
  return (
    <h1 className="text-center text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
      {APP_NAME}
    </h1>
  );
}

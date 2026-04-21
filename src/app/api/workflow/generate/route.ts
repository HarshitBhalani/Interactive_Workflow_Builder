import { NextResponse } from "next/server";
import {
  buildGeneratedWorkflowResult,
  parseGeneratedWorkflowDefinition,
} from "@/app/modules/Home/utils/workflowAi.util";

const workflowGenerationSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: 120,
    },
    description: {
      type: "string",
      minLength: 1,
      maxLength: 240,
    },
    nodes: {
      type: "array",
      minItems: 2,
      maxItems: 12,
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            minLength: 1,
            maxLength: 60,
          },
          kind: {
            type: "string",
            enum: ["start", "action", "condition", "end"],
          },
          title: {
            type: "string",
            minLength: 1,
            maxLength: 80,
          },
          subtitle: {
            type: "string",
            minLength: 1,
            maxLength: 140,
          },
          shape: {
            type: "string",
            enum: [
              "terminator",
              "rectangle",
              "square",
              "diamond",
              "parallelogram",
              "hexagon",
              "circle",
              "document",
            ],
          },
          color: {
            type: "string",
            maxLength: 30,
          },
        },
        required: ["id", "kind", "title", "subtitle"],
        additionalProperties: false,
      },
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source: {
            type: "string",
            minLength: 1,
            maxLength: 60,
          },
          target: {
            type: "string",
            minLength: 1,
            maxLength: 60,
          },
          label: {
            type: "string",
            maxLength: 32,
          },
        },
        required: ["source", "target"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "description", "nodes", "edges"],
  additionalProperties: false,
} as const;

type GenerateWorkflowRequestBody = {
  prompt?: unknown;
};

function getOutputText(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const responseRecord = value as Record<string, unknown>;

  if (typeof responseRecord.output_text === "string" && responseRecord.output_text.trim()) {
    return responseRecord.output_text;
  }

  if (!Array.isArray(responseRecord.output)) {
    return null;
  }

  for (const item of responseRecord.output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const outputItem = item as Record<string, unknown>;

    if (!Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (!contentItem || typeof contentItem !== "object") {
        continue;
      }

      const contentRecord = contentItem as Record<string, unknown>;

      if (
        contentRecord.type === "output_text" &&
        typeof contentRecord.text === "string" &&
        contentRecord.text.trim()
      ) {
        return contentRecord.text;
      }
    }
  }

  return null;
}

export async function POST(request: Request): Promise<Response> {
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey) {
    return NextResponse.json(
      {
        success: false,
        message:
          "OPENAI_API_KEY is missing. Add it to your server environment before using AI workflow generation.",
      },
      { status: 500 },
    );
  }

  let requestBody: GenerateWorkflowRequestBody;

  try {
    requestBody = (await request.json()) as GenerateWorkflowRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "The request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const prompt =
    typeof requestBody.prompt === "string" ? requestBody.prompt.trim() : "";

  if (prompt.length < 8) {
    return NextResponse.json(
      {
        success: false,
        message: "Enter a longer prompt so the AI can build a useful workflow.",
      },
      { status: 400 },
    );
  }

  const model = process.env.OPENAI_WORKFLOW_MODEL || "gpt-5-mini";
  const input = [
    "You create practical business workflows for a visual workflow builder.",
    "Return only JSON that matches the provided schema.",
    "Keep the workflow concise, logically connected, and easy to read.",
    "Prefer 4 to 8 nodes unless the prompt clearly needs more.",
    "Use `condition` only when there is an actual branch.",
    "Use edge labels only for branch outputs such as Yes and No.",
    "Make node titles short and subtitles specific.",
    "",
    `User prompt: ${prompt}`,
  ].join("\n");

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model,
      input,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "workflow_definition",
          strict: true,
          schema: workflowGenerationSchema,
        },
      },
    }),
  });

  if (!openAiResponse.ok) {
    const errorPayload = (await openAiResponse.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    return NextResponse.json(
      {
        success: false,
        message:
          errorPayload?.error?.message ??
          "OpenAI could not generate the workflow right now.",
      },
      { status: 502 },
    );
  }

  const responsePayload = (await openAiResponse.json()) as unknown;
  const outputText = getOutputText(responsePayload);

  if (!outputText) {
    return NextResponse.json(
      {
        success: false,
        message: "The AI response did not include a workflow payload.",
      },
      { status: 502 },
    );
  }

  try {
    const generatedWorkflow = parseGeneratedWorkflowDefinition(
      JSON.parse(outputText) as unknown,
    );
    const workflowResult = buildGeneratedWorkflowResult(generatedWorkflow);

    return NextResponse.json({
      success: true,
      workflow: workflowResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "The AI workflow output could not be processed.",
      },
      { status: 502 },
    );
  }
}

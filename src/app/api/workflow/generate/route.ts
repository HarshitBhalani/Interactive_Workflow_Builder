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
        },
        required: ["id", "kind", "title", "subtitle", "shape"],
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
            minLength: 0,
            maxLength: 32,
            description: "Always include this field. Use \"\" for normal edges and use values like \"Yes\" or \"No\" for decision branches.",
          },
        },
        required: ["source", "target", "label"],
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

function getOpenAiOutputText(value: unknown): string | null {
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

function getGroqOutputText(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const responseRecord = value as Record<string, unknown>;

  if (!Array.isArray(responseRecord.choices)) {
    return null;
  }

  for (const choice of responseRecord.choices) {
    if (!choice || typeof choice !== "object") {
      continue;
    }

    const choiceRecord = choice as Record<string, unknown>;
    const message = choiceRecord.message;

    if (!message || typeof message !== "object") {
      continue;
    }

    const messageRecord = message as Record<string, unknown>;

    if (typeof messageRecord.content === "string" && messageRecord.content.trim()) {
      return messageRecord.content;
    }
  }

  return null;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (!groqApiKey && !openAiApiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Add GROQ_API_KEY or OPENAI_API_KEY to your server environment before using AI workflow generation.",
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
      "Every edge must include a `label` field.",
      "Use an empty string for normal edges.",
      "Use labels like `Yes` and `No` for branch outputs.",
      "Make node titles short and subtitles specific.",
      "Do not include custom node colors.",
      "",
      `User prompt: ${prompt}`,
    ].join("\n");
    let outputText: string | null = null;

    if (groqApiKey) {
      const groqModel =
        process.env.GROQ_WORKFLOW_MODEL || "openai/gpt-oss-20b";
      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: groqModel,
            messages: [
              {
                role: "system",
                content:
                  "You create practical business workflows for a visual workflow builder. Return only JSON that matches the provided schema.",
              },
              {
                role: "user",
                content: input,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "workflow_definition",
                strict: true,
                schema: workflowGenerationSchema,
              },
            },
          }),
        },
      );

      if (!groqResponse.ok) {
        const errorPayload = (await groqResponse.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;

        return NextResponse.json(
          {
            success: false,
            message:
              errorPayload?.error?.message ??
              "Groq could not generate the workflow right now.",
          },
          { status: 502 },
        );
      }

      const groqPayload = (await groqResponse.json()) as unknown;
      outputText = getGroqOutputText(groqPayload);
    } else if (openAiApiKey) {
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
      outputText = getOpenAiOutputText(responsePayload);
    }

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
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "The AI workflow route failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}

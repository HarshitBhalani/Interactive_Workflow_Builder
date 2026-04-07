# Interactive Workflow Builder

A small visual editor for assembling approval flows and branching workflows. The app lets you place nodes on a canvas, connect them with simple guardrails, edit labels inline, and import or export the current graph as JSON.

## What the project covers

- drag-and-drop node creation with React Flow
- typed workflow state with Zustand and TypeScript
- inline editing for node labels and descriptions
- JSON import/export for saving and restoring workflows
- connection rules for start, end, and condition branches

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Flow
- Zustand

## Running locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Notes on implementation

- Graph state lives in a dedicated store so canvas interactions stay out of the page-level UI.
- The node catalog is centralized, which keeps the sidebar, node creation, and default labels in sync.
- JSON import is validated before state is loaded so malformed payloads fail fast with a readable error.

## Possible next steps

- add undo/redo support
- add workflow-level validation before export
- add tests for validation and persistence helpers
- add keyboard shortcuts for common canvas actions

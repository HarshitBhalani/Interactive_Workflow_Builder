# Interactive Workflow Builder

A simple visual editor for creating workflows with draggable nodes and connections. The app is designed to make flow building easy to understand, with support for editing nodes, validating connections, and importing or exporting the workflow as JSON. The interface direction is inspired by simple whiteboard-style tools such as Excalidraw, with a clean layout and lightweight visual structure.

![Workflow Builder Design](./docs/excalidraw-screen-design.png.png)

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Flow
- Zustand

## Approach and design decisions

- Kept the workflow builder simple, visual, and easy to use.
- Split the app into focused components with clear responsibilities.
- Used `WorkflowCanvas` for rendering and interaction.
- Used custom node and edge components for better readability.
- Chose React Flow as the base for node-based editing.
- Took light design inspiration from Excalidraw for a clean and approachable canvas feel.
- Supported four workflow node types: start, action, condition, and end.

## State management strategy

- Used Zustand for centralized workflow state management.
- Stored nodes, edges, editing actions, and history in one place.
- Kept UI components lighter by moving workflow logic into the store.
- Used snapshots for undo and redo history.
- Reused the same snapshot shape for import and export.

## Challenges encountered

- Managing drag and drop, editing, keyboard shortcuts, and history together.
- Keeping the canvas logic clean and maintainable.
- Preventing invalid workflow connections.
- Handling condition branches like `yes` and `no` correctly.
- Making validation strict without making the editor confusing.

## Potential improvements

- Add automated tests for the store and utility functions.
- Add workflow-level validation before export.
- Add local storage or backend persistence.
- Support more node types and richer node settings.
- Improve edge actions and visual feedback.

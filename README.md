# Interactive Workflow Builder

A simple visual editor for creating workflows with draggable nodes and connections. The app is designed to make flow building easy to understand, with support for editing nodes, validating connections, and importing or exporting the workflow as JSON. The interface direction is inspired by simple whiteboard-style tools such as Excalidraw, with a clean layout and lightweight visual structure.

The app now also includes authentication, Firestore-backed workflow persistence, a saved workflows dashboard, autosave for existing workflows, and starter workflow templates.

## Live Preview

- https://interactive-workflow-builder.vercel.app/

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Flow
- Zustand
- Firebase Authentication
- Cloud Firestore

## Approach and design decisions

- Kept the workflow builder simple, visual, and easy to use.
- Split the app into focused components with clear responsibilities.
- Used `WorkflowCanvas` for rendering and interaction.
- Used custom node and edge components for better readability.
- Chose React Flow as the base for node-based editing.
- Took light design inspiration from Excalidraw for a clean and approachable canvas feel.
- Supported four workflow node types: start, action, condition, and end.
- Added authenticated workflow ownership so each user only sees and edits their own saved flows.
- Kept first save manual, then enabled debounced autosave for existing workflows to reduce noisy writes.

## Implemented features

- Firebase Authentication for sign up, login, logout, and forgot password.
- Firestore-backed workflow save, load, update, and delete.
- Dashboard for listing, searching, opening, renaming, and deleting saved workflows.
- Manual first save with workflow name and optional description.
- Debounced autosave for already-saved workflows.
- Relative save status in the editor header, such as `Saved just now`.
- Custom delete confirmation modal and toast notifications for key workflow actions.
- Workflow toolbar actions for dashboard navigation, save, AI generation, JSON import, and export options.
- Export options for JSON, PNG, SVG, and PDF.
- Mobile canvas toolbar controls for cursor, drag, zoom, and full-page canvas access.
- Full-page canvas mode with mobile-friendly header controls for AI generation and node state.

## State management strategy

- Used Zustand for centralized workflow state management.
- Stored nodes, edges, editing actions, and history in one place.
- Kept UI components lighter by moving workflow logic into the store.
- Used snapshots for undo and redo history.
- Reused the same snapshot shape for import and export.
- Kept Firestore read and write logic outside the Zustand store in a dedicated service layer.

## Challenges encountered

- Managing drag and drop, editing, keyboard shortcuts, and history together.
- Keeping the canvas logic clean and maintainable.
- Preventing invalid workflow connections.
- Handling condition branches like `yes` and `no` correctly.
- Making validation strict without making the editor confusing.

## Future improvements

- Add API integration for external services.
- Add workflow-level validation before export.
- Support richer node configuration.
- Improve edge editing and controls.
- Add automated test coverage.

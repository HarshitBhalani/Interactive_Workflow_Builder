# Interactive Workflow Builder

A visual workflow editor built with React Flow. The app makes it easy to create, edit, organize, and save workflows with draggable nodes, custom connections, validation, and import or export support. The interface is inspired by clean whiteboard-style tools, while also supporting real workflow management features such as authentication, persistence, autosave, templates, execution logs, and responsive editor controls.

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
- Firestore workflow documents now also store `workflowId` inside the document data.
- Dashboard for listing, searching, opening, renaming, and deleting saved workflows.
- Dashboard support for pinning and unpinning workflows.
- Manual first save with workflow name and optional description.
- Debounced autosave for already-saved workflows.
- Relative save status in the editor header, such as `Saved just now`.
- Custom delete confirmation modal and toast notifications for key workflow actions.
- Workflow toolbar actions for dashboard navigation, save, AI generation, JSON import, and export options.
- Keyboard shortcuts for common canvas actions such as cursor mode, drag mode, zoom reset, lock, layer order, group, and ungroup.
- Export options for JSON, PNG, SVG, and PDF.
- Node state sidebar for quickly adding start, action, condition, and end nodes.
- Execution logs panel for live run updates and validation feedback.
- Full-page canvas mode with responsive controls for node state, AI generation, and execution logs.
- Mobile canvas toolbar controls for cursor, drag, zoom, and compact action menus.
- Lock and unlock support for selected nodes.
- Group and ungroup support for selected nodes.
- Layer controls for bringing selected nodes forward or sending them backward.
- Group overlays with editable labels and colors.
- Minimap support with a toggle button.
- AI-assisted workflow generation entry points in the editor toolbar.

## State management strategy

- Used Zustand for centralized workflow state management.
- Stored nodes, edges, editing actions, and history in one place.
- Kept UI components lighter by moving workflow logic into the store.
- Used snapshots for undo and redo history.
- Reused the same snapshot shape for import and export.
- Kept Firestore read and write logic outside the Zustand store in a dedicated service layer.
- Normalized workflow snapshots before saving so temporary UI selection state does not trigger unnecessary autosave.

## Challenges encountered

- Managing drag and drop, editing, keyboard shortcuts, and history together.
- Keeping the canvas logic clean and maintainable.
- Preventing invalid workflow connections.
- Handling condition branches like `yes` and `no` correctly.
- Making validation strict without making the editor confusing.

## Keyboard shortcuts

- `V` switches to cursor mode.
- `H` switches to drag mode.
- `0` resets zoom to 100%.
- `M` opens or closes the selection actions menu.
- `L` locks or unlocks the current selection.
- `]` brings the current selection forward.
- `[` sends the current selection backward.
- `Ctrl + G` groups the current selection.
- `Ctrl + Shift + G` ungroups the current selection.

## Future improvements

- Add API integration for external services.
- Add workflow-level validation before export.
- Support richer node configuration.
- Improve edge editing and controls.
- Add automated test coverage.

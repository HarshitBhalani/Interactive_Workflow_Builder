# Interactive Workflow Builder

Interactive Workflow Builder is a React-based visual editor for creating simple workflow graphs with node and edge interactions. The project is being built step by step, with each phase adding one clear piece of functionality instead of trying to do everything at once.

The current version supports a real React Flow canvas, node creation from the sidebar, drag-and-drop node placement, node editing through a popup, live edge creation, connection rules, and JSON export/import.

## Current Features

- visual workflow canvas built with React Flow
- node types: `Start`, `Action`, `Condition`, `End`
- click-to-add node creation from the sidebar
- drag-and-drop node creation from the sidebar into the canvas
- draggable nodes
- node selection and delete support
- edge creation between nodes
- basic workflow connection validation
- condition branching with `Yes` and `No` handles
- node editing through a popup modal
- workflow export/import in JSON format
- centralized workflow graph state using Zustand

## Workflow Shape

The workflow is maintained in a structured format:

```json
{
  "nodes": [],
  "edges": []
}
```

This keeps the editor aligned with the assignment requirement and makes save/load easier to support.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Flow
- Zustand
- shadcn-style UI components

## Project Structure

The app follows a `src`-based structure and keeps workflow-related logic inside the Home module.

Key areas:

- `src/app/modules/Home/components`
  - workflow shell
  - workflow canvas
  - custom workflow node
- `src/app/modules/Home/stores`
  - Zustand workflow store
- `src/app/modules/Home/utils`
  - node factory
  - validation helpers
  - persistence helpers
- `src/app/modules/Home/configs`
  - preview graph data

## Progress So Far

### Phase 1

- built the base workflow editor layout
- added header, sidebar, and canvas area
- cleaned the UI text and simplified the screen structure

### Phase 2

- replaced the fake canvas with a real React Flow workspace
- added static nodes and edges
- added a condition node with `Yes` and `No` branch outputs

### Phase 3

- enabled dragging for nodes
- enabled node selection
- added delete support for selected nodes
- removed connected edges when deleting a node

### Phase 4

- enabled interactive edge creation
- added live connections from node handles
- kept branch labels and edge styling consistent

### Phase 5

- added workflow connection rules
- blocked invalid connections such as:
  - self-connections
  - outgoing edges from `End`
  - incoming edges into `Start`
  - duplicate branch usage

### Phase 6

- added sidebar-based node creation
- added node factory logic for ids, default labels, and positions

### Phase 7

- added node editing through an in-context popup flow
- removed the fixed side detail panel
- allowed editing of node title and subtitle

### Phase 8

- added workflow export to JSON
- added workflow import from JSON
- added validation for imported workflow structure

### Phase 9

- moved graph state and graph actions into a Zustand store
- kept UI-specific modal state local in the shell component

### Additional Improvement

- enabled drag-and-drop from sidebar node types into the canvas

## Zustand Usage

Zustand is used as the central workflow state manager for:

- `nodes`
- `edges`
- node creation
- edge creation
- delete cleanup
- node detail updates
- workflow snapshot loading

UI-only state such as modal visibility and temporary form values is still kept local in the shell component.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in the browser.

## Validation

The project has been regularly verified with:

```bash
npm run lint
npm run build
```

## Remaining Work

The main remaining bonus features are:

- undo / redo
- mini-map or overview panel
- keyboard shortcuts for common actions
- final UI and code cleanup

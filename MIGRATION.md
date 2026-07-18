# React → Svelte Migration Roadmap

## Ground rules

- **Store:** `sceneStore.ts` becomes a Svelte 5 runes module (`.svelte.ts`), exporting `$state` variables and plain action functions. No zustand, no `writable`.
- **Hooks:** React hooks are not migrated 1:1. Each hook is assessed: if it only manipulates store state it dissolves into its consumer; if it holds instance-scoped lifecycle it becomes a plain function in `src/lib/`; only `useSceneTree` retains a `.svelte.ts` file because it owns a headless-tree instance with a `$effect`-managed rebuild cycle.
- **Threlte:** All R3F/drei usage is replaced with `@threlte/core` + `@threlte/extras`. `useFrame` → `useTask`. `useThree` → `useThrelte`.
- **UI primitives:** `@base-ui/react` is replaced by `shadcn-svelte` (which itself wraps `bits-ui`). Use shadcn-svelte components where they exist; drop to raw `bits-ui` primitives only for anything shadcn-svelte doesn't cover.
- **Tree:** No `@headless-tree/svelte` exists. `tree.tsx` is rewritten against `@headless-tree/core` directly (the framework-agnostic core is already installed).
- **Panel:** `Panel.tsx` uses `Object.assign` compound components which don't exist in Svelte. It is split into individual `.svelte` files. Its consumers (`DefaultPanel`, `ImagePlanePanel`) are migrated in the same step.
- **Cleanup:** Each `.tsx` file is deleted in the same step as its `.svelte` replacement is written. No batch cleanup at the end.
- **Order:** UI track first, then 3D track, then entry point wiring.

---

## Files that need no migration

These are already framework-agnostic and contain no React or R3F imports:

- `src/lib/scene.ts` — pure Three.js utilities
- `src/lib/utils.ts` — `cn()` helper
- `src/lib/gizmoInteracting.ts` — plain mutable object
- `src/electron.d.ts` — type declaration only

`src/lib/eventBus.ts` is **deleted** in Phase 5 — it is no longer needed (see Phase 5 notes).

---

## Phase 1 — Store

**Why first:** Every component and hook reads from the store. Nothing else can be written in Svelte until the store is defined.

- [x] `src/store/sceneStore.ts` → `src/store/sceneStore.svelte.ts`
  - Replace `create<SceneStore>(...)` with top-level `$state` declarations
  - Actions (`addModel`, `removeModel`, `selectNode`, etc.) become exported plain functions
  - `objectRefs` closure becomes a module-level plain object (non-reactive, same as now)
  - Add `importedModels` and `importedImages` as `$state` arrays (absorbed from `useImportedFiles` — see Phase 4)
  - Delete `sceneStore.ts`

---

## Phase 2 — UI Primitives

**Why here:** These are leaf nodes with no internal migration dependencies. Every panel and toolbar component needs them. Unblocking them early opens the entire UI track.

- [x] `src/components/ui/button.tsx` → `Button.svelte`
  - Replace `@base-ui/react/button` with the shadcn-svelte `Button` component
  - Keep `buttonVariants` CVA definition unchanged
  - Delete `button.tsx`

- [x] `src/components/ui/tooltip.tsx` → `tooltip.ts` + `TooltipContent.svelte`
  - `TooltipProvider`, `Tooltip` (= `Tooltip.Root`), `TooltipTrigger` re-exported from `bits-ui` via `tooltip.ts` barrel
  - `TooltipContent` is a styled wrapper in `TooltipContent.svelte` that includes the `Tooltip.Arrow`
  - Animation classes adapted from base-ui `data-[state=delayed-open]` → bits-ui `data-[state=open]`
  - Delete `tooltip.tsx`

- [x] `src/components/ui/scrub-number-field.tsx` → `ScrubNumberField.svelte`
  - Replace `@base-ui/react/number-field` with the `NumberField` component found in the ui components inside the components directory.
  - `onCommit` mapped to `onValueCommitted` (handles both scrub-end and blur in one callback)
  - Props interface is unchanged
  - Delete `scrub-number-field.tsx`

---

## Phase 3 — Tree Primitive

**Why here:** `SceneGraph` depends on it. The current implementation uses `@base-ui/react/use-render` and `@base-ui/react/merge-props` — both React-specific APIs that must be rewritten. This is the most architecturally novel UI migration step.

- [x] `src/components/reui/tree.tsx` → `Tree.svelte` (+ `TreeItem.svelte`, `TreeItemLabel.svelte`, `TreeDragLine.svelte`)
  - Drop `@base-ui/react/use-render` and `@base-ui/react/merge-props`; replace with plain Svelte props and slots/snippets
  - Keep `@headless-tree/core` usage: `ItemInstance`, `getContainerProps`, `getProps`, `getDragLineStyle`, `getItemMeta`
  - Tree context becomes a Svelte context (`setContext`/`getContext`)
  - `lucide-react` icon imports → `lucide-svelte`
  - Delete `tree.tsx`

---

## Phase 4 — Simple Utilities

**Why here:** These two hooks have no dependencies on other migrated files. `useDragGuard` is needed by `SelectionManager` (3D track); `useImportedFiles` is needed by `App`. Both can be resolved now.

- [x] `src/hooks/useDragGuard.ts` → **`src/lib/dragGuard.ts`** (plain factory function)
  - `useRef` + `useCallback` were React ceremony for a plain mutable closure — replace with:
    ```ts
    export function createDragGuard(thresholdPx = 5) {
      let anchor = { x: 0, y: 0 };
      return {
        onPointerDown: (e) => {
          anchor = { x: e.clientX, y: e.clientY };
        },
        wasDrag: (e) =>
          Math.hypot(e.clientX - anchor.x, e.clientY - anchor.y) > thresholdPx,
      };
    }
    ```
  - No runes, no `.svelte.ts` — pure TypeScript
  - Delete `useDragGuard.ts`

- [x] `src/hooks/useImportedFiles.ts` → **dissolved**: state into store, subscription into `App.svelte`
  - `importedModels` and `importedImages` move to `sceneStore.svelte.ts` as `$state` arrays (see Phase 1)
  - The `window.electronAPI.onImportFiles` subscription becomes a `$effect` with cleanup directly in `App.svelte`
  - Delete `useImportedFiles.ts`

---

## Phase 5 — Panel Group

**Why grouped:** `Panel.tsx` and its two consumers (`DefaultPanel`, `ImagePlanePanel`) are tightly coupled. Migrating Panel without its consumers leaves dead JSX imports. The panel hooks only serve panel components and belong in this step.

- [x] `src/hooks/useNodeTransform.ts` → **dissolved**: `centerPivot` into `src/lib/nodeTransform.ts`; everything else into the panels directly
  - The live/commit split is dropped entirely (was a React performance escape hatch — not needed in Svelte)
  - Drop the `eventBus.on("transform")` listener
  - `pos`/`rot`/`scale` are read directly from the store node; rotation degree conversion is a one-line `$derived` in each panel
  - `setPos/setRot/setScale` are one-liner calls to `updateNode` written inline in each panel
  - `centerPivot(uuid)` — the only non-trivial piece — becomes an exported function in `src/lib/nodeTransform.ts`
  - Delete `useNodeTransform.ts`

- [x] `src/hooks/useImagePlaneMode.ts` → **dissolved into `ImagePlanePanel.svelte`**
  - Single consumer; after dropping the event bus the entire hook is store reads + `updateNode` calls
  - Drop all `eventBus.emit/on("imagePlane")` — `ImagePlanePanel.svelte` calls `updateNode` directly on every change
  - `toggleBillboard` and `toggleSizeAttenuation` inline as one-liners
  - `cameraRot` display conversion is a `$derived` in the panel
  - Delete `useImagePlaneMode.ts`
  - Delete `src/lib/eventBus.ts` in this step (last consumer removed)

- [x] `src/components/panels/Panel.tsx` → split into individual `.svelte` files
  - `PanelRoot` → `Panel.svelte`
  - `PanelHeader` → `PanelHeader.svelte`
  - `PanelTitle` → `PanelTitle.svelte`
  - `PanelDescription` → `PanelDescription.svelte`
  - `PanelBody` → `PanelBody.svelte`
  - `PanelVec3Root/Label/Field` → `PanelVec3.svelte` (with `label`, `fields` snippets or props)
  - `PanelRow` → `PanelRow.svelte`
  - Delete `Panel.tsx`

- [x] `src/components/panels/DefaultPanel.tsx` → `DefaultPanel.svelte`
  - Replace `Panel.*` compound imports with individual `.svelte` component imports
  - Import `selectedUuid`, `nodes`, `updateNode` from store directly; import `centerPivot` from `src/lib/nodeTransform.ts`
  - `$derived` for degree-converted rotation display
  - Delete `DefaultPanel.tsx`

- [x] `src/components/panels/ImagePlanePanel.tsx` → `ImagePlanePanel.svelte`
  - Replace `Panel.*` compound imports with individual `.svelte` component imports
  - Import `selectedUuid`, `nodes`, `updateNode` from store directly; import `centerPivot` from `src/lib/nodeTransform.ts`
  - All `useNodeTransform` and `useImagePlaneMode` logic is inline — no hook imports
  - Delete `ImagePlanePanel.tsx`

- [x] `src/components/panels/PanelRouter.tsx` → `PanelRouter.svelte`
  - Type-based routing: read `node.type` from store, conditionally render panel
  - No R3F deps; pure reactive logic
  - Delete `PanelRouter.tsx`

---

## Phase 6 — Toolbar

**Why here:** Depends only on `Button`, `Tooltip` (Phase 2) and the store (Phase 1). No 3D dependencies. Straightforward migration.

- [x] `src/components/Toolbar.tsx` → `Toolbar.svelte`
  - `lucide-react` icon imports → `lucide-svelte`
  - Store reads via rune module
  - Uses `Button` and `Tooltip` from Phase 2
  - Delete `Toolbar.tsx`

---

## Phase 7 — Scene Graph & Tree Hook

**Why here:** `SceneGraph` depends on the Tree primitive (Phase 3) and `useSceneTree`. `useAutoReveal` is only used by `useSceneTree` — they migrate together.

- [ ] `src/hooks/useAutoReveal.ts` → **dissolved into `useSceneTree.svelte.ts`** as a local helper function
  - No state, no lifecycle of its own — it is pure side-effect logic called inside a `$effect`
  - The parent-map walk and `expand()` calls become a plain function defined in the same file
  - Delete `useAutoReveal.ts`

- [ ] `src/hooks/useSceneTree.ts` → **`src/hooks/useSceneTree.svelte.ts`** (only hook file that survives)
  - Replace `useTree` from `@headless-tree/react` with `createTree` from `@headless-tree/core`
  - `useLayoutEffect` → `$effect` for `tree.rebuildTree()` when `nodes`/`sceneRootChildren` change
  - `treeDataRef` becomes a plain variable (not reactive — updated synchronously before each rebuild)
  - Auto-reveal and scroll logic from `useAutoReveal` folds into the same `$effect` or a sibling `$effect`
  - Store reads via rune module
  - Returns same interface: `{ tree, treeDataRef, sceneRootChildren, selectedUuid, selectNode }`

- [ ] `src/components/SceneGraph.tsx` → `SceneGraph.svelte`
  - Uses `Tree`, `TreeItem`, `TreeItemLabel`, `TreeDragLine` from Phase 3
  - Uses `useSceneTree` from above
  - `lucide-react` icon imports → `lucide-svelte`
  - Delete `SceneGraph.tsx`

---

## Phase 8 — Scene Components

**Why last in 3D track:** All scene components must live inside a Threlte `<Canvas>`, so they require Threlte context. They depend on `createDragGuard` (Phase 4) and the store (Phase 1). The Threlte hook files (`useBillboard`, `useSizeAttenuation`, `useBoxHelper`, `usePivotSprite`) are not migrated as separate files — their logic is inlined directly into the single component that consumes each one.

- [ ] `src/components/scene/SceneRegistrar.tsx` → `SceneRegistrar.svelte`
  - `useThree((s) => s.scene)` → `useThrelte().scene` from `@threlte/core`
  - `useEffect` → `$effect`
  - Delete `SceneRegistrar.tsx`

- [ ] `src/components/scene/SelectionManager.tsx` → `SelectionManager.svelte`
  - `useThree()` → `useThrelte()` from `@threlte/core`
  - `useDragGuard(5)` → `createDragGuard(5)` from `src/lib/dragGuard.ts`
  - `useBoxHelper`: inline as `$state` + `$effect` (create/configure/cleanup `BoxHelper`) + `useTask` (call `.update()` each frame); delete `useBoxHelper.ts`
  - `usePivotSprite`: inline as `$state` + `$effect` (load texture, create `Sprite`, dispose on cleanup) + `useTask` (sync world position); delete `usePivotSprite.ts`
  - `<primitive object={...} />` → `<T is={...} />` from `@threlte/core`
  - Delete `SelectionManager.tsx`

- [ ] `src/components/scene/TransformGizmo.tsx` → `TransformGizmo.svelte`
  - `<TransformControls>` from drei → `<TransformControls>` from `@threlte/extras`
  - `useThree()` → `useThrelte()`
  - Event callbacks (`onMouseDown`, `onMouseUp`, `onChange`) → Threlte event binding
  - Delete `TransformGizmo.tsx`

- [ ] `src/components/scene/ModelInstance.tsx` → `ModelInstance.svelte`
  - `useGLTF` from drei → `useGltf` from `@threlte/extras`
  - `useEffect` → `$effect`
  - `<primitive object={scene} />` → `<T is={scene} />` from `@threlte/core`
  - Delete `ModelInstance.tsx`

- [ ] `src/components/scene/ImageInstance.tsx` → `ImageInstance.svelte`
  - `useTexture` from drei → `useTexture` from `@threlte/extras`
  - `useMemo` → plain variable (textures are stable per `url` prop)
  - `useBillboard`: inline as a `useTask` block — read `nodes[uuid]` from store directly each frame, update `mesh.quaternion` against `camera.quaternion`; delete `useBillboard.ts`
  - `useSizeAttenuation`: inline as a `useTask` block — read `nodes[uuid]` from store directly each frame, compute screen-space scale factor; delete `useSizeAttenuation.ts`
  - `<primitive object={mesh} />` → `<T is={mesh} />`
  - Delete `ImageInstance.tsx`

- [ ] `src/components/scene/InfiniteGrid.tsx` → **replaced by `<Grid>` from `@threlte/extras`**
  - Drop the custom TSL/WebGPU implementation entirely; use `<Grid>` from `@threlte/extras` instead
  - Delete `InfiniteGrid.tsx`

---

## Phase 10 — Entry Point

**Why last:** `App.svelte` is the assembly point for everything. `main.ts` and `index.html` can only be switched once `App.svelte` is complete.

- [ ] `src/App.svelte` (already exists as empty stub — fill it in)
  - Replace `<Canvas>` from R3F with `<Canvas>` from `@threlte/core`
  - Replace `<CameraControls>` + `<Environment>` from drei with `@threlte/extras` equivalents
  - Add `$effect` with cleanup for `window.electronAPI.onImportFiles` — pushes to `importedModels`/`importedImages` in the store (replaces the dissolved `useImportedFiles` hook)
  - Compose all migrated scene and UI components
  - `<TooltipProvider>` wrapper — use bits-ui equivalent if needed
  - Delete `App.tsx`

- [ ] `src/main.tsx` → `src/main.ts`
  - Replace `createRoot(...).render(...)` with Svelte's `mount(App, { target: ... })`
  - Delete `main.tsx`

- [ ] `index.html`
  - Update `<script src="/src/main.tsx">` → `<script src="/src/main.ts">`

- [ ] Delete `src/assets/react.svg` (unused React logo asset)

# React → Svelte Migration Roadmap

## Ground rules

- **Store:** `sceneStore.ts` becomes a Svelte 5 runes module (`.svelte.ts`), exporting `$state` variables and plain action functions. No zustand, no `writable`.
- **Hooks:** All React hooks become Svelte 5 rune functions in `.svelte.ts` files. Abstraction is kept — hooks are not inlined into components.
- **Threlte:** All R3F/drei usage is replaced with `@threlte/core` + `@threlte/extras`. `useFrame` → `useTask`. `useThree` → `useThrelte`.
- **UI primitives:** `@base-ui/react` is replaced by `bits-ui`. Component APIs are similar in shape.
- **Tree:** No `@headless-tree/svelte` exists. `tree.tsx` is rewritten against `@headless-tree/core` directly (the framework-agnostic core is already installed).
- **Panel:** `Panel.tsx` uses `Object.assign` compound components which don't exist in Svelte. It is split into individual `.svelte` files. Its consumers (`DefaultPanel`, `ImagePlanePanel`) are migrated in the same step.
- **Cleanup:** Each `.tsx` file is deleted in the same step as its `.svelte` replacement is written. No batch cleanup at the end.
- **Order:** UI track first, then 3D track, then entry point wiring.

---

## Files that need no migration

These are already framework-agnostic and contain no React or R3F imports:

- `src/lib/scene.ts` — pure Three.js utilities
- `src/lib/eventBus.ts` — mitt event bus
- `src/lib/utils.ts` — `cn()` helper
- `src/lib/gizmoInteracting.ts` — plain mutable object
- `src/electron.d.ts` — type declaration only

---

## Phase 1 — Store

**Why first:** Every component and hook reads from the store. Nothing else can be written in Svelte until the store is defined.

- [ ] `src/store/sceneStore.ts` → `src/store/sceneStore.svelte.ts`
  - Replace `create<SceneStore>(...)` with top-level `$state` declarations
  - Actions (`addModel`, `removeModel`, `selectNode`, etc.) become exported plain functions
  - `objectRefs` closure becomes a module-level plain object (non-reactive, same as now)
  - Delete `sceneStore.ts`

---

## Phase 2 — UI Primitives

**Why here:** These are leaf nodes with no internal migration dependencies. Every panel and toolbar component needs them. Unblocking them early opens the entire UI track.

- [ ] `src/components/ui/button.tsx` → `Button.svelte`
  - Replace `@base-ui/react/button` with `bits-ui` `Button` primitive
  - Keep `buttonVariants` CVA definition unchanged
  - Delete `button.tsx`

- [ ] `src/components/ui/tooltip.tsx` → `Tooltip.svelte`
  - Replace `@base-ui/react/tooltip` with `bits-ui` `Tooltip` primitive
  - `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent` remain as named exports
  - Delete `tooltip.tsx`

- [ ] `src/components/ui/scrub-number-field.tsx` → `ScrubNumberField.svelte`
  - Replace `@base-ui/react/number-field` with `bits-ui` `NumberField` primitive
  - Props interface is unchanged
  - Delete `scrub-number-field.tsx`

---

## Phase 3 — Tree Primitive

**Why here:** `SceneGraph` depends on it. The current implementation uses `@base-ui/react/use-render` and `@base-ui/react/merge-props` — both React-specific APIs that must be rewritten. This is the most architecturally novel UI migration step.

- [ ] `src/components/reui/tree.tsx` → `Tree.svelte` (+ `TreeItem.svelte`, `TreeItemLabel.svelte`, `TreeDragLine.svelte`)
  - Drop `@base-ui/react/use-render` and `@base-ui/react/merge-props`; replace with plain Svelte props and slots/snippets
  - Keep `@headless-tree/core` usage: `ItemInstance`, `getContainerProps`, `getProps`, `getDragLineStyle`, `getItemMeta`
  - Tree context becomes a Svelte context (`setContext`/`getContext`)
  - `lucide-react` icon imports → `lucide-svelte`
  - Delete `tree.tsx`

---

## Phase 4 — Simple Hooks

**Why here:** These two hooks have no dependencies on other migrated files. `useDragGuard` is needed by `SelectionManager` (3D track); `useImportedFiles` is needed by `App`. Both can be written now.

- [ ] `src/hooks/useDragGuard.ts` → `useDragGuard.svelte.ts`
  - `useRef` + `useCallback` → plain `$state` and closures
  - Returns `{ onPointerDown, wasDrag }` — interface unchanged

- [ ] `src/hooks/useImportedFiles.ts` → `useImportedFiles.svelte.ts`
  - `useState` + `useEffect` → `$state` + `$effect`
  - `window.electronAPI.onImportFiles` call is unchanged
  - Returns `{ models, images }` — interface unchanged

---

## Phase 5 — Panel Group

**Why grouped:** `Panel.tsx` and its two consumers (`DefaultPanel`, `ImagePlanePanel`) are tightly coupled. Migrating Panel without its consumers leaves dead JSX imports. The panel hooks only serve panel components and belong in this step.

- [ ] `src/hooks/useNodeTransform.ts` → `useNodeTransform.svelte.ts`
  - `useState` + `useEffect` + `useRef` → `$state` + `$effect`
  - Store reads via imported rune module (Phase 1) instead of `useSceneStore(...)`
  - Returns same interface: `{ pos, rot, scale, handlePos, handleRot, handleScale, commitPos, commitRot, commitScale, handleCenterPivot }`

- [ ] `src/hooks/useImagePlaneMode.ts` → `useImagePlaneMode.svelte.ts`
  - Same pattern: `$state` + `$effect`, store reads via rune module
  - `eventBus` usage unchanged (mitt is framework-agnostic)
  - Returns same interface

- [ ] `src/components/panels/Panel.tsx` → split into individual `.svelte` files
  - `PanelRoot` → `Panel.svelte`
  - `PanelHeader` → `PanelHeader.svelte`
  - `PanelTitle` → `PanelTitle.svelte`
  - `PanelDescription` → `PanelDescription.svelte`
  - `PanelBody` → `PanelBody.svelte`
  - `PanelVec3Root/Label/Field` → `PanelVec3.svelte` (with `label`, `fields` snippets or props)
  - `PanelRow` → `PanelRow.svelte`
  - Delete `Panel.tsx`

- [ ] `src/components/panels/DefaultPanel.tsx` → `DefaultPanel.svelte`
  - Replace `Panel.*` compound imports with individual `.svelte` component imports
  - Uses `useNodeTransform` and `Button`
  - Delete `DefaultPanel.tsx`

- [ ] `src/components/panels/ImagePlanePanel.tsx` → `ImagePlanePanel.svelte`
  - Replace `Panel.*` compound imports with individual `.svelte` component imports
  - Uses `useNodeTransform`, `useImagePlaneMode`, `Button`
  - Delete `ImagePlanePanel.tsx`

- [ ] `src/components/panels/PanelRouter.tsx` → `PanelRouter.svelte`
  - Type-based routing: read `node.type` from store, conditionally render panel
  - No R3F deps; pure reactive logic
  - Delete `PanelRouter.tsx`

---

## Phase 6 — Toolbar

**Why here:** Depends only on `Button`, `Tooltip` (Phase 2) and the store (Phase 1). No 3D dependencies. Straightforward migration.

- [ ] `src/components/Toolbar.tsx` → `Toolbar.svelte`
  - `lucide-react` icon imports → `lucide-svelte`
  - Store reads via rune module
  - Uses `Button` and `Tooltip` from Phase 2
  - Delete `Toolbar.tsx`

---

## Phase 7 — Scene Graph & Tree Hook

**Why here:** `SceneGraph` depends on the Tree primitive (Phase 3) and `useSceneTree`. `useAutoReveal` is only used by `useSceneTree` — they migrate together.

- [ ] `src/hooks/useAutoReveal.ts` → `useAutoReveal.svelte.ts`
  - `useEffect` → `$effect`
  - Calls `tree.getItemInstance(id).expand()` — `@headless-tree/core` API is unchanged

- [ ] `src/hooks/useSceneTree.ts` → `useSceneTree.svelte.ts`
  - Replace `useTree` from `@headless-tree/react` with direct `@headless-tree/core` tree construction
  - `useLayoutEffect` → `$effect`
  - `useRef` → plain variable or `$state`
  - Store reads via rune module
  - Returns same interface: `{ tree, treeDataRef, modelRoots, selectedUuid, selectNode }`

- [ ] `src/components/SceneGraph.tsx` → `SceneGraph.svelte`
  - Uses `Tree`, `TreeItem`, `TreeItemLabel`, `TreeDragLine` from Phase 3
  - Uses `useSceneTree` from above
  - `lucide-react` icon imports → `lucide-svelte`
  - Delete `SceneGraph.tsx`

---

## Phase 8 — Threlte Hooks

**Why here:** These hooks depend on Threlte's task system (`useTask`) and must be inside a Threlte `<Canvas>` context. They are consumed exclusively by scene components (Phase 9) so they block that phase.

- [ ] `src/hooks/useBillboard.ts` → `useBillboard.svelte.ts`
  - `useFrame` → `useTask` from `@threlte/core`
  - `useEffect` + `useRef` → `$effect` + plain variable
  - `useSceneStore.getState()` → direct import from rune module

- [ ] `src/hooks/useSizeAttenuation.ts` → `useSizeAttenuation.svelte.ts`
  - Same pattern as `useBillboard`

- [ ] `src/hooks/useBoxHelper.ts` → `useBoxHelper.svelte.ts`
  - `useState` + `useEffect` + `useFrame` → `$state` + `$effect` + `useTask`
  - Returns `BoxHelper | null` — interface unchanged

- [ ] `src/hooks/usePivotSprite.ts` → `usePivotSprite.svelte.ts`
  - `useState` + `useEffect` + `useFrame` → `$state` + `$effect` + `useTask`
  - Returns `Sprite | null` — interface unchanged

---

## Phase 9 — Scene Components

**Why last in 3D track:** All scene components must live inside a Threlte `<Canvas>`, so they require Threlte context. They depend on Threlte hooks (Phase 8) and `useDragGuard` (Phase 4).

- [ ] `src/components/scene/SceneRegistrar.tsx` → `SceneRegistrar.svelte`
  - `useThree((s) => s.scene)` → `useThrelte().scene` from `@threlte/core`
  - `useEffect` → `$effect`
  - Delete `SceneRegistrar.tsx`

- [ ] `src/components/scene/SelectionManager.tsx` → `SelectionManager.svelte`
  - `useThree()` → `useThrelte()` from `@threlte/core`
  - Uses `useDragGuard` (Phase 4), `useBoxHelper`, `usePivotSprite` (Phase 8)
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
  - Uses `useBillboard`, `useSizeAttenuation` (Phase 8)
  - `<primitive object={mesh} />` → `<T is={mesh} />`
  - Delete `ImageInstance.tsx`

- [ ] `src/components/scene/InfiniteGrid.tsx` → `InfiniteGrid.svelte`
  - `useFrame` → `useTask` from `@threlte/core`
  - `useMemo` → `$derived` for material construction
  - `<mesh ref={...}>` → `<T.Mesh bind:ref={...}>` from `@threlte/core`
  - Three.js TSL/WebGPU material logic is unchanged
  - Delete `InfiniteGrid.tsx`

---

## Phase 10 — Entry Point

**Why last:** `App.svelte` is the assembly point for everything. `main.ts` and `index.html` can only be switched once `App.svelte` is complete.

- [ ] `src/App.svelte` (already exists as empty stub — fill it in)
  - Replace `<Canvas>` from R3F with `<Canvas>` from `@threlte/core`
  - Replace `<CameraControls>` + `<Environment>` from drei with `@threlte/extras` equivalents
  - Replace `useImportedFiles()` call (Phase 4)
  - Compose all migrated scene and UI components
  - `<TooltipProvider>` wrapper — use bits-ui equivalent if needed
  - Delete `App.tsx`

- [ ] `src/main.tsx` → `src/main.ts`
  - Replace `createRoot(...).render(...)` with Svelte's `mount(App, { target: ... })`
  - Delete `main.tsx`

- [ ] `index.html`
  - Update `<script src="/src/main.tsx">` → `<script src="/src/main.ts">`

- [ ] Delete `src/assets/react.svg` (unused React logo asset)

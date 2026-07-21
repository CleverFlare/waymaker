At its core, Headless Tree is built around one idea: **it manages tree _state_ and _behavior_, and hands you plain data + DOM props to render however you want.** It never touches the DOM itself. Here's how the pieces fit together.

**1. The data loader is the bridge to your data**
You almost certainly already have your tree data as some object/array/map. Headless Tree doesn't ask you to reshape it — instead you give it a `dataLoader` with two functions:

- `getItem(id)` → return the raw item at that ID
- `getChildren(id)` → return the array of child IDs for that item

That's it. The library walks your existing data structure through these two functions rather than requiring a specific tree format.

**2. The tree instance is the "brain"**
Calling `createTree(config)` (or `useTree` in React) builds a `TreeInstance`. This object holds all internal state — which items are expanded, selected, focused, being dragged, etc. — and exposes methods to query and mutate it. The single most important method is `tree.getItems()`, which returns a **flat list** of every visible item in the tree, in the correct visual order, regardless of nesting. You just loop over this list and render — no manual recursion needed.

**3. Item instances wrap each row**
Each entry from `getItems()` is an `ItemInstance` — a little object bound to one item ID. It has methods like `.getItemName()`, `.isExpanded()`, `.isSelected()`, `.isFolder()`, `.getItemMeta().level` (its depth, for indentation), and importantly `.getProps()`.

**4. Props are how behavior reaches the DOM**
`tree.getContainerProps()` and `item.getProps()` return ordinary objects full of `onClick`, `onKeyDown`, `draggable`, `onDragStart`, ARIA attributes, etc. You spread these onto whatever elements you render. This is the "headless" part — the library computes _what should happen_ on a click/keypress/drag, but you decide what the row actually looks like (a `<div>`, a custom component, whatever).

**5. Features are opt-in plugins**
Almost everything beyond basic expand/collapse — selection, drag-and-drop, hotkeys, search, renaming, checkboxes — is a separate "feature" object you explicitly import and list in `features: [...]`. Only two features (Tree Core and Main) are always on. This keeps bundles small and makes the internals easy to reason about: each feature just adds more methods to the tree/item instances and more props to `getProps()`.

**6. State can be internal or controlled**
By default the tree manages its own state (expanded items, selection, etc.) internally. But every piece of state can be lifted into your own app state instead, by passing a `state` object plus setter functions (`setExpandedItems`, `setSelectedItems`, etc.) in the config — similar to controlled vs. uncontrolled components in React.

Put together, a minimal mental model is:

```
your data  →  dataLoader  →  createTree(config)  →  tree.getItems()  →  you render each ItemInstance,
                                                                          spreading item.getProps()
```

Everything else (drag-and-drop, hotkeys, search) is just more features layered onto that same loop, adding more state and more props — never taking over rendering from you.

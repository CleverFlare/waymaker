import { createTree } from '@headless-tree/core';
import type { TreeConfig, TreeState, ItemInstance } from '@headless-tree/core';
import { untrack } from 'svelte';

export function useTree<T>(config: TreeConfig<T>) {
	const { state: _s, initialState, setState: _ss, ...restConfig } = config;
	const userSetState = config.setState;

	// Capture any sub-state handlers the caller may have passed so we can compose them.
	const userSetExpandedItems = config.setExpandedItems;
	const userSetFocusedItem = config.setFocusedItem;
	const userSetSelectedItems = (config as any).setSelectedItems;
	const userSetDndState = (config as any).setDndState;
	const userSetSearch = (config as any).setSearch;

	// Seed with whatever the caller provided up front — this becomes
	// the one and only state object for the lifetime of the tree.
	const treeState = $state<TreeState<T>>(
		(config.state ?? config.initialState ?? {}) as TreeState<T>
	);

	const tree = createTree<T>({
		...restConfig,
		state: treeState,
		setState: (updater) => {
			const next = typeof updater === 'function' ? updater(treeState) : updater;
			Object.assign(treeState, {
				...next,
				expandedItems: [...(untrack(() => treeState.expandedItems) ?? [])]
			});
			// Force a new array reference on every flush so structural rebuilds
			// (which don't change expandedItems values) still trigger reactive getters.
			// treeState.expandedItems = [...(treeState.expandedItems ?? [])];
			userSetState?.(treeState);
		},
		// Sub-state handlers keep treeState in sync for changes that bypass setState.
		// applySubStateUpdate calls these directly without going through the full setState.
		setExpandedItems: (v) => {
			treeState.expandedItems = [...v];
			userSetExpandedItems?.(v);
		},
		setFocusedItem: (v) => {
			treeState.focusedItem = v;
			userSetFocusedItem?.(v);
		},
		setSelectedItems: (v: string[]) => {
			(treeState as any).selectedItems = v;
			userSetSelectedItems?.(v);
		},
		setDndState: (v: any) => {
			(treeState as any).dnd = v;
			userSetDndState?.(v);
		},
		setSearch: (v: string | null) => {
			(treeState as any).search = v;
			userSetSearch?.(v);
		}
	});

	$effect.pre(() => {
		tree.setMounted(true);
		return () => tree.setMounted(false);
	});

	// Wraps an item instance so its state-derived methods read treeState first,
	// creating a Svelte tracking dependency before delegating to the real method.
	const wrapItem = (item: ItemInstance<T>) =>
		({
			...item,
			isExpanded: () => (void treeState.expandedItems, item.isExpanded()),
			isFolder: () => (void treeState.expandedItems, item.isFolder()),
			getChildren: () => (void treeState.expandedItems, item.getChildren()),
			getItemAbove: () => (void treeState.expandedItems, item.getItemAbove()),
			getItemBelow: () => (void treeState.expandedItems, item.getItemBelow()),
			isFocused: () => (void treeState.focusedItem, item.isFocused()),
			isSelected: () => (void (treeState as any).selectedItems, item.isSelected?.()),
			isDragTarget: () => (void (treeState as any).dnd, item.isDragTarget?.()),
			isUnorderedDragTarget: () => (void (treeState as any).dnd, item.isUnorderedDragTarget?.()),
			isDragTargetAbove: () => (void (treeState as any).dnd, item.isDragTargetAbove?.()),
			isDragTargetBelow: () => (void (treeState as any).dnd, item.isDragTargetBelow?.()),
			isDraggingOver: () => (void (treeState as any).dnd, item.isDraggingOver?.()),
			isMatchingSearch: () => (void (treeState as any).search, item.isMatchingSearch?.()),
			isLoading: () => (void (treeState as any).loadingItemChildrens, item.isLoading?.()),
			getProps: () => {
				void treeState.expandedItems;
				void treeState.focusedItem;
				void (treeState as any).selectedItems;
				void (treeState as any).dnd;
				return item.getProps();
			}
		}) as typeof item;

	// Reactive wrapper: state-derived getters read a treeState property to create a
	// Svelte tracking dependency, then delegate to the real tree for the value.
	// Commands and stable getters pass through via the spread.
	const reactiveTree = {
		...tree,
		getItems: () => (void treeState.expandedItems, tree.getItems().map(wrapItem)),
		getItemsMeta: () => (void treeState.expandedItems, tree.getItemsMeta()),
		getDragLineData: () => (void (treeState as any).dnd, tree.getDragLineData?.()),
		getDragLineStyle: (topOffset?: number, leftOffset?: number) => (
			void (treeState as any).dnd,
			tree.getDragLineStyle(topOffset, leftOffset)
		),
		getDragTarget: () => (void (treeState as any).dnd, tree.getDragTarget?.()),
		getFocusedItem: () => (void treeState.focusedItem, tree.getFocusedItem()),
		getSelectedItems: () => (void (treeState as any).selectedItems, tree.getSelectedItems?.())
	} as typeof tree;

	return {
		tree: reactiveTree,
		get state() {
			return treeState;
		}
	};
}

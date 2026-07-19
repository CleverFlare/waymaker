import { createTree } from '@headless-tree/core';
import type { TreeConfig, TreeState } from '@headless-tree/core';

export function useTree<T>(config: TreeConfig<T>) {
	const userSetState = config.setState;

	let treeState = $state<Partial<TreeState<T>>>({} as TreeState<T>);

	const tree = createTree<T>({
		...config,
		setState: (updater) => {
			const next = typeof updater === 'function' ? updater(treeState) : (updater as TreeState<T>);
			treeState = next;
			userSetState?.(next);
		}
	});

	// Bootstrap with the tree's computed initial state
	treeState = tree.getState();

	$effect.pre(() => {
		tree.setMounted(true);
		return () => tree.setMounted(false);
	});

	const items = $derived.by(() => {
		treeState;
		return tree.getItems();
	});

	return {
		tree,
		get items() {
			return items;
		}
	};
}

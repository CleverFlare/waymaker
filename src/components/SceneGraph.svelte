<script lang="ts">
	import { FolderOpenIcon, FolderIcon, BoxIcon, FileIcon, ImageIcon } from 'lucide-svelte';
	import Tree from '@/components/tree/Tree.svelte';
	import TreeItem from '@/components/tree/TreeItem.svelte';
	import TreeItemLabel from '@/components/tree/TreeItemLabel.svelte';
	import TreeDragLine from '@/components/tree/TreeDragLine.svelte';
	import {
		syncDataLoaderFeature,
		hotkeysCoreFeature,
		dragAndDropFeature,
		createOnDropHandler
	} from '@headless-tree/core';
	import { useTree } from '@/hooks/useTree.svelte';
	import { sceneStore, selectNode, reparentNodes, getObject } from '@/store/sceneStore.svelte';
	import { SCENE_ROOT_ID } from '@/lib/scene';
	import { untrack } from 'svelte';

	const MESH_TYPES = new Set(['Mesh', 'SkinnedMesh']);
	const IMAGE_TYPES = new Set(['ImagePlane']);

	interface TreeItemData {
		name: string;
		type: string;
		children: string[];
	}

	let treeData: Record<string, TreeItemData> = $state({});

	const ht = useTree<TreeItemData>({
		rootItemId: SCENE_ROOT_ID,
		getItemName: (item) => item.getItemData().name,
		isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
		reorderAreaPercentage: 0.2,
		indent: 20,
		dataLoader: {
			getItem: (id) => treeData[id],
			getChildren: (id) => treeData[id]?.children ?? []
		},
		features: [syncDataLoaderFeature, hotkeysCoreFeature, dragAndDropFeature],
		initialState: {
			expandedItems: [SCENE_ROOT_ID],
			dnd: null
		},
		canDrop: () => true,
		onDrop: createOnDropHandler((item, newChildIds) => {
			const parentId = item.getId();
			const addedIds = newChildIds.filter(
				(id) => !(treeData[parentId]?.children ?? []).includes(id)
			);
			reparentNodes(parentId, newChildIds);
			const parentObject = getObject(parentId);
			if (parentObject) {
				addedIds.forEach((id) => {
					const childObject = getObject(id);
					if (childObject) parentObject.attach(childObject);
				});
			}
		})
	});

	$effect.pre(() => {
		treeData = {
			[SCENE_ROOT_ID]: {
				name: 'Scene',
				type: 'Scene',
				children: sceneStore.sceneRootChildren
			},
			...Object.fromEntries(
				Object.values(sceneStore.nodes).map((node) => [
					node.uuid,
					{ name: node.name, type: node.type, children: node.children }
				])
			)
		};
		// untrack prevents rebuildTree's internal dataLoader reads (treeData[id])
		// from creating a reactive dependency on treeData inside this effect,
		// which would cause a write→read cycle and effect_update_depth_exceeded.
		untrack(() => ht.tree.rebuildTree());
	});

	$effect(() => {
		const uuid = sceneStore.selectedUuid;
		if (!uuid) return;
		untrack(() => {
			const parentMap: Record<string, string> = {};
			for (const [id, data] of Object.entries(treeData)) {
				for (const childId of data.children) {
					parentMap[childId] = id;
				}
			}
			const ancestors: string[] = [];
			let current = parentMap[uuid];
			while (current && current !== SCENE_ROOT_ID) {
				ancestors.push(current);
				current = parentMap[current];
			}
			if (ancestors.length === 0) return;
			const existing = new Set(ht.state.expandedItems ?? []);
			const toAdd = ancestors.filter((id) => !existing.has(id));
			if (toAdd.length > 0) {
				for (const item of toAdd) {
					ht.tree.getItemInstance(item)?.expand();
				}
			}
			ht.tree.getItemInstance(uuid)?.scrollTo({ block: 'center', behavior: 'instant' });
		});
	});
</script>

{#if sceneStore.sceneRootChildren.length === 0}
	<p class="px-4 py-6 text-center text-xs text-muted-foreground">
		Import a GLB or GLTF to see the scene graph
	</p>
{:else}
	<Tree tree={ht.tree} state={ht.state} indent={16} toggleIconType="chevron" class="p-2">
		{#each ht.tree.getItems() as item (item.getId())}
			{@const data = treeData[item.getId()]}
			{@const isMesh = MESH_TYPES.has(data?.type ?? '')}
			{@const isImage = IMAGE_TYPES.has(data?.type ?? '')}
			<TreeItem {item} {...item.getDragHandleProps()}>
				<TreeItemLabel
					class={sceneStore.selectedUuid === item.getId()
						? '!bg-white/10 !text-accent-foreground'
						: ''}
					onclick={() => selectNode(item.getId())}
				>
					<span class="flex min-w-0 items-center gap-1.5">
						{#if item.isFolder()}
							{#if item.isExpanded()}
								<FolderOpenIcon
									class="pointer-events-none size-3.5 shrink-0 text-muted-foreground"
								/>
							{:else}
								<FolderIcon class="pointer-events-none size-3.5 shrink-0 text-muted-foreground" />
							{/if}
						{:else if isImage}
							<ImageIcon class="pointer-events-none size-3.5 shrink-0 text-muted-foreground" />
						{:else if isMesh}
							<BoxIcon class="pointer-events-none size-3.5 shrink-0 text-muted-foreground" />
						{:else}
							<FileIcon class="pointer-events-none size-3.5 shrink-0 text-muted-foreground" />
						{/if}
						<span class="truncate">{item.getItemName()}</span>
					</span>
				</TreeItemLabel>
			</TreeItem>
		{/each}
		<TreeDragLine />
	</Tree>
{/if}

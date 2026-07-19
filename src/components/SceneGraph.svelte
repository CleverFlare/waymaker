<script lang="ts">
	import { FolderOpenIcon, FolderIcon, BoxIcon, FileIcon, ImageIcon } from 'lucide-svelte';
	import Tree from '@/components/reui/Tree.svelte';
	import TreeItem from '@/components/reui/TreeItem.svelte';
	import TreeItemLabel from '@/components/reui/TreeItemLabel.svelte';
	import TreeDragLine from '@/components/reui/TreeDragLine.svelte';
	import { syncDataLoaderFeature } from '@headless-tree/core';
	import { useTree } from '@/hooks/useTree.svelte';
	import { sceneStore, selectNode } from '@/store/sceneStore.svelte';
	import { SCENE_ROOT_ID } from '@/lib/scene';

	const MESH_TYPES = new Set(['Mesh', 'SkinnedMesh']);
	const IMAGE_TYPES = new Set(['ImagePlane']);

	interface TreeItemData {
		name: string;
		type: string;
		children: string[];
	}

	let treeData: Record<string, TreeItemData> = {};

	const ht = useTree<TreeItemData>({
		rootItemId: SCENE_ROOT_ID,
		getItemName: (item) => item.getItemData().name,
		isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
		dataLoader: {
			getItem: (id) => treeData[id],
			getChildren: (id) => treeData[id]?.children ?? []
		},
		features: [syncDataLoaderFeature],
		initialState: {
			expandedItems: [SCENE_ROOT_ID]
		}
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
		ht.tree.rebuildTree();
	});
</script>

{#if sceneStore.sceneRootChildren.length === 0}
	<p class="px-4 py-6 text-center text-xs text-muted-foreground">
		Import a GLB or GLTF to see the scene graph
	</p>
{:else}
	<Tree tree={ht.tree} indent={16} toggleIconType="chevron" class="p-2">
		{#each ht.items as item (item.getId())}
			{@const data = treeData[item.getId()]}
			{@const isMesh = MESH_TYPES.has(data?.type ?? '')}
			{@const isImage = IMAGE_TYPES.has(data?.type ?? '')}
			<TreeItem {item}>
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

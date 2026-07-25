<script lang="ts">
	import { MathUtils } from 'three';
	import { applyTransform } from '@/store/sceneStore.svelte';
	import type { SceneNode, Vec3 } from '@/store/sceneStore.svelte';
	import { centerPivot } from '@/lib/nodeTransform';
	import { Button } from '@/components/ui/button';
	import ScrubNumberField from './ui/ScrubNumberField.svelte';
	import Panel from './ui/Panel.svelte';
	import PanelHeader from './ui/PanelHeader.svelte';
	import PanelTitle from './ui/PanelTitle.svelte';
	import PanelDescription from './ui/PanelDescription.svelte';
	import PanelBody from './ui/PanelBody.svelte';
	import PanelVec3 from './ui/PanelVec3.svelte';
	import { historyManager } from '@/lib/history/history-manager.svelte';
	import { transformTarget } from '@/lib/history/commands/transform.svelte';

	const AXES = ['X', 'Y', 'Z'] as const;
	const POS_FORMAT: Intl.NumberFormatOptions = {
		minimumFractionDigits: 3,
		maximumFractionDigits: 3
	};
	const ROT_FORMAT: Intl.NumberFormatOptions = {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	};
	const SCALE_FORMAT: Intl.NumberFormatOptions = {
		minimumFractionDigits: 3,
		maximumFractionDigits: 3
	};

	interface Props {
		node: SceneNode;
	}
	let { node }: Props = $props();

	const rotDeg = $derived<Vec3>(node.rotation.map(MathUtils.radToDeg) as Vec3);

	const handlePos = (axis: 0 | 1 | 2, val: number) => {
		const p = [...node.position] as Vec3;
		p[axis] = val;
		applyTransform(node.uuid, { position: p });
	};

	const handleRot = (axis: 0 | 1 | 2, val: number) => {
		const r = [...node.rotation] as Vec3;
		r[axis] = MathUtils.degToRad(val);
		applyTransform(node.uuid, { rotation: r });
	};

	const handleScale = (axis: 0 | 1 | 2, val: number) => {
		const s = [...node.scale] as Vec3;
		s[axis] = val;
		applyTransform(node.uuid, { scale: s });
	};
</script>

<Panel>
	<PanelHeader>
		<PanelTitle>{node.name}</PanelTitle>
		<PanelDescription>{node.type}</PanelDescription>
	</PanelHeader>
	<PanelBody>
		<PanelVec3 label="Position">
			{#each AXES as axis, i}
				{@const id = `transform[${node.uuid}][position][${axis}]`}
				<ScrubNumberField
					label={axis}
					value={node.position[i]}
					onChange={(val) => handlePos(i as 0 | 1 | 2, val)}
					step={0.1}
					format={POS_FORMAT}
					onChangeStart={() => {
						historyManager.beginTransaction(id);
						historyManager.track(id, transformTarget(node));
					}}
					onChangeEnd={() => {
						historyManager.commitTransaction(id);
					}}
				/>
			{/each}
		</PanelVec3>

		<PanelVec3 label="Rotation">
			{#each AXES as axis, i}
				{@const id = `transform[${node.uuid}][rotation][${axis}]`}
				<ScrubNumberField
					label={axis}
					value={rotDeg[i]}
					onChange={(val) => handleRot(i as 0 | 1 | 2, val)}
					step={1}
					format={ROT_FORMAT}
					onChangeStart={() => {
						historyManager.beginTransaction(id);
						historyManager.track(id, transformTarget(node));
					}}
					onChangeEnd={() => {
						historyManager.commitTransaction(id);
					}}
				/>
			{/each}
		</PanelVec3>

		<PanelVec3 label="Scale">
			{#each AXES as axis, i}
				{@const id = `transform[${node.uuid}][scale][${axis}]`}
				<ScrubNumberField
					label={axis}
					value={node.scale[i]}
					onChange={(val) => handleScale(i as 0 | 1 | 2, val)}
					step={0.01}
					format={SCALE_FORMAT}
					onChangeStart={() => {
						historyManager.beginTransaction(id);
						historyManager.track(id, transformTarget(node));
					}}
					onChangeEnd={() => {
						historyManager.commitTransaction(id);
					}}
				/>
			{/each}
		</PanelVec3>

		<Button variant="outline" size="sm" class="w-full" onclick={() => centerPivot(node.uuid)}>
			Center Pivot
		</Button>
	</PanelBody>
</Panel>

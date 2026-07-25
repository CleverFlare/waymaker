<script lang="ts">
	import { useThrelte } from '@threlte/core';
	import { TransformControls } from '@threlte/extras';
	import { Euler, MathUtils, PerspectiveCamera, Quaternion } from 'three';
	import { sceneStore, getObject, updateNode } from '@/store/sceneStore.svelte';
	import type { ImagePlaneNode, SceneNode, Vec3 } from '@/store/sceneStore.svelte';
	import { gizmoInteracting } from '@/lib/gizmoInteracting';
	import { historyManager } from '@/lib/history/history-manager.svelte';
	import { transformTarget } from '@/lib/history/commands/transform.svelte';

	const TOOL_TO_MODE = {
		move: 'translate',
		rotate: 'rotate',
		resize: 'scale'
	} as const;

	const _invCamQuat = new Quaternion();
	const _offsetEuler = new Euler();

	const { camera } = useThrelte();

	const node = $derived(
		sceneStore.selectedUuid ? (sceneStore.nodes[sceneStore.selectedUuid] ?? null) : null
	);
	const object = $derived(
		sceneStore.selectedUuid ? (getObject(sceneStore.selectedUuid) ?? null) : null
	);
	const ipNode = $derived(node?.type === 'ImagePlane' ? (node as ImagePlaneNode) : null);
	const mode = $derived(
		sceneStore.activeTool !== 'select'
			? TOOL_TO_MODE[sceneStore.activeTool as keyof typeof TOOL_TO_MODE]
			: null
	);

	const extractCameraRot = (): Vec3 => {
		_invCamQuat.copy(camera.current.quaternion).invert();
		_invCamQuat.multiply(object!.quaternion);
		_offsetEuler.setFromQuaternion(_invCamQuat);
		return [_offsetEuler.x, _offsetEuler.y, _offsetEuler.z];
	};

	const extractCameraScale = (): Vec3 => {
		const dist = camera.current.position.distanceTo(object!.position);
		const fov = camera.current instanceof PerspectiveCamera ? camera.current.fov : 50;
		const factor = dist * 2 * Math.tan(MathUtils.degToRad(fov / 2));
		return [object!.scale.x / factor, object!.scale.y / factor, 1];
	};

	let gizmoTxId: string | null = null;

	// Replaces the eventBus.emit calls — write to store directly for live panel
	// updates and so scene components (billboard/sizeAttenuation) pick up changes
	// each frame via their useTask reads.
	const handleChange = () => {
		if (!sceneStore.selectedUuid || !object) return;
		if (ipNode?.billboard && sceneStore.activeTool === 'rotate') {
			updateNode(sceneStore.selectedUuid, {
				cameraRotation: extractCameraRot()
			} as Partial<SceneNode>);
		} else if (ipNode?.sizeAttenuation && sceneStore.activeTool === 'resize') {
			updateNode(sceneStore.selectedUuid, {
				cameraScale: extractCameraScale()
			} as Partial<SceneNode>);
		} else {
			updateNode(sceneStore.selectedUuid, {
				position: [object.position.x, object.position.y, object.position.z],
				rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
				scale: [object.scale.x, object.scale.y, object.scale.z]
			});
		}
	};
</script>

{#if sceneStore.selectedUuid && object && mode}
	{#key sceneStore.selectedUuid}
		<TransformControls
			{object}
			{mode}
			space="world"
			onmouseDown={() => {
				gizmoInteracting.current = true;
				if (node && sceneStore.selectedUuid) {
					gizmoTxId = `gizmo[${sceneStore.selectedUuid}]`;
					historyManager.beginTransaction(gizmoTxId);
					historyManager.track(gizmoTxId, transformTarget(node));
				}
			}}
			onmouseUp={() => {
				gizmoInteracting.current = false;
				if (gizmoTxId) {
					historyManager.commitTransaction(gizmoTxId);
					gizmoTxId = null;
				}
			}}
			onchange={handleChange}
		/>
	{/key}
{/if}

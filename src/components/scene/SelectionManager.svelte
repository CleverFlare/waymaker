<script lang="ts">
	import { T, useThrelte, useTask } from '@threlte/core';
	import {
		BoxHelper,
		Raycaster,
		Sprite,
		SpriteMaterial,
		TextureLoader,
		Vector2,
		Vector3
	} from 'three';
	import { createDragGuard } from '@/lib/dragGuard';
	import { sceneStore, selectNode, getObject } from '@/store/sceneStore.svelte';
	import { gizmoInteracting } from '@/lib/gizmoInteracting';
	import pivotPointPng from '@/assets/pivot-point.png?url';

	const { scene, camera, canvas, dom } = useThrelte();
	const raycaster = new Raycaster();
	const { onPointerDown, wasDrag } = createDragGuard(5);

	// ── Click-to-select ────────────────────────────────────────────────────────

	$effect(() => {
		const handleClick = (e: MouseEvent) => {
			if (wasDrag(e)) return;
			if (gizmoInteracting.current) return;
			const rect = canvas.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(new Vector2(x, y), camera.current);
			const intersects = raycaster.intersectObjects(scene.children, true);
			const hit = intersects.find((i) => sceneStore.nodes[i.object.uuid]);
			selectNode(hit ? hit.object.uuid : null);
		};

		// TransformControls registers on `dom` (the canvas wrapper div) and calls
		// setPointerCapture on it, which redirects pointerup and the resulting
		// click event to the div rather than the canvas. Listening on the same
		// element ensures handleClick receives the click in all tool modes.
		dom.addEventListener('pointerdown', onPointerDown);
		dom.addEventListener('click', handleClick);
		return () => {
			dom.removeEventListener('pointerdown', onPointerDown);
			dom.removeEventListener('click', handleClick);
		};
	});

	// ── BoxHelper (inlined useBoxHelper) ──────────────────────────────────────

	let boxHelper = $state<BoxHelper | null>(null);

	$effect(() => {
		const obj = sceneStore.selectedUuid ? getObject(sceneStore.selectedUuid) : null;
		if (!obj) {
			boxHelper = null;
			return;
		}
		const helper = new BoxHelper(obj, 0xffff00);
		helper.material.depthTest = false;
		helper.material.depthWrite = false;
		helper.material.transparent = true;
		helper.renderOrder = 1;
		boxHelper = helper;
		return () => {
			boxHelper = null;
		};
	});

	useTask(() => boxHelper?.update());

	// ── PivotSprite (inlined usePivotSprite) ──────────────────────────────────

	const _worldPos = new Vector3();
	let pivotSprite = $state<Sprite | null>(null);

	$effect(() => {
		const obj = sceneStore.selectedUuid ? getObject(sceneStore.selectedUuid) : null;
		if (!obj) {
			pivotSprite = null;
			return;
		}
		const loader = new TextureLoader();
		const texture = loader.load(pivotPointPng, (t) => {
			t.needsUpdate = true;
		});
		const mat = new SpriteMaterial({
			map: texture,
			sizeAttenuation: false,
			depthTest: false,
			depthWrite: false,
			transparent: true
		});
		const s = new Sprite(mat);
		s.scale.setScalar(0.02);
		s.renderOrder = 2;
		pivotSprite = s;
		return () => {
			pivotSprite = null;
			mat.dispose();
			texture.dispose();
		};
	});

	useTask(() => {
		if (!pivotSprite) return;
		const obj = sceneStore.selectedUuid ? getObject(sceneStore.selectedUuid) : null;
		if (!obj) return;
		obj.getWorldPosition(_worldPos);
		pivotSprite.position.copy(_worldPos);
	});
</script>

{#if boxHelper}
	<T is={boxHelper} dispose={false} />
{/if}
{#if pivotSprite}
	<T is={pivotSprite} dispose={false} />
{/if}

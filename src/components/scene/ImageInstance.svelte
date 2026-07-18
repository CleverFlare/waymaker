<script lang="ts">
	import { untrack } from 'svelte';
	import * as THREE from 'three';
	import { MathUtils, PerspectiveCamera, Euler, Quaternion } from 'three';
	import { T, useThrelte, useTask } from '@threlte/core';
	import { useTexture } from '@threlte/extras';
	import {
		sceneStore,
		addModel,
		removeNode,
		registerObject,
		unregisterObject,
		createImagePlaneNode
	} from '@/store/sceneStore.svelte';
	import type { ImagePlaneNode } from '@/store/sceneStore.svelte';
	import { gizmoInteracting } from '@/lib/gizmoInteracting';

	interface Props {
		url: string;
		name: string;
	}

	let { url, name }: Props = $props();

	const texture = useTexture(untrack(() => url));
	const { camera } = useThrelte();

	// Created once the texture resolves; disposed on cleanup.
	let mesh = $state<THREE.Mesh | null>(null);

	$effect(() => {
		const tex = $texture;
		if (!tex) return;

		const w = ((tex.image as Record<string, unknown>)?.width as number) || 1;
		const h = ((tex.image as Record<string, unknown>)?.height as number) || 1;
		const max = Math.max(w, h);
		const geo = new THREE.PlaneGeometry(w / max, h / max);
		const mat = new THREE.MeshBasicMaterial({
			map: tex,
			transparent: true,
			alphaTest: 0.1,
			side: THREE.DoubleSide
		});
		const m = new THREE.Mesh(geo, mat);
		m.name = name;

		addModel({ [m.uuid]: createImagePlaneNode(m.uuid, name) }, m.uuid);
		registerObject(m.uuid, m);
		mesh = m;

		return () => {
			removeNode(m.uuid);
			unregisterObject(m.uuid);
			geo.dispose();
			mat.dispose();
			mesh = null;
		};
	});

	// ── Billboard (inlined useBillboard) ──────────────────────────────────────

	const _euler = new Euler();
	const _offsetQuat = new Quaternion();
	let prevBillboard = false;

	// ── Size attenuation (inlined useSizeAttenuation) ─────────────────────────

	let prevSizeAttenuation = false;

	useTask(() => {
		if (!mesh) return;
		const node = sceneStore.nodes[mesh.uuid] as ImagePlaneNode | undefined;
		if (!node || node.type !== 'ImagePlane') return;

		const cam = camera.current;

		// Billboard: align mesh quaternion to camera, offset by stored cameraRotation
		if (node.billboard) {
			if (!gizmoInteracting.current) {
				const [rx, ry, rz] = node.cameraRotation;
				_euler.set(rx, ry, rz);
				_offsetQuat.setFromEuler(_euler);
				mesh.quaternion.copy(cam.quaternion).multiply(_offsetQuat);
			}
		} else if (prevBillboard) {
			mesh.rotation.set(node.rotation[0], node.rotation[1], node.rotation[2]);
		}
		prevBillboard = node.billboard;

		// Size attenuation: scale mesh to constant screen size based on cameraScale
		if (node.sizeAttenuation) {
			if (!gizmoInteracting.current) {
				const dist = cam.position.distanceTo(mesh.position);
				const fov = cam instanceof PerspectiveCamera ? cam.fov : 50;
				const factor = dist * 2 * Math.tan(MathUtils.degToRad(fov / 2));
				const [sx, sy] = node.cameraScale;
				mesh.scale.set(sx * factor, sy * factor, 1);
			}
		} else if (prevSizeAttenuation) {
			mesh.scale.set(node.scale[0], node.scale[1], node.scale[2]);
		}
		prevSizeAttenuation = node.sizeAttenuation;
	});
</script>

{#if mesh}
	<T is={mesh} dispose={false} />
{/if}

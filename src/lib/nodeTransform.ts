import { Box3, Mesh, Vector3 } from 'three';
import { getObject, updateNode } from '@/store/sceneStore.svelte';

export function centerPivot(uuid: string): void {
	const obj = getObject(uuid);
	if (!obj) return;

	obj.updateWorldMatrix(true, true);

	const box = new Box3().setFromObject(obj);
	if (box.isEmpty()) return;

	const wCenter = new Vector3();
	box.getCenter(wCenter);

	const localOffset = obj.worldToLocal(wCenter.clone());

	for (const child of obj.children) {
		child.position.sub(localOffset);
		child.updateMatrix();
	}

	if (obj instanceof Mesh && obj.geometry) {
		obj.geometry.translate(-localOffset.x, -localOffset.y, -localOffset.z);
	}

	const newPos = obj.parent ? obj.parent.worldToLocal(wCenter.clone()) : wCenter.clone();
	obj.position.copy(newPos);
	obj.updateMatrix();
	obj.updateMatrixWorld(true);

	updateNode(uuid, { position: [obj.position.x, obj.position.y, obj.position.z] });
}

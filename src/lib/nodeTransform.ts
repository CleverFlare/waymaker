import { Box3, Mesh, Vector3 } from 'three';
import { getObject, updateNode } from '@/store/sceneStore.svelte';
import type { Vec3 } from '@/store/sceneStore.svelte';
import { historyManager } from '@/lib/history/history-manager.svelte';
import { CenterPivotCommand } from '@/lib/history/commands/center-pivot.svelte';

export function centerPivot(uuid: string): void {
	const obj = getObject(uuid);
	if (!obj) return;

	obj.updateWorldMatrix(true, true);

	const box = new Box3().setFromObject(obj);
	if (box.isEmpty()) return;

	const wCenter = new Vector3();
	box.getCenter(wCenter);

	const localOffset = obj.worldToLocal(wCenter.clone());
	const oldPosition: Vec3 = [obj.position.x, obj.position.y, obj.position.z];

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

	const newPosition: Vec3 = [obj.position.x, obj.position.y, obj.position.z];
	updateNode(uuid, { position: newPosition });

	historyManager.record(new CenterPivotCommand(uuid, localOffset, oldPosition, newPosition));
}

import { Mesh } from 'three';
import type { Vector3 } from 'three';
import { getObject, applyTransform } from '@/store/sceneStore.svelte';
import type { Vec3 } from '@/store/sceneStore.svelte';
import { Command } from '../command.svelte';

export class CenterPivotCommand extends Command {
	constructor(uuid: string, localOffset: Vector3, oldPosition: Vec3, newPosition: Vec3) {
		function shift(negate: boolean) {
			const obj = getObject(uuid);
			if (!obj) return;
			for (const child of obj.children) {
				if (negate) child.position.add(localOffset);
				else child.position.sub(localOffset);
				child.updateMatrix();
			}
			if (obj instanceof Mesh && obj.geometry) {
				const s = negate ? 1 : -1;
				obj.geometry.translate(s * localOffset.x, s * localOffset.y, s * localOffset.z);
			}
			obj.updateMatrixWorld(true);
		}

		super(
			() => {
				shift(true);
				applyTransform(uuid, { position: oldPosition });
			},
			() => {
				shift(false);
				applyTransform(uuid, { position: newPosition });
			}
		);
	}
}

import { applyTransform } from '@/store/sceneStore.svelte';
import type { SceneNode, Transform, Vec3 } from '@/store/sceneStore.svelte';
import { Command } from '../command.svelte';
import type { Trackable } from '../history-manager.svelte';

export function transformTarget(node: SceneNode): Trackable<Transform> {
	return {
		get: () => ({
			position: [...node.position],
			rotation: [...node.rotation],
			scale: [...node.scale]
		}),
		createCommand: (before, after) => {
			return new TransformCommand(node.uuid, before, after);
		},
		equals: (a, b) => {
			const position = a.position.every((val, index) => val === b.position[index]);
			const rotation = a.rotation.every((val, index) => val === b.rotation[index]);
			const scale = a.scale.every((val, index) => val === b.scale[index]);

			return position && rotation && scale;
		}
	};
}

export class TransformCommand extends Command {
	constructor(
		uuid: string,
		before: { position: Vec3; scale: Vec3; rotation: Vec3 },
		after: { position: Vec3; scale: Vec3; rotation: Vec3 }
	) {
		function undo() {
			applyTransform(uuid, before);
		}

		function redo() {
			applyTransform(uuid, after);
		}

		super(undo, redo);
	}
}

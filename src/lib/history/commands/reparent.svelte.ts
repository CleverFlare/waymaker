import { reparentNodes, getObject } from '@/store/sceneStore.svelte';
import { Command } from '../command.svelte';

export class ReparentCommand extends Command {
	constructor(parentId: string, before: string[], after: string[]) {
		const addedOnRedo = after.filter((id) => !before.includes(id));
		const addedOnUndo = before.filter((id) => !after.includes(id));

		function attachToParent(childIds: string[]) {
			if (childIds.length === 0) return;
			const parentObject = getObject(parentId);
			if (!parentObject) return;
			childIds.forEach((id) => {
				const childObject = getObject(id);
				if (childObject) parentObject.attach(childObject);
			});
		}

		super(
			() => {
				reparentNodes(parentId, before);
				attachToParent(addedOnUndo);
			},
			() => {
				reparentNodes(parentId, after);
				attachToParent(addedOnRedo);
			}
		);
	}
}

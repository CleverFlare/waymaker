import { Command } from '../command.svelte';

export class CompositeCommand extends Command {
	constructor(commands: Command[]) {
		super(
			() => [...commands].reverse().forEach((c) => c.undo()),
			() => commands.forEach((c) => c.redo())
		);
	}
}

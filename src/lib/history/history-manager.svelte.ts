import type { Command } from './command.svelte';
import { CompositeCommand } from './commands/composite.svelte';

export interface Trackable<T> {
	get(): T;
	createCommand(before: T, after: T): Command;
	equals?(a: T, b: T): boolean; // optional, defaults to !==
}

class HistoryManager {
	private undoStack: Command[] = [];
	private redoStack: Command[] = [];

	private debug: boolean = true;

	private pending: Record<string, { target: Trackable<any>; before: any }[]> = {};

	beginTransaction(id: string) {
		this.pending[id] = [];
	}

	track(id: string, target: Trackable<any>) {
		this.pending[id]?.push({ target, before: target.get() });
	}

	commitTransaction(id: string) {
		const entries = this.pending[id];
		delete this.pending[id];
		if (!entries || entries.length === 0) return;

		const commands = entries
			.map(({ target, before }) => {
				const after = target.get();
				const unchanged = target.equals ? target.equals(before, after) : before === after;
				return unchanged ? null : target.createCommand(before, after);
			})
			.filter((c): c is Command => c !== null);

		if (commands.length === 0) return;
		const entry = commands.length === 1 ? commands[0] : new CompositeCommand(commands);
		this.record(entry);
	}

	cancelTransaction(id: string) {
		delete this.pending[id];
	}

	record(...commands: Command[]) {
		this.undoStack.push(...commands);
		this.redoStack = [];

		if (this.debug) {
			console.log('record (undo stack)', this.undoStack);
			console.log('record (redo stack)', this.redoStack);
		}
	}

	undo() {
		const command = this.undoStack.pop();

		if (!command) return;

		command.undo();

		this.redoStack.push(command);

		if (this.debug) {
			console.log('undo (undo stack)', this.undoStack);
			console.log('undo (redo stack)', this.redoStack);
		}
	}

	redo() {
		const command = this.redoStack.pop();

		if (!command) return;

		command.redo();

		this.undoStack.push(command);

		if (this.debug) {
			console.log('redo (undo stack)', this.undoStack);
			console.log('redo (redo stack)', this.redoStack);
		}
	}
}

export const historyManager = new HistoryManager();

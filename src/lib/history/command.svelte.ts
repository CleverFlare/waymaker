export class Command {
	constructor(
		public undo: () => void,
		public redo: () => void
	) {}
}

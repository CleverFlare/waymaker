/**
 * This is a Svelte 5 / bits-ui port of Base UI's NumberField
 * (https://github.com/mui/base-ui, packages/react/src/number-field), adapted to
 * bits-ui's state-class + runes architecture (see bits/slider/slider.svelte.ts for
 * the pattern this follows).
 */
import { untrack } from 'svelte';
import {
	attachRef,
	DOMContext,
	onMountEffect,
	type ReadableBoxedValues,
	type WritableBoxedValues
} from 'svelte-toolbelt';
import { on } from 'svelte/events';
import { Context, watch } from 'runed';
import { createBitsAttrs, boolToEmptyStrOrUndef } from '$bits/dist/internal/attrs.js';
import { isBrowser } from '$bits/dist/internal/is.js';
import type { OnChangeFn, RefAttachment, WithRefOpts } from '$bits/dist/internal/types.js';

export const numberFieldAttrs = createBitsAttrs({
	component: 'number-field',
	parts: ['root', 'group', 'input', 'increment', 'decrement', 'scrub-area', 'scrub-area-cursor']
});

/*
 * -----------------------------------------------------------------------------------------------
 * format / parse helpers
 * -----------------------------------------------------------------------------------------------
 * Simplified relative to Base UI's `utils/parse.ts` + `utils/validate.ts`: this covers
 * locale-aware grouping/decimal separators and standard Intl.NumberFormat options
 * (currency, percent, unit, min/max fraction digits, etc.), but doesn't replicate the
 * character-by-character bidi/format-control handling Base UI does for exotic locales.
 * -----------------------------------------------------------------------------------------------
 */

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(
	locale: Intl.LocalesArgument,
	format?: Intl.NumberFormatOptions
): Intl.NumberFormat {
	const key = `${JSON.stringify(locale ?? null)}:${JSON.stringify(format ?? null)}`;
	let formatter = formatterCache.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat(locale, format);
		formatterCache.set(key, formatter);
	}
	return formatter;
}

export function formatNumber(
	value: number | null,
	locale: Intl.LocalesArgument,
	format?: Intl.NumberFormatOptions
): string {
	if (value === null) return '';
	if (!Number.isFinite(value)) return '';
	return getFormatter(locale, format).format(value);
}

function getNumberLocaleDetails(locale: Intl.LocalesArgument, format?: Intl.NumberFormatOptions) {
	const parts = getFormatter(locale, format).formatToParts(1234.5);
	const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';
	const group = parts.find((p) => p.type === 'group')?.value ?? ',';
	return { decimal, group };
}

const MINUS_SIGNS_RE = /[-\u2212\u2012-\u2015\uFE58\uFE63\uFF0D]/g;
const PLUS_SIGNS_RE = /[+\uFB29\uFE62\uFF0B]/g;

export function parseNumber(
	text: string,
	locale: Intl.LocalesArgument,
	format?: Intl.NumberFormatOptions
): number | null {
	if (text.trim() === '') return null;

	const { decimal, group } = getNumberLocaleDetails(locale, format);

	let normalized = text
		.replace(new RegExp(`\\${group}`, 'g'), '')
		.replace(MINUS_SIGNS_RE, '-')
		.replace(PLUS_SIGNS_RE, '+');

	if (decimal !== '.') {
		normalized = normalized.replace(new RegExp(`\\${decimal}`), '.');
	}

	// Strip currency symbols / unit literals / percent / permille, keeping digits, sign,
	// decimal point, and exponent marker.
	normalized = normalized.replace(/[^0-9.eE+-]/g, '');

	if (normalized === '' || normalized === '-' || normalized === '+') return null;

	const isPercent = format?.style === 'percent';
	const parsed = Number(normalized);
	if (Number.isNaN(parsed)) return null;

	return isPercent ? parsed / 100 : parsed;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

const STEP_EPSILON_FACTOR = 1e-10;

function snapToStep(value: number, base: number, step: number, nearest: boolean): number {
	const stepSize = Math.abs(step);
	const direction = Math.sign(step);
	const tolerance = stepSize * STEP_EPSILON_FACTOR * direction;
	const rawSteps = value - base + tolerance;

	if (nearest) {
		return base + Math.round(rawSteps / step) * step;
	}

	const snappedSteps =
		direction > 0 ? Math.floor(rawSteps / stepSize) : Math.ceil(rawSteps / stepSize);
	return base + snappedSteps * stepSize;
}

function removeFloatingPointErrors(value: number): number {
	if (!Number.isFinite(value)) return value;
	const rounded = Number.parseFloat(value.toPrecision(15));
	const delta = Math.abs(rounded - value);
	const tolerance = Math.min(Number.EPSILON * Math.max(1, Math.abs(value)), 1e-10);
	return delta <= tolerance ? rounded : value;
}

function toValidatedNumber(opts: {
	value: number | null;
	step: number | undefined;
	min: number;
	max: number;
	minWithZeroDefault: number;
	snapOnStep: boolean;
	small: boolean;
	shouldClamp: boolean;
}): number | null {
	const { value, step, min, max, minWithZeroDefault, snapOnStep, small, shouldClamp } = opts;
	if (value === null) return null;

	let nextValue = value;

	if (step != null && snapOnStep && step !== 0) {
		const base = small || min === Number.MIN_SAFE_INTEGER ? minWithZeroDefault : min;
		nextValue = snapToStep(nextValue, base, step, small);
	}

	if (shouldClamp) {
		nextValue = clamp(nextValue, min, max);
	}

	if (step == null) return nextValue;

	const roundedValue = removeFloatingPointErrors(nextValue);
	return shouldClamp ? clamp(roundedValue, min, max) : roundedValue;
}

/*
 * -----------------------------------------------------------------------------------------------
 * constants
 * -----------------------------------------------------------------------------------------------
 */

const CHANGE_VALUE_TICK_DELAY = 60;
const START_AUTO_CHANGE_DELAY = 400;
const SCROLLING_POINTER_MOVE_DISTANCE = 8;

type Direction = -1 | 1;
type ChangeReason =
	| 'input-change'
	| 'input-clear'
	| 'input-blur'
	| 'input-paste'
	| 'keyboard'
	| 'increment-press'
	| 'decrement-press'
	| 'wheel'
	| 'scrub'
	| 'none';

/*
 * -----------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------
 */

export const NumberFieldRootContext = new Context<NumberFieldRootState>('NumberField.Root');

interface NumberFieldRootStateOpts
	extends
		WithRefOpts,
		ReadableBoxedValues<{
			min: number | undefined;
			max: number | undefined;
			step: number | 'any';
			smallStep: number;
			largeStep: number;
			disabled: boolean;
			readOnly: boolean;
			required: boolean;
			name: string | undefined;
			form: string | undefined;
			allowWheelScrub: boolean;
			snapOnStep: boolean;
			allowOutOfRange: boolean;
			locale: Intl.LocalesArgument;
			format: Intl.NumberFormatOptions | undefined;
			onValueChange: OnChangeFn<number | null>;
			onValueCommitted: OnChangeFn<number | null>;
		}>,
		WritableBoxedValues<{
			value: number | null;
		}> {}

export class NumberFieldRootState {
	static create(opts: NumberFieldRootStateOpts) {
		return NumberFieldRootContext.set(new NumberFieldRootState(opts));
	}

	readonly opts: NumberFieldRootStateOpts;
	readonly attachment: RefAttachment;
	readonly domContext: DOMContext;

	isScrubbing = $state(false);

	/** Tracks whether the visible input text is dirty relative to the numeric `value`. */
	#allowInputSync = true;
	/** The last value produced by a step/scrub/wheel interaction, used when committing. */
	#lastChangedValue: number | null = null;

	inputValue = $state('');

	readonly minWithDefault = $derived.by(() => this.opts.min.current ?? Number.MIN_SAFE_INTEGER);
	readonly maxWithDefault = $derived.by(() => this.opts.max.current ?? Number.MAX_SAFE_INTEGER);
	readonly minWithZeroDefault = $derived.by(() => this.opts.min.current ?? 0);
	readonly stepValue = $derived.by(() =>
		this.opts.step.current === 'any' ? 1 : this.opts.step.current
	);

	constructor(opts: NumberFieldRootStateOpts) {
		this.opts = opts;
		this.attachment = attachRef(opts.ref);
		this.domContext = new DOMContext(opts.ref);

		this.inputValue = formatNumber(opts.value.current, opts.locale.current, opts.format.current);

		watch(
			() => this.opts.value.current,
			(value) => {
				if (!this.#allowInputSync) return;
				const next = formatNumber(value, this.opts.locale.current, this.opts.format.current);
				if (next !== untrack(() => this.inputValue)) {
					this.inputValue = next;
				}
			}
		);
	}

	/** The `<input>` element, tracked by `NumberFieldInputState` on mount. */
	inputEl: HTMLElement | null = null;

	getStepAmount(event?: { altKey?: boolean; shiftKey?: boolean }): number {
		if (event?.altKey) return this.opts.smallStep.current;
		if (event?.shiftKey) return this.opts.largeStep.current;
		return this.stepValue;
	}

	private commit(_reason: ChangeReason, _event?: Event) {
		this.opts.onValueCommitted.current(this.#lastChangedValue ?? this.opts.value.current);
	}

	setValue(
		unvalidatedValue: number | null,
		reason: ChangeReason,
		event?: Event,
		direction?: Direction
	): boolean {
		const isInputReason = reason.startsWith('input-') || reason === 'none';
		const shouldClampValue = !this.opts.allowOutOfRange.current || !isInputReason;

		const validatedValue = toValidatedNumber({
			value: unvalidatedValue,
			step: direction ? this.getStepAmount(event as never) * direction : undefined,
			min: this.minWithDefault,
			max: this.maxWithDefault,
			minWithZeroDefault: this.minWithZeroDefault,
			snapOnStep: this.opts.snapOnStep.current,
			small: (event as { altKey?: boolean })?.altKey ?? false,
			shouldClamp: shouldClampValue
		});

		const currentValue = this.opts.value.current;
		const shouldFireChange =
			validatedValue !== currentValue ||
			(isInputReason && (unvalidatedValue !== currentValue || !this.#allowInputSync));

		if (shouldFireChange) {
			this.opts.onValueChange.current(validatedValue);
			this.opts.value.current = validatedValue;
		}

		this.#lastChangedValue = validatedValue;

		if (this.#allowInputSync) {
			this.inputValue = formatNumber(
				validatedValue,
				this.opts.locale.current,
				this.opts.format.current
			);
		}

		return shouldFireChange;
	}

	incrementValue(
		amount: number,
		params: {
			direction: Direction;
			event?: Event;
			reason: ChangeReason;
			currentValue?: number | null;
		}
	): boolean {
		const { direction, event, reason, currentValue } = params;
		const prevValue = currentValue == null ? this.opts.value.current : currentValue;

		if (typeof prevValue !== 'number') {
			return this.setValue(0, reason, event);
		}

		return this.setValue(prevValue + amount * direction, reason, event, direction);
	}

	setAllowInputSync(value: boolean) {
		this.#allowInputSync = value;
	}

	getAllowInputSync() {
		return this.#allowInputSync;
	}

	getLastChangedValue() {
		return this.#lastChangedValue;
	}

	setLastChangedValue(value: number | null) {
		this.#lastChangedValue = value;
	}

	commitValue(reason: ChangeReason, event?: Event) {
		this.commit(reason, event);
	}

	readonly props = $derived.by(
		() =>
			({
				id: this.opts.id.current,
				'data-disabled': boolToEmptyStrOrUndef(this.opts.disabled.current),
				'data-readonly': boolToEmptyStrOrUndef(this.opts.readOnly.current),
				'data-required': boolToEmptyStrOrUndef(this.opts.required.current),
				'data-scrubbing': boolToEmptyStrOrUndef(this.isScrubbing),
				[numberFieldAttrs.root]: '',
				...this.attachment
			}) as const
	);

	/** Props for the visually-hidden native `<input type="number">` used for form submission. */
	readonly hiddenInputProps = $derived.by(
		() =>
			({
				type: 'number',
				'aria-hidden': 'true',
				tabindex: -1,
				form: this.opts.form.current,
				name: this.opts.name.current,
				value: this.opts.value.current ?? '',
				min: this.opts.min.current,
				max: this.opts.max.current,
				step: this.opts.step.current,
				disabled: this.opts.disabled.current,
				readonly: this.opts.readOnly.current,
				required: this.opts.required.current,
				style: 'position:absolute;opacity:0;pointer-events:none;margin:0;width:1px;height:1px;'
			}) as const
	);
}

/*
 * -----------------------------------------------------------------------------------------------
 * Group
 * -----------------------------------------------------------------------------------------------
 */

interface NumberFieldGroupStateOpts extends WithRefOpts {}

export class NumberFieldGroupState {
	static create(opts: NumberFieldGroupStateOpts) {
		return new NumberFieldGroupState(opts, NumberFieldRootContext.get());
	}

	readonly opts: NumberFieldGroupStateOpts;
	readonly root: NumberFieldRootState;
	readonly attachment: RefAttachment;

	constructor(opts: NumberFieldGroupStateOpts, root: NumberFieldRootState) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref);
	}

	readonly props = $derived.by(
		() =>
			({
				id: this.opts.id.current,
				role: 'group',
				'data-disabled': boolToEmptyStrOrUndef(this.root.opts.disabled.current),
				'data-readonly': boolToEmptyStrOrUndef(this.root.opts.readOnly.current),
				'data-scrubbing': boolToEmptyStrOrUndef(this.root.isScrubbing),
				[numberFieldAttrs.group]: '',
				...this.attachment
			}) as const
	);
}

/*
 * -----------------------------------------------------------------------------------------------
 * Input
 * -----------------------------------------------------------------------------------------------
 */

const NAVIGATE_KEYS = new Set([
	'Backspace',
	'Delete',
	'ArrowLeft',
	'ArrowRight',
	'Tab',
	'Enter',
	'Escape'
]);

interface NumberFieldInputStateOpts extends WithRefOpts {}

export class NumberFieldInputState {
	static create(opts: NumberFieldInputStateOpts) {
		return new NumberFieldInputState(opts, NumberFieldRootContext.get());
	}

	readonly opts: NumberFieldInputStateOpts;
	readonly root: NumberFieldRootState;
	readonly attachment: RefAttachment;

	constructor(opts: NumberFieldInputStateOpts, root: NumberFieldRootState) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref);

		$effect(() => {
			this.root.inputEl = this.opts.ref.current;
			return () => {
				if (this.root.inputEl === this.opts.ref.current) {
					this.root.inputEl = null;
				}
			};
		});

		onMountEffect(() => {
			const element = this.opts.ref.current;
			if (!element) return;

			const handleWheel = (event: WheelEvent) => {
				if (!this.root.opts.allowWheelScrub.current) return;
				if (this.root.opts.disabled.current || this.root.opts.readOnly.current) return;
				if (event.ctrlKey) return;
				if (this.root.domContext.getDocument().activeElement !== element) return;

				event.preventDefault();
				this.root.setAllowInputSync(true);

				const amount = this.root.getStepAmount(event);
				const changed = this.root.incrementValue(amount, {
					direction: event.deltaY > 0 ? -1 : 1,
					event,
					reason: 'wheel'
				});
				if (changed) {
					this.root.commitValue('wheel', event);
				}
			};

			return on(element, 'wheel', handleWheel, { passive: false });
		});

		this.onfocus = this.onfocus.bind(this);
		this.onblur = this.onblur.bind(this);
		this.oninput = this.oninput.bind(this);
		this.onkeydown = this.onkeydown.bind(this);
		this.onpaste = this.onpaste.bind(this);
	}

	onfocus(event: FocusEvent) {
		if (event.defaultPrevented || this.root.opts.disabled.current) return;
		const target = event.currentTarget as HTMLInputElement;
		const length = target.value.length;
		target.setSelectionRange(length, length);
	}

	onblur(event: FocusEvent) {
		if (event.defaultPrevented || this.root.opts.disabled.current) return;
		if (this.root.opts.readOnly.current) return;

		const inputValue = this.root.inputValue;
		const hadManualInput = !this.root.getAllowInputSync();
		this.root.setAllowInputSync(true);

		if (inputValue.trim() === '') {
			this.root.setValue(null, 'input-clear', event);
			this.root.commitValue('input-clear', event);
			return;
		}

		const parsedValue = parseNumber(
			inputValue,
			this.root.opts.locale.current,
			this.root.opts.format.current
		);
		if (parsedValue === null) return;

		const committed = hadManualInput ? parsedValue : this.root.opts.value.current;
		this.root.setValue(committed, 'input-blur', event);
		this.root.commitValue('input-blur', event);

		const canonicalText = formatNumber(
			this.root.opts.value.current,
			this.root.opts.locale.current,
			this.root.opts.format.current
		);
		if (this.root.inputValue !== canonicalText) {
			this.root.inputValue = canonicalText;
		}
	}

	oninput(event: Event & { currentTarget: HTMLInputElement }) {
		if ((event as unknown as InputEvent).defaultPrevented) return;

		this.root.setAllowInputSync(false);
		const targetValue = event.currentTarget.value;

		if (targetValue.trim() === '') {
			this.root.inputValue = targetValue;
			this.root.setValue(null, 'input-clear', event);
			return;
		}

		const parsedValue = parseNumber(
			targetValue,
			this.root.opts.locale.current,
			this.root.opts.format.current
		);

		this.root.inputValue = targetValue;

		if (parsedValue !== null) {
			this.root.setValue(parsedValue, 'input-change', event);
		}
	}

	onkeydown(event: KeyboardEvent) {
		if (
			event.defaultPrevented ||
			this.root.opts.readOnly.current ||
			this.root.opts.disabled.current
		)
			return;

		const isStepKey = event.key === 'ArrowUp' || event.key === 'ArrowDown';
		const isNavigateKey = NAVIGATE_KEYS.has(event.key);
		const willSetHome = event.key === 'Home' && this.root.opts.min.current != null;
		const willSetEnd = event.key === 'End' && this.root.opts.max.current != null;

		if (
			(event.altKey && !isStepKey) ||
			event.ctrlKey ||
			event.metaKey ||
			isNavigateKey ||
			/^[0-9.,\-+eE]$/.test(event.key)
		) {
			return;
		}

		if (event.key.length > 1 && !isStepKey && !willSetHome && !willSetEnd) return;

		const hadManualInput = !this.root.getAllowInputSync();
		const currentValue = hadManualInput
			? parseNumber(
					this.root.inputValue,
					this.root.opts.locale.current,
					this.root.opts.format.current
				)
			: null;
		const amount = this.root.getStepAmount(event);

		event.preventDefault();
		event.stopPropagation();

		if (isStepKey || willSetHome || willSetEnd) {
			this.root.setAllowInputSync(true);
		}

		let changed = false;
		if (isStepKey) {
			if (!hadManualInput) {
				this.root.setLastChangedValue(this.root.opts.value.current);
			}
			changed = this.root.incrementValue(amount, {
				direction: event.key === 'ArrowUp' ? 1 : -1,
				currentValue,
				event,
				reason: 'keyboard'
			});
		} else if (willSetHome || willSetEnd) {
			changed = this.root.setValue(
				(willSetHome ? this.root.opts.min.current : this.root.opts.max.current) ?? null,
				'keyboard',
				event
			);
		}

		if (changed) {
			this.root.commitValue('keyboard', event);
		}
	}

	onpaste(event: ClipboardEvent) {
		if (
			event.defaultPrevented ||
			this.root.opts.readOnly.current ||
			this.root.opts.disabled.current
		)
			return;

		const pastedData = event.clipboardData?.getData('text/plain') ?? '';
		event.preventDefault();

		const input = event.currentTarget as HTMLInputElement;
		const selectionStart = input.selectionStart ?? this.root.inputValue.length;
		const selectionEnd = input.selectionEnd ?? this.root.inputValue.length;
		const nextText =
			this.root.inputValue.slice(0, selectionStart) +
			pastedData +
			this.root.inputValue.slice(selectionEnd);

		const parsedValue = parseNumber(
			nextText,
			this.root.opts.locale.current,
			this.root.opts.format.current
		);

		if (parsedValue !== null) {
			this.root.setAllowInputSync(false);
			this.root.setValue(parsedValue, 'input-paste', event);
			this.root.inputValue = nextText;
		}
	}

	readonly props = $derived.by(
		() =>
			({
				id: this.opts.id.current,
				type: 'text',
				value: this.root.inputValue,
				inputmode: this.root.minWithDefault < 0 ? 'text' : 'decimal',
				autocomplete: 'off',
				autocorrect: 'off',
				spellcheck: false,
				'aria-roledescription': 'Number field',
				disabled: this.root.opts.disabled.current,
				readonly: this.root.opts.readOnly.current,
				required: this.root.opts.required.current,
				'data-disabled': boolToEmptyStrOrUndef(this.root.opts.disabled.current),
				'data-readonly': boolToEmptyStrOrUndef(this.root.opts.readOnly.current),
				'data-scrubbing': boolToEmptyStrOrUndef(this.root.isScrubbing),
				[numberFieldAttrs.input]: '',
				onfocus: this.onfocus,
				onblur: this.onblur,
				oninput: this.oninput,
				onkeydown: this.onkeydown,
				onpaste: this.onpaste,
				...this.attachment
			}) as const
	);
}

/*
 * -----------------------------------------------------------------------------------------------
 * Stepper buttons (Increment / Decrement)
 * -----------------------------------------------------------------------------------------------
 */

interface NumberFieldStepperButtonStateOpts
	extends WithRefOpts, ReadableBoxedValues<{ disabled: boolean }> {}

abstract class NumberFieldStepperButtonState {
	readonly opts: NumberFieldStepperButtonStateOpts;
	readonly root: NumberFieldRootState;
	readonly attachment: RefAttachment;
	abstract readonly isIncrement: boolean;
	abstract readonly part: 'increment' | 'decrement';

	#holdTimeout: ReturnType<typeof setTimeout> | undefined;
	#holdInterval: ReturnType<typeof setInterval> | undefined;
	#heldStepped = false;

	constructor(opts: NumberFieldStepperButtonStateOpts, root: NumberFieldRootState) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref);
		this.onclick = this.onclick.bind(this);
		this.onpointerdown = this.onpointerdown.bind(this);
	}

	readonly isAtBoundary = $derived.by(() => {
		const value = this.root.opts.value.current;
		if (value == null) return false;
		return this.isIncrement ? value >= this.root.maxWithDefault : value <= this.root.minWithDefault;
	});

	readonly disabled = $derived.by(
		() => this.opts.disabled.current || this.root.opts.disabled.current || this.isAtBoundary
	);

	private syncDirtyInput() {
		if (this.root.getAllowInputSync()) {
			this.root.setLastChangedValue(this.root.opts.value.current);
			return;
		}
		const parsedValue = parseNumber(
			this.root.inputValue,
			this.root.opts.locale.current,
			this.root.opts.format.current
		);
		this.root.setAllowInputSync(true);
		if (parsedValue !== null) {
			this.root.setValue(parsedValue, this.pressReason, undefined);
		}
	}

	private get pressReason(): ChangeReason {
		return this.isIncrement ? 'increment-press' : 'decrement-press';
	}

	private step(event?: Event) {
		const amount = this.root.getStepAmount(event as never);
		return this.root.incrementValue(amount, {
			direction: this.isIncrement ? 1 : -1,
			event,
			reason: this.pressReason
		});
	}

	private clearHold() {
		clearTimeout(this.#holdTimeout);
		clearInterval(this.#holdInterval);
		this.#holdTimeout = undefined;
		this.#holdInterval = undefined;
	}

	onpointerdown(event: PointerEvent) {
		if (event.defaultPrevented || this.root.opts.readOnly.current || event.button || this.disabled)
			return;

		this.syncDirtyInput();
		this.#heldStepped = false;

		if (event.pointerType !== 'touch') {
			this.root.inputEl?.focus();
		}

		if (!isBrowser) return;

		const startX = event.clientX;
		const startY = event.clientY;

		const onMove = (moveEvent: PointerEvent) => {
			const dx = Math.abs(moveEvent.clientX - startX);
			const dy = Math.abs(moveEvent.clientY - startY);
			if (dx > SCROLLING_POINTER_MOVE_DISTANCE || dy > SCROLLING_POINTER_MOVE_DISTANCE) {
				stop();
			}
		};

		const stop = () => {
			this.clearHold();
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			window.removeEventListener('pointermove', onMove);
			if (this.#heldStepped) {
				this.root.commitValue(this.pressReason, event);
			}
		};

		const onUp = () => stop();

		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
		window.addEventListener('pointermove', onMove);

		this.#holdTimeout = setTimeout(() => {
			this.#holdInterval = setInterval(() => {
				this.#heldStepped = true;
				this.step(event);
			}, CHANGE_VALUE_TICK_DELAY);
		}, START_AUTO_CHANGE_DELAY);
	}

	onclick(event: MouseEvent) {
		const isDisabled = this.disabled || this.root.opts.readOnly.current;
		if (event.defaultPrevented || isDisabled) return;

		// A held-and-released press already stepped (possibly many times) and committed;
		// don't let the trailing click event step again.
		if (this.#heldStepped) {
			this.#heldStepped = false;
			return;
		}

		this.syncDirtyInput();
		const prev = this.root.opts.value.current;
		this.step(event);
		const committed = this.root.getLastChangedValue() ?? this.root.opts.value.current;
		if (committed !== prev) {
			this.root.commitValue(this.pressReason, event);
		}
	}

	readonly props = $derived.by(
		() =>
			({
				id: this.opts.id.current,
				type: 'button',
				disabled: this.disabled,
				'aria-label': this.isIncrement ? 'Increase' : 'Decrease',
				'aria-controls': this.root.opts.id.current,
				tabindex: -1,
				'data-disabled': boolToEmptyStrOrUndef(this.disabled),
				style: 'user-select:none;-webkit-user-select:none;',
				[numberFieldAttrs[this.part]]: '',
				onclick: this.onclick,
				onpointerdown: this.onpointerdown,
				...this.attachment
			}) as const
	);
}

export class NumberFieldIncrementState extends NumberFieldStepperButtonState {
	static create(opts: NumberFieldStepperButtonStateOpts) {
		return new NumberFieldIncrementState(opts, NumberFieldRootContext.get());
	}
	readonly isIncrement = true;
	readonly part = 'increment' as const;
}

export class NumberFieldDecrementState extends NumberFieldStepperButtonState {
	static create(opts: NumberFieldStepperButtonStateOpts) {
		return new NumberFieldDecrementState(opts, NumberFieldRootContext.get());
	}
	readonly isIncrement = false;
	readonly part = 'decrement' as const;
}

/*
 * -----------------------------------------------------------------------------------------------
 * Scrub area + cursor
 * -----------------------------------------------------------------------------------------------
 */

export const NumberFieldScrubAreaContext = new Context<NumberFieldScrubAreaState>(
	'NumberField.ScrubArea'
);

interface NumberFieldScrubAreaStateOpts
	extends
		WithRefOpts,
		ReadableBoxedValues<{
			direction: 'horizontal' | 'vertical';
			pixelSensitivity: number;
			teleportDistance: number | undefined;
		}> {}

export class NumberFieldScrubAreaState {
	static create(opts: NumberFieldScrubAreaStateOpts) {
		return NumberFieldScrubAreaContext.set(
			new NumberFieldScrubAreaState(opts, NumberFieldRootContext.get())
		);
	}

	readonly opts: NumberFieldScrubAreaStateOpts;
	readonly root: NumberFieldRootState;
	readonly attachment: RefAttachment;

	isScrubbing = $state(false);
	isTouchInput = $state(false);
	isPointerLockDenied = $state(false);

	cursorEl: HTMLElement | null = null;
	#cursorCoords = { x: 0, y: 0 };

	constructor(opts: NumberFieldScrubAreaStateOpts, root: NumberFieldRootState) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref);
		this.onpointerdown = this.onpointerdown.bind(this);
	}

	#updateCursorTransform(x: number, y: number) {
		if (!this.cursorEl) return;
		const scale = window.visualViewport?.scale ?? 1;
		this.cursorEl.style.transform = `translate3d(${x}px,${y}px,0) scale(${1 / scale})`;
	}

	#getViewportRect() {
		const teleportDistance = this.opts.teleportDistance.current;
		const element = this.opts.ref.current;

		if (teleportDistance != null && element) {
			const rect = element.getBoundingClientRect();
			return {
				left: rect.left - teleportDistance / 2,
				top: rect.top - teleportDistance / 2,
				right: rect.right + teleportDistance / 2,
				bottom: rect.bottom + teleportDistance / 2
			};
		}

		const vV = window.visualViewport;
		if (vV) {
			return {
				left: vV.offsetLeft,
				top: vV.offsetTop,
				right: vV.offsetLeft + vV.width,
				bottom: vV.offsetTop + vV.height
			};
		}

		return {
			left: 0,
			top: 0,
			right: document.documentElement.clientWidth,
			bottom: document.documentElement.clientHeight
		};
	}

	#onScrub(event: PointerEvent) {
		if (!this.cursorEl || !this.opts.ref.current) return;

		const rect = this.#getViewportRect();
		const halfW = this.cursorEl.offsetWidth / 2;
		const halfH = this.cursorEl.offsetHeight / 2;

		const wrap = (coord: number, half: number, low: number, high: number) => {
			if (coord + half < low) return high - half;
			if (coord + half > high) return low - half;
			return coord;
		};

		this.#cursorCoords = {
			x: wrap(Math.round(this.#cursorCoords.x + event.movementX), halfW, rect.left, rect.right),
			y: wrap(Math.round(this.#cursorCoords.y + event.movementY), halfH, rect.top, rect.bottom)
		};

		this.#updateCursorTransform(this.#cursorCoords.x, this.#cursorCoords.y);
	}

	#setScrubbing(value: boolean, event: PointerEvent) {
		this.isScrubbing = value;
		this.root.isScrubbing = value;

		if (!value || !this.cursorEl) return;

		this.#cursorCoords = {
			x: event.clientX - this.cursorEl.offsetWidth / 2,
			y: event.clientY - this.cursorEl.offsetHeight / 2
		};
		this.#updateCursorTransform(this.#cursorCoords.x, this.#cursorCoords.y);
	}

	async onpointerdown(event: PointerEvent) {
		if (
			event.defaultPrevented ||
			this.root.opts.readOnly.current ||
			event.button ||
			this.root.opts.disabled.current
		)
			return;

		const isTouch = event.pointerType === 'touch';
		this.isTouchInput = isTouch;

		if (event.pointerType === 'mouse') {
			event.preventDefault();
			this.root.inputEl?.focus();
		}

		let cumulativeDelta = 0;

		const onMove = (moveEvent: PointerEvent) => {
			moveEvent.preventDefault();
			this.#onScrub(moveEvent);

			const { movementX, movementY } = moveEvent;
			cumulativeDelta += this.opts.direction.current === 'vertical' ? movementY : movementX;

			if (Math.abs(cumulativeDelta) >= this.opts.pixelSensitivity.current) {
				cumulativeDelta = 0;
				const dValue = this.opts.direction.current === 'vertical' ? -movementY : movementX;
				const stepAmount = this.root.getStepAmount(moveEvent);
				const rawAmount = dValue * stepAmount;

				if (rawAmount !== 0) {
					this.root.setAllowInputSync(true);
					this.root.incrementValue(Math.abs(rawAmount), {
						direction: rawAmount >= 0 ? 1 : -1,
						event: moveEvent,
						reason: 'scrub'
					});
				}
			}
		};

		const onUp = (upEvent: PointerEvent) => {
			window.removeEventListener('pointermove', onMove, true);
			window.removeEventListener('pointerup', onUp, true);

			try {
				document.exitPointerLock();
			} catch {
				// ignore
			}

			this.#setScrubbing(false, upEvent);
			this.root.commitValue('scrub', upEvent);
		};

		window.addEventListener('pointermove', onMove, true);
		window.addEventListener('pointerup', onUp, true);

		this.#setScrubbing(true, event);

		if (!isTouch) {
			try {
				await document.body.requestPointerLock();
				this.isPointerLockDenied = false;
			} catch {
				this.isPointerLockDenied = true;
			}
		}
	}

	readonly props = $derived.by(
		() =>
			({
				id: this.opts.id.current,
				role: 'presentation',
				style: 'touch-action:none;user-select:none;-webkit-user-select:none;',
				'data-scrubbing': boolToEmptyStrOrUndef(this.isScrubbing),
				'data-disabled': boolToEmptyStrOrUndef(this.root.opts.disabled.current),
				[numberFieldAttrs['scrub-area']]: '',
				onpointerdown: this.onpointerdown,
				...this.attachment
			}) as const
	);
}

interface NumberFieldScrubAreaCursorStateOpts extends WithRefOpts {}

export class NumberFieldScrubAreaCursorState {
	static create(opts: NumberFieldScrubAreaCursorStateOpts) {
		return new NumberFieldScrubAreaCursorState(opts, NumberFieldScrubAreaContext.get());
	}

	readonly opts: NumberFieldScrubAreaCursorStateOpts;
	readonly scrubArea: NumberFieldScrubAreaState;
	readonly attachment: RefAttachment;

	constructor(opts: NumberFieldScrubAreaCursorStateOpts, scrubArea: NumberFieldScrubAreaState) {
		this.opts = opts;
		this.scrubArea = scrubArea;
		this.attachment = attachRef(opts.ref);

		$effect(() => {
			this.scrubArea.cursorEl = this.opts.ref.current;
			return () => {
				if (this.scrubArea.cursorEl === this.opts.ref.current) {
					this.scrubArea.cursorEl = null;
				}
			};
		});
	}

	/** WebKit gets a layout-shifting native "cursor is hidden" message, so it's disabled there. */
	readonly shouldRender = $derived.by(
		() =>
			this.scrubArea.isScrubbing &&
			!this.scrubArea.isTouchInput &&
			!this.scrubArea.isPointerLockDenied
	);

	readonly props = $derived.by(
		() =>
			({
				id: this.opts.id.current,
				role: 'presentation',
				style: 'position:fixed;top:0;left:0;pointer-events:none;',
				[numberFieldAttrs['scrub-area-cursor']]: '',
				...this.attachment
			}) as const
	);
}

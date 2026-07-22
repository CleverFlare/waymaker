import type { OnChangeFn, WithChild, Without } from '$bits/dist/internal/types.js';
import type {
	BitsPrimitiveButtonAttributes,
	BitsPrimitiveDivAttributes,
	BitsPrimitiveInputAttributes,
	BitsPrimitiveSpanAttributes
} from '$bits/dist/shared/attributes.js';

export type NumberFieldRootPropsWithoutHTML = WithChild<{
	/**
	 * The value of the number field.
	 * @bindable
	 */
	value?: number | null;

	/**
	 * A callback invoked when the value changes.
	 */
	onValueChange?: OnChangeFn<number | null>;

	/**
	 * A callback invoked when the value is committed (blur, pointer release after a
	 * step/scrub/wheel interaction, etc).
	 */
	onValueCommitted?: OnChangeFn<number | null>;

	/**
	 * The minimum value of the field.
	 */
	min?: number;

	/**
	 * The maximum value of the field.
	 */
	max?: number;

	/**
	 * The amount to increment/decrement by with the buttons, arrow keys, or scrub area.
	 * Pass `"any"` to disable step-based snapping while still allowing `smallStep`/`largeStep`
	 * to apply with the alt/shift modifiers.
	 *
	 * @default 1
	 */
	step?: number | 'any';

	/**
	 * The step amount when incrementing/decrementing while the alt key is held.
	 * @default 0.1
	 */
	smallStep?: number;

	/**
	 * The step amount when incrementing/decrementing while the shift key is held.
	 * @default 10
	 */
	largeStep?: number;

	/**
	 * Whether the value should snap to the nearest step when incrementing/decrementing.
	 * @default false
	 */
	snapOnStep?: boolean;

	/**
	 * When `true`, direct text entry (typing/paste) may fall outside the `min`/`max` range.
	 * Step-based interactions (buttons, arrow keys, wheel, scrub) still clamp.
	 * @default false
	 */
	allowOutOfRange?: boolean;

	/**
	 * Whether to allow scrubbing the value with the mouse wheel while the input is focused.
	 * @default false
	 */
	allowWheelScrub?: boolean;

	/**
	 * `Intl.NumberFormat` options used to format the displayed value.
	 */
	format?: Intl.NumberFormatOptions;

	/**
	 * The locale used for formatting/parsing.
	 */
	locale?: Intl.LocalesArgument;

	/**
	 * Whether the field is disabled.
	 * @default false
	 */
	disabled?: boolean;

	/**
	 * Whether the field is read-only.
	 * @default false
	 */
	readOnly?: boolean;

	/**
	 * Whether the field is required in a containing form.
	 * @default false
	 */
	required?: boolean;

	/**
	 * The name used for the hidden native input rendered for form submission.
	 */
	name?: string;

	/**
	 * The id of the form the hidden native input belongs to.
	 */
	form?: string;
}>;

export type NumberFieldRootProps = NumberFieldRootPropsWithoutHTML &
	Without<BitsPrimitiveDivAttributes, NumberFieldRootPropsWithoutHTML>;

export type NumberFieldGroupPropsWithoutHTML = WithChild;

export type NumberFieldGroupProps = NumberFieldGroupPropsWithoutHTML &
	Without<BitsPrimitiveDivAttributes, NumberFieldGroupPropsWithoutHTML>;

export type NumberFieldInputPropsWithoutHTML = WithChild;

export type NumberFieldInputProps = NumberFieldInputPropsWithoutHTML &
	Without<BitsPrimitiveInputAttributes, NumberFieldInputPropsWithoutHTML>;

export type NumberFieldStepperButtonPropsWithoutHTML = WithChild<{
	/**
	 * Whether this button is disabled independent of the root's disabled state
	 * (it's still disabled automatically at the min/max boundary).
	 * @default false
	 */
	disabled?: boolean;
}>;

export type NumberFieldIncrementProps = NumberFieldStepperButtonPropsWithoutHTML &
	Without<BitsPrimitiveButtonAttributes, NumberFieldStepperButtonPropsWithoutHTML>;

export type NumberFieldDecrementProps = NumberFieldStepperButtonPropsWithoutHTML &
	Without<BitsPrimitiveButtonAttributes, NumberFieldStepperButtonPropsWithoutHTML>;

export type NumberFieldScrubAreaPropsWithoutHTML = WithChild<{
	/**
	 * The axis of pointer movement that changes the value.
	 * @default "horizontal"
	 */
	direction?: 'horizontal' | 'vertical';

	/**
	 * How many pixels of movement are required before the value changes.
	 * A higher value makes scrubbing less sensitive.
	 * @default 2
	 */
	pixelSensitivity?: number;

	/**
	 * If specified, the distance the virtual cursor may move from the center of the scrub
	 * area before wrapping back around.
	 */
	teleportDistance?: number;
}>;

export type NumberFieldScrubAreaProps = NumberFieldScrubAreaPropsWithoutHTML &
	Without<BitsPrimitiveSpanAttributes, NumberFieldScrubAreaPropsWithoutHTML>;

export type NumberFieldScrubAreaCursorPropsWithoutHTML = WithChild;

export type NumberFieldScrubAreaCursorProps = NumberFieldScrubAreaCursorPropsWithoutHTML &
	Without<BitsPrimitiveSpanAttributes, NumberFieldScrubAreaCursorPropsWithoutHTML>;

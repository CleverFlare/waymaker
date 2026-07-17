export { default as Root } from "./components/number-field-root.svelte";
export { default as Group } from "./components/number-field-group.svelte";
export { default as Input } from "./components/number-field-input.svelte";
export { default as Increment } from "./components/number-field-increment.svelte";
export { default as Decrement } from "./components/number-field-decrement.svelte";
export { default as ScrubArea } from "./components/number-field-scrub-area.svelte";
export { default as ScrubAreaCursor } from "./components/number-field-scrub-area-cursor.svelte";

export type {
  NumberFieldRootProps as RootProps,
  NumberFieldGroupProps as GroupProps,
  NumberFieldInputProps as InputProps,
  NumberFieldIncrementProps as IncrementProps,
  NumberFieldDecrementProps as DecrementProps,
  NumberFieldScrubAreaProps as ScrubAreaProps,
  NumberFieldScrubAreaCursorProps as ScrubAreaCursorProps,
} from "./types.js";

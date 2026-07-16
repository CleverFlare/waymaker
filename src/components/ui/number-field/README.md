# NumberField for bits-ui

A Svelte 5 port of Base UI's `NumberField` (root, group, input, increment,
decrement, scrub-area, scrub-area-cursor), written to match bits-ui's own
conventions (state classes in `*.svelte.ts`, `WithRefOpts`, `mergeProps`,
`createBitsAttrs`, `child`/`children` snippet pattern, etc.) — modeled closely
on bits-ui's own `slider` component, which has the closest existing
pointer-drag + keyboard-stepping logic.

## Install

Drop the `number-field/` folder into `packages/bits-ui/src/lib/bits/`, then
re-export it from `packages/bits-ui/src/lib/index.ts`:

```ts
export * from "./bits/number-field/index.js";
```

## Usage

```svelte
<script lang="ts">
	import { NumberField } from "bits-ui";
	let value = $state<number | null>(0);
</script>

<NumberField.Root bind:value min={0} max={100} step={1} name="quantity">
	<NumberField.ScrubArea>
		<NumberField.ScrubAreaCursor />
		Quantity
	</NumberField.ScrubArea>
	<NumberField.Group>
		<NumberField.Decrement>−</NumberField.Decrement>
		<NumberField.Input />
		<NumberField.Increment>+</NumberField.Increment>
	</NumberField.Group>
</NumberField.Root>
```

Every part accepts `child`/`children` snippets and forwards `class`/`style`/
arbitrary HTML attributes the way every other bits-ui primitive does.

## What's ported

- `min`/`max`/`step`, `smallStep` (Alt) / `largeStep` (Shift)
- `snapOnStep`, `allowOutOfRange`
- Keyboard: ArrowUp/Down, Home/End, free text typing, paste
- Mouse wheel scrubbing (`allowWheelScrub`) while the input is focused
- Increment/Decrement buttons with press-and-hold auto-repeat
  (400ms initial delay, 60ms tick, matching Base UI's constants)
- Scrub area: pointer-lock drag-to-adjust with a portaled virtual cursor,
  wrap-around at the viewport edge, `direction`, `pixelSensitivity`,
  `teleportDistance`
- Locale-aware formatting/parsing via `Intl.NumberFormat` (`format`, `locale`
  props), including currency/percent/unit styles
- A visually-hidden native `<input type="number">` rendered when `name` is
  set, for native form submission
- `disabled` / `readOnly` / `required`
- `onValueChange` / `onValueCommitted` callbacks (commit fires on blur, or on
  pointer release after a step/scrub/wheel interaction)

## Known simplifications vs. Base UI's React version

Base UI's implementation integrates with its own `Field`/`Form` context
(validation state, `aria-invalid`, dirty tracking tied to a form root, iOS
dynamic `inputMode` switching, and character-by-character bidi/format-control
parsing for exotic locales). None of that has a bits-ui equivalent, so it's
left out here:

- No `Field.Root`/validation integration — wire up `aria-invalid`,
  error messages, etc. yourself, or wrap this in your own field component.
- Character-level input filtering during typing is simplified to a regex
  allow-list (`0-9.,-+eE`) rather than deriving allowed characters from
  `Intl.NumberFormat.formatToParts()` per locale — very unusual locales
  (e.g. ones with multi-character exponent/currency literals) may behave
  slightly differently while typing, though parsing on blur/commit still
  goes through `Intl.NumberFormat`.
- `inputMode` is a simple `min < 0 ? "text" : "decimal"` check rather than
  the iOS-specific dance Base UI does.

These are all isolated in `number-field.svelte.ts` (see `parseNumber`,
`formatNumber`, `getNumberLocaleDetails`) if you want to extend them further.

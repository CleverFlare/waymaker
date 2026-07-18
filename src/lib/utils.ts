import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Converts headless-tree's React-style props to Svelte-compatible format:
 * - Extracts `ref` callback (needs bind:this + $effect)
 * - Converts `style` object to CSS string with kebab-case property names
 * - Converts camelCase `on*` event handlers to lowercase (`onClick` → `onclick`)
 */
export function normalizeHtProps(props: Record<string, any>): {
	ref: ((el: Element | null) => void) | undefined;
	style: string | undefined;
	attrs: Record<string, any>;
} {
	const { ref, style, ...rest } = props;
	const attrs: Record<string, any> = {};
	for (const [k, v] of Object.entries(rest)) {
		attrs[/^on[A-Z]/.test(k) ? k.toLowerCase() : k] = v;
	}
	const styleStr =
		style && typeof style === 'object'
			? Object.entries(style as Record<string, string>)
					.map(([p, v]) => `${p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`)
					.join(';')
			: (style as string | undefined);
	return { ref, style: styleStr, attrs };
}

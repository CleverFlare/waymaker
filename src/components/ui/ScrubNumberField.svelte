<script lang="ts">
  import { NumberField } from "@/components/ui/number-field";

  interface Props {
    label: string;
    value: number;
    onChange: (value: number) => void;
    onCommit?: () => void;
    step?: number;
    format?: Intl.NumberFormatOptions;
  }

  let { label, value, onChange, onCommit, step = 0.1, format }: Props = $props();
</script>

<NumberField.Root
  {value}
  onValueChange={(val) => {
    if (val !== null) onChange(val);
  }}
  onValueCommitted={() => onCommit?.()}
  {step}
  {format}
  class="flex items-center gap-1.5"
>
  <NumberField.ScrubArea
    direction="horizontal"
    class="w-4 shrink-0 cursor-ew-resize select-none text-center text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
  >
    {label}
  </NumberField.ScrubArea>
  <NumberField.Input
    class="min-w-0 flex-1 rounded border border-transparent bg-white/10 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-foreground focus:border-ring focus:bg-background focus:outline-none"
  />
</NumberField.Root>

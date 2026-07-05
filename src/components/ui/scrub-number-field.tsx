import { NumberField } from "@base-ui/react/number-field"

interface ScrubNumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
  format?: Intl.NumberFormatOptions
}

export function ScrubNumberField({
  label,
  value,
  onChange,
  step = 0.1,
  format,
}: ScrubNumberFieldProps) {
  return (
    <NumberField.Root
      value={value}
      onValueChange={(val) => { if (val !== null) onChange(val) }}
      step={step}
      format={format}
      className="flex items-center gap-1.5"
    >
      <NumberField.ScrubArea
        direction="horizontal"
        className="w-4 shrink-0 text-center cursor-ew-resize select-none text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {label}
      </NumberField.ScrubArea>
      <NumberField.Input className="flex-1 min-w-0 rounded px-1.5 py-0.5 text-[11px] font-mono tabular-nums bg-muted/40 text-foreground border border-transparent focus:border-ring focus:bg-background focus:outline-none" />
    </NumberField.Root>
  )
}

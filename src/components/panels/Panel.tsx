import { type ReactNode } from "react";
import { ScrubNumberField } from "@/components/ui/scrub-number-field";

// ── Shell ─────────────────────────────────────────────────────────────────────

function PanelRoot({ children }: { children: ReactNode }) {
  return (
    <aside className="absolute right-4 top-4 z-10 w-56 flex flex-col rounded-xl border border-border bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden max-h-[calc(100%-2rem)]">
      {children}
    </aside>
  );
}

function PanelHeader({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 py-2 border-b border-border shrink-0">{children}</div>
  );
}

function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm font-medium text-foreground truncate">{children}</p>
  );
}

function PanelDescription({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

function PanelBody({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 overflow-y-auto p-3 space-y-4">{children}</div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function PanelSectionRoot({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

function PanelSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

const PanelSection = Object.assign(PanelSectionRoot, {
  Label: PanelSectionLabel,
});

// ── Vec3 ──────────────────────────────────────────────────────────────────────

function PanelVec3Root({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

function PanelVec3Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function PanelVec3Field({
  label,
  value,
  onChange,
  onCommit,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  onCommit: () => void;
  step: number;
  format: Intl.NumberFormatOptions;
}) {
  return (
    <ScrubNumberField
      label={label}
      value={value}
      onChange={onChange}
      onCommit={onCommit}
      step={step}
      format={format}
    />
  );
}

const PanelVec3 = Object.assign(PanelVec3Root, {
  Label: PanelVec3Label,
  Field: PanelVec3Field,
});

// ── Row ───────────────────────────────────────────────────────────────────────

function PanelRowRoot({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">{children}</div>
  );
}

function PanelRowLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs text-foreground">{children}</span>;
}

const PanelRow = Object.assign(PanelRowRoot, {
  Label: PanelRowLabel,
});

// ── Compound export ───────────────────────────────────────────────────────────

export const Panel = Object.assign(PanelRoot, {
  Header: PanelHeader,
  Title: PanelTitle,
  Description: PanelDescription,
  Body: PanelBody,
  Section: PanelSection,
  Vec3: PanelVec3,
  Row: PanelRow,
});

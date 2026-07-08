import { type ReactNode } from "react";
import { useNodeTransform } from "@/hooks/useNodeTransform";
import { ScrubNumberField } from "@/components/ui/scrub-number-field";
import { Button } from "@/components/ui/button";

const AXES = ["X", "Y", "Z"] as const;

const POS_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};
const ROT_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};
const SCALE_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

function Vec3SectionRoot({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

function Vec3SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function Vec3SectionField({
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

const Vec3Section = Object.assign(Vec3SectionRoot, {
  Label: Vec3SectionLabel,
  Field: Vec3SectionField,
});

export function PropertiesPanel() {
  const {
    selectedUuid,
    node,
    pos,
    rot,
    scale,
    handlePos,
    handleRot,
    handleScale,
    commitPos,
    commitRot,
    commitScale,
    handleCenterPivot,
  } = useNodeTransform();

  if (!selectedUuid || !node) return null;

  const isImagePlane = node.type === "ImagePlane";

  return (
    <aside className="absolute right-4 top-4 z-10 w-56 flex flex-col rounded-xl border border-border bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden max-h-[calc(100%-2rem)]">
      <div className="px-3 py-2 border-b border-border shrink-0">
        <p className="text-sm font-medium text-foreground truncate">
          {node.name}
        </p>
        <p className="text-xs text-muted-foreground">{node.type}</p>
      </div>
      <div className="min-h-0 overflow-y-auto p-3 space-y-4">
        <Vec3Section>
          <Vec3Section.Label>Position</Vec3Section.Label>
          {AXES.map((axis, i) => (
            <Vec3Section.Field
              key={axis}
              label={axis}
              value={pos[i]}
              onChange={(val) => handlePos(i as 0 | 1 | 2, val)}
              onCommit={commitPos}
              step={0.1}
              format={POS_FORMAT}
            />
          ))}
        </Vec3Section>
        <Vec3Section>
          <Vec3Section.Label>Rotation</Vec3Section.Label>
          {AXES.map((axis, i) => (
            <Vec3Section.Field
              key={axis}
              label={axis}
              value={rot[i]}
              onChange={(val) => handleRot(i as 0 | 1 | 2, val)}
              onCommit={commitRot}
              step={1}
              format={ROT_FORMAT}
            />
          ))}
        </Vec3Section>
        <Vec3Section>
          <Vec3Section.Label>Scale</Vec3Section.Label>
          {AXES.map((axis, i) => (
            <Vec3Section.Field
              key={axis}
              label={axis}
              value={scale[i]}
              onChange={(val) => handleScale(i as 0 | 1 | 2, val)}
              onCommit={commitScale}
              step={0.01}
              format={SCALE_FORMAT}
            />
          ))}
        </Vec3Section>
        {!isImagePlane && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleCenterPivot}
          >
            Center Pivot
          </Button>
        )}
      </div>
    </aside>
  );
}

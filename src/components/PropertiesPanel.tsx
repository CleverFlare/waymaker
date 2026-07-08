import { useEffect, useRef, useState } from "react";
import { Box3, MathUtils, Mesh, Vector3 } from "three";
import { useSceneStore, type Vec3 } from "@/store/sceneStore";
import { eventBus } from "@/lib/eventBus";
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

function Vec3Section({
  label,
  values,
  onAxisChange,
  onCommit,
  step,
  format,
}: {
  label: string;
  values: Vec3;
  onAxisChange: (axis: 0 | 1 | 2, value: number) => void;
  onCommit: () => void;
  step: number;
  format: Intl.NumberFormatOptions;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">
        {AXES.map((axis, i) => (
          <ScrubNumberField
            key={axis}
            label={axis}
            value={values[i]}
            onChange={(val) => onAxisChange(i as 0 | 1 | 2, val)}
            onCommit={onCommit}
            step={step}
            format={format}
          />
        ))}
      </div>
    </div>
  );
}


export function PropertiesPanel() {
  const selectedUuid = useSceneStore((s) => s.selectedUuid);
  const node = useSceneStore((s) => s.nodes[selectedUuid ?? ""] ?? null);
  const getObject = useSceneStore((s) => s.getObject);
  const updateNode = useSceneStore((s) => s.updateNode);

  const [pos, setPos] = useState<Vec3>([0, 0, 0]);
  const [rot, setRot] = useState<Vec3>([0, 0, 0]);
  const [scale, setScale] = useState<Vec3>([1, 1, 1]);

  const selectedUuidRef = useRef(selectedUuid);
  selectedUuidRef.current = selectedUuid;

  // Sync display state when selection changes
  useEffect(() => {
    if (!node) return;
    setPos(node.position);
    setRot(node.rotation.map(MathUtils.radToDeg) as Vec3);
    setScale(node.scale);
  }, [selectedUuid]);

  // Receive live transform updates from the gizmo via the event bus
  useEffect(() => {
    const handler = ({
      uuid,
      position,
      rotation,
      scale,
    }: {
      uuid: string;
      position: Vec3;
      rotation: Vec3;
      scale: Vec3;
    }) => {
      if (uuid !== selectedUuidRef.current) return;
      setPos(position);
      setRot(rotation.map(MathUtils.radToDeg) as Vec3);
      setScale(scale);
    };
    eventBus.on("transform", handler);
    return () => eventBus.off("transform", handler);
  }, []);

  if (!selectedUuid) return null;
  const obj = getObject(selectedUuid);
  if (!node || !obj) return null;

  const keys = ["x", "y", "z"] as const;

  const handlePos = (axis: 0 | 1 | 2, val: number) => {
    obj.position[keys[axis]] = val;
    setPos((prev) => {
      const n = [...prev] as Vec3;
      n[axis] = val;
      return n;
    });
  };

  const handleRot = (axis: 0 | 1 | 2, val: number) => {
    obj.rotation[keys[axis]] = MathUtils.degToRad(val);
    setRot((prev) => {
      const n = [...prev] as Vec3;
      n[axis] = val;
      return n;
    });
  };

  const handleScale = (axis: 0 | 1 | 2, val: number) => {
    obj.scale[keys[axis]] = val;
    setScale((prev) => {
      const n = [...prev] as Vec3;
      n[axis] = val;
      return n;
    });
  };

  const commitPos = () =>
    updateNode(selectedUuid, {
      position: [obj.position.x, obj.position.y, obj.position.z],
    });

  const commitRot = () =>
    updateNode(selectedUuid, {
      rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
    });

  const commitScale = () =>
    updateNode(selectedUuid, {
      scale: [obj.scale.x, obj.scale.y, obj.scale.z],
    });

  const handleCenterPivot = () => {
    obj.updateWorldMatrix(true, true);

    const box = new Box3().setFromObject(obj);
    if (box.isEmpty()) return;

    const W_center = new Vector3();
    box.getCenter(W_center);

    const C_O = obj.worldToLocal(W_center.clone());

    for (const child of obj.children) {
      child.position.sub(C_O);
      child.updateMatrix();
    }

    if (obj instanceof Mesh && obj.geometry) {
      obj.geometry.translate(-C_O.x, -C_O.y, -C_O.z);
    }

    const newPos = obj.parent
      ? obj.parent.worldToLocal(W_center.clone())
      : W_center.clone();
    obj.position.copy(newPos);
    obj.updateMatrix();
    obj.updateMatrixWorld(true);

    const p: Vec3 = [obj.position.x, obj.position.y, obj.position.z];
    updateNode(selectedUuid, { position: p });
    setPos(p);
  };

  const isImagePlane = node.type === "ImagePlane";

  const transforms = (
    <>
      <Vec3Section
        label="Position"
        values={pos}
        onAxisChange={handlePos}
        onCommit={commitPos}
        step={0.1}
        format={POS_FORMAT}
      />
      <Vec3Section
        label="Rotation"
        values={rot}
        onAxisChange={handleRot}
        onCommit={commitRot}
        step={1}
        format={ROT_FORMAT}
      />
      <Vec3Section
        label="Scale"
        values={scale}
        onAxisChange={handleScale}
        onCommit={commitScale}
        step={0.01}
        format={SCALE_FORMAT}
      />
    </>
  );

  return (
    <aside className="absolute right-4 top-4 z-10 w-56 flex flex-col rounded-xl border border-border bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden max-h-[calc(100%-2rem)]">
      <div className="px-3 py-2 border-b border-border shrink-0">
        <p className="text-sm font-medium text-foreground truncate">
          {node.name}
        </p>
        <p className="text-xs text-muted-foreground">{node.type}</p>
      </div>
      <div className="min-h-0 overflow-y-auto p-3 space-y-4">
        {transforms}
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

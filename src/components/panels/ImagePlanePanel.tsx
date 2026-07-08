import { type ImagePlaneNode } from "@/store/sceneStore";
import { useNodeTransform } from "@/hooks/useNodeTransform";
import { Panel } from "./Panel";

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

export function ImagePlanePanel({ node }: { node: ImagePlaneNode }) {
  const {
    pos,
    rot,
    scale,
    handlePos,
    handleRot,
    handleScale,
    commitPos,
    commitRot,
    commitScale,
  } = useNodeTransform();

  return (
    <Panel>
      <Panel.Header>
        <Panel.Title>{node.name}</Panel.Title>
        <Panel.Description>{node.type}</Panel.Description>
      </Panel.Header>
      <Panel.Body>
        <Panel.Vec3>
          <Panel.Vec3.Label>Position</Panel.Vec3.Label>
          {AXES.map((axis, i) => (
            <Panel.Vec3.Field
              key={axis}
              label={axis}
              value={pos[i]}
              onChange={(val) => handlePos(i as 0 | 1 | 2, val)}
              onCommit={commitPos}
              step={0.1}
              format={POS_FORMAT}
            />
          ))}
        </Panel.Vec3>
        <Panel.Vec3>
          <Panel.Vec3.Label>Rotation</Panel.Vec3.Label>
          {AXES.map((axis, i) => (
            <Panel.Vec3.Field
              key={axis}
              label={axis}
              value={rot[i]}
              onChange={(val) => handleRot(i as 0 | 1 | 2, val)}
              onCommit={commitRot}
              step={1}
              format={ROT_FORMAT}
            />
          ))}
        </Panel.Vec3>
        <Panel.Vec3>
          <Panel.Vec3.Label>Scale</Panel.Vec3.Label>
          {AXES.map((axis, i) => (
            <Panel.Vec3.Field
              key={axis}
              label={axis}
              value={scale[i]}
              onChange={(val) => handleScale(i as 0 | 1 | 2, val)}
              onCommit={commitScale}
              step={0.01}
              format={SCALE_FORMAT}
            />
          ))}
        </Panel.Vec3>
      </Panel.Body>
    </Panel>
  );
}

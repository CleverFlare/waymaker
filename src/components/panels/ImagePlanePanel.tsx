import { type ImagePlaneNode } from "@/store/sceneStore";
import { useNodeTransform } from "@/hooks/useNodeTransform";
import { useImagePlaneMode } from "@/hooks/useImagePlaneMode";
import { Button } from "@/components/ui/button";
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
  const { pos, rot, scale, handlePos, handleRot, handleScale, commitPos, commitRot, commitScale } =
    useNodeTransform();
  const {
    billboard,
    sizeAttenuation,
    cameraRot,
    cameraScale,
    toggleBillboard,
    toggleSizeAttenuation,
    handleCameraRot,
    commitCameraRot,
    handleCameraScale,
    commitCameraScale,
  } = useImagePlaneMode();

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

        <Panel.Row>
          <Panel.Row.Label>Billboard</Panel.Row.Label>
          <Button
            variant={billboard ? "default" : "outline"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={toggleBillboard}
          >
            {billboard ? "On" : "Off"}
          </Button>
        </Panel.Row>

        <div className={billboard ? "opacity-40 pointer-events-none" : ""}>
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
        </div>

        <div className={!billboard ? "opacity-40 pointer-events-none" : ""}>
          <Panel.Vec3>
            <Panel.Vec3.Label>Camera Rotation</Panel.Vec3.Label>
            {AXES.map((axis, i) => (
              <Panel.Vec3.Field
                key={axis}
                label={axis}
                value={cameraRot[i]}
                onChange={(val) => handleCameraRot(i as 0 | 1 | 2, val)}
                onCommit={commitCameraRot}
                step={1}
                format={ROT_FORMAT}
              />
            ))}
          </Panel.Vec3>
        </div>

        <Panel.Row>
          <Panel.Row.Label>Size Attenuation</Panel.Row.Label>
          <Button
            variant={sizeAttenuation ? "default" : "outline"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={toggleSizeAttenuation}
          >
            {sizeAttenuation ? "On" : "Off"}
          </Button>
        </Panel.Row>

        <div className={sizeAttenuation ? "opacity-40 pointer-events-none" : ""}>
          <Panel.Vec3>
            <Panel.Vec3.Label>Scale</Panel.Vec3.Label>
            {["X", "Y"].map((axis, i) => (
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
        </div>

        <div className={!sizeAttenuation ? "opacity-40 pointer-events-none" : ""}>
          <Panel.Vec3>
            <Panel.Vec3.Label>Camera Scale</Panel.Vec3.Label>
            {["X", "Y"].map((axis, i) => (
              <Panel.Vec3.Field
                key={axis}
                label={axis}
                value={cameraScale[i]}
                onChange={(val) => handleCameraScale(i as 0 | 1 | 2, val)}
                onCommit={commitCameraScale}
                step={0.001}
                format={SCALE_FORMAT}
              />
            ))}
          </Panel.Vec3>
        </div>
      </Panel.Body>
    </Panel>
  );
}

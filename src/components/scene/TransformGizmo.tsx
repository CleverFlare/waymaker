import { useThree } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import { Euler, MathUtils, PerspectiveCamera, Quaternion } from "three";
import {
  useSceneStore,
  type ImagePlaneNode,
  type SceneNode,
  type Vec3,
} from "@/store/sceneStore";
import { eventBus } from "@/lib/eventBus";
import { gizmoInteracting } from "@/lib/gizmoInteracting";

const TOOL_TO_MODE = {
  move: "translate",
  rotate: "rotate",
  resize: "scale",
} as const;

const _invCamQuat = new Quaternion();
const _offsetEuler = new Euler();

export function TransformGizmo() {
  const selectedUuid = useSceneStore((s) => s.selectedUuid);
  const activeTool = useSceneStore((s) => s.activeTool);
  const nodes = useSceneStore((s) => s.nodes);
  const getObject = useSceneStore((s) => s.getObject);
  const updateNode = useSceneStore((s) => s.updateNode);
  const { controls, camera } = useThree();

  if (!selectedUuid || activeTool === "select") return null;

  const node = nodes[selectedUuid];
  const object = getObject(selectedUuid);
  if (!node || !object) return null;

  const ipNode = node.type === "ImagePlane" ? (node as ImagePlaneNode) : null;
  const mode = TOOL_TO_MODE[activeTool as keyof typeof TOOL_TO_MODE];

  const extractCameraRot = (): Vec3 => {
    _invCamQuat.copy(camera.quaternion).invert();
    _invCamQuat.multiply(object.quaternion);
    _offsetEuler.setFromQuaternion(_invCamQuat);
    return [_offsetEuler.x, _offsetEuler.y, _offsetEuler.z];
  };

  const extractCameraScale = (): Vec3 => {
    const dist = camera.position.distanceTo(object.position);
    const fov = camera instanceof PerspectiveCamera ? camera.fov : 50;
    const factor = dist * 2 * Math.tan(MathUtils.degToRad(fov / 2));
    return [object.scale.x / factor, object.scale.y / factor, 1];
  };

  return (
    <TransformControls
      key={selectedUuid}
      object={object}
      mode={mode}
      space="world"
      onMouseDown={() => {
        gizmoInteracting.current = true;
        if (controls)
          (controls as unknown as { enabled: boolean }).enabled = false;
      }}
      onMouseUp={() => {
        gizmoInteracting.current = false;
        if (controls)
          (controls as unknown as { enabled: boolean }).enabled = true;

        if (ipNode?.billboard && activeTool === "rotate") {
          updateNode(selectedUuid, {
            cameraRotation: extractCameraRot(),
          } as Partial<SceneNode>);
        } else if (ipNode?.sizeAttenuation && activeTool === "resize") {
          updateNode(selectedUuid, {
            cameraScale: extractCameraScale(),
          } as Partial<SceneNode>);
        } else {
          updateNode(selectedUuid, {
            position: [object.position.x, object.position.y, object.position.z],
            rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
            scale: [object.scale.x, object.scale.y, object.scale.z],
          });
        }
      }}
      onChange={() => {
        if (ipNode?.billboard && activeTool === "rotate") {
          eventBus.emit("imagePlane", {
            uuid: selectedUuid,
            cameraRotation: extractCameraRot(),
            cameraScale: ipNode.cameraScale,
          });
        } else if (ipNode?.sizeAttenuation && activeTool === "resize") {
          eventBus.emit("imagePlane", {
            uuid: selectedUuid,
            cameraRotation: ipNode.cameraRotation,
            cameraScale: extractCameraScale(),
          });
        } else {
          eventBus.emit("transform", {
            uuid: selectedUuid,
            position: [object.position.x, object.position.y, object.position.z],
            rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
            scale: [object.scale.x, object.scale.y, object.scale.z],
          });
        }
      }}
    />
  );
}

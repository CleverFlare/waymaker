import { useThree } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import { useSceneStore } from "@/store/sceneStore";
import { eventBus } from "@/lib/eventBus";
import { gizmoInteracting } from "@/lib/gizmoInteracting";

const TOOL_TO_MODE = {
  move: "translate",
  rotate: "rotate",
  resize: "scale",
} as const;

export function TransformGizmo() {
  const selectedUuid = useSceneStore((s) => s.selectedUuid);
  const activeTool = useSceneStore((s) => s.activeTool);
  const nodes = useSceneStore((s) => s.nodes);
  const getObject = useSceneStore((s) => s.getObject);
  const updateNode = useSceneStore((s) => s.updateNode);
  const { controls } = useThree();

  if (!selectedUuid || activeTool === "select") return null;

  const node = nodes[selectedUuid];
  const object = getObject(selectedUuid);
  if (!node || !object) return null;

  const mode = TOOL_TO_MODE[activeTool as keyof typeof TOOL_TO_MODE];

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
        updateNode(selectedUuid, {
          position: [object.position.x, object.position.y, object.position.z],
          rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
          scale: [object.scale.x, object.scale.y, object.scale.z],
        });
      }}
      onChange={() => {
        eventBus.emit("transform", {
          uuid: selectedUuid,
          position: [object.position.x, object.position.y, object.position.z],
          rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
          scale: [object.scale.x, object.scale.y, object.scale.z],
        });
      }}
    />
  );
}

import { useEffect, useRef, useState } from "react";
import { Box3, MathUtils, Mesh, Vector3 } from "three";
import { useSceneStore, type Vec3 } from "@/store/sceneStore";
import { eventBus } from "@/lib/eventBus";

export function useNodeTransform() {
  const selectedUuid = useSceneStore((s) => s.selectedUuid);
  const node = useSceneStore((s) => s.nodes[selectedUuid ?? ""] ?? null);
  const getObject = useSceneStore((s) => s.getObject);
  const updateNode = useSceneStore((s) => s.updateNode);

  const [pos, setPos] = useState<Vec3>([0, 0, 0]);
  const [rot, setRot] = useState<Vec3>([0, 0, 0]);
  const [scale, setScale] = useState<Vec3>([1, 1, 1]);

  const selectedUuidRef = useRef(selectedUuid);
  selectedUuidRef.current = selectedUuid;

  useEffect(() => {
    if (!node) return;
    setPos(node.position);
    setRot(node.rotation.map(MathUtils.radToDeg) as Vec3);
    setScale(node.scale);
  }, [selectedUuid]);

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

  const keys = ["x", "y", "z"] as const;

  const handlePos = (axis: 0 | 1 | 2, val: number) => {
    if (!selectedUuid) return;
    const obj = getObject(selectedUuid);
    if (!obj) return;
    obj.position[keys[axis]] = val;
    setPos((prev) => {
      const n = [...prev] as Vec3;
      n[axis] = val;
      return n;
    });
  };

  const handleRot = (axis: 0 | 1 | 2, val: number) => {
    if (!selectedUuid) return;
    const obj = getObject(selectedUuid);
    if (!obj) return;
    obj.rotation[keys[axis]] = MathUtils.degToRad(val);
    setRot((prev) => {
      const n = [...prev] as Vec3;
      n[axis] = val;
      return n;
    });
  };

  const handleScale = (axis: 0 | 1 | 2, val: number) => {
    if (!selectedUuid) return;
    const obj = getObject(selectedUuid);
    if (!obj) return;
    obj.scale[keys[axis]] = val;
    setScale((prev) => {
      const n = [...prev] as Vec3;
      n[axis] = val;
      return n;
    });
  };

  const commitPos = () => {
    if (!selectedUuid) return;
    const obj = getObject(selectedUuid);
    if (!obj) return;
    updateNode(selectedUuid, {
      position: [obj.position.x, obj.position.y, obj.position.z],
    });
  };

  const commitRot = () => {
    if (!selectedUuid) return;
    const obj = getObject(selectedUuid);
    if (!obj) return;
    updateNode(selectedUuid, {
      rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
    });
  };

  const commitScale = () => {
    if (!selectedUuid) return;
    const obj = getObject(selectedUuid);
    if (!obj) return;
    updateNode(selectedUuid, {
      scale: [obj.scale.x, obj.scale.y, obj.scale.z],
    });
  };

  const handleCenterPivot = () => {
    if (!selectedUuid) return;
    const obj = getObject(selectedUuid);
    if (!obj) return;

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

  return {
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
  };
}

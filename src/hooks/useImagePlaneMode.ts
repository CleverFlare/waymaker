import { useEffect, useRef, useState } from "react";
import { MathUtils } from "three";
import {
  useSceneStore,
  type Vec3,
  type ImagePlaneNode,
  type SceneNode,
} from "@/store/sceneStore";
import { eventBus } from "@/lib/eventBus";

export function useImagePlaneMode() {
  const selectedUuid = useSceneStore((s) => s.selectedUuid);
  const node = useSceneStore((s) => {
    const n = s.nodes[selectedUuid ?? ""];
    return n?.type === "ImagePlane" ? (n as ImagePlaneNode) : null;
  });
  const updateNode = useSceneStore((s) => s.updateNode);

  const [billboard, setBillboard] = useState(false);
  const [sizeAttenuation, setSizeAttenuation] = useState(false);
  const [cameraRot, setCameraRot] = useState<Vec3>([0, 0, 0]); // degrees for display
  const [cameraScale, setCameraScale] = useState<Vec3>([0.1, 0.1, 1]);

  const selectedUuidRef = useRef(selectedUuid);
  selectedUuidRef.current = selectedUuid;

  useEffect(() => {
    if (!node) return;
    setBillboard(node.billboard);
    setSizeAttenuation(node.sizeAttenuation);
    setCameraRot(node.cameraRotation.map(MathUtils.radToDeg) as Vec3);
    setCameraScale(node.cameraScale);
  }, [selectedUuid]);

  useEffect(() => {
    const handler = ({
      uuid,
      cameraRotation,
      cameraScale,
    }: {
      uuid: string;
      cameraRotation: Vec3;
      cameraScale: Vec3;
    }) => {
      if (uuid !== selectedUuidRef.current) return;
      setCameraRot(cameraRotation.map(MathUtils.radToDeg) as Vec3);
      setCameraScale(cameraScale);
    };
    eventBus.on("imagePlane", handler);
    return () => eventBus.off("imagePlane", handler);
  }, []);

  const toggleBillboard = () => {
    if (!selectedUuid) return;
    const next = !billboard;
    setBillboard(next);
    updateNode(selectedUuid, { billboard: next } as Partial<SceneNode>);
  };

  const toggleSizeAttenuation = () => {
    if (!selectedUuid) return;
    const next = !sizeAttenuation;
    setSizeAttenuation(next);
    updateNode(selectedUuid, { sizeAttenuation: next } as Partial<SceneNode>);
  };

  const handleCameraRot = (axis: 0 | 1 | 2, val: number) => {
    const next = [...cameraRot] as Vec3;
    next[axis] = val;
    setCameraRot(next);
    if (!selectedUuid) return;
    eventBus.emit("imagePlane", {
      uuid: selectedUuid,
      cameraRotation: next.map(MathUtils.degToRad) as Vec3,
      cameraScale,
    });
  };

  const commitCameraRot = () => {
    if (!selectedUuid) return;
    updateNode(selectedUuid, {
      cameraRotation: cameraRot.map(MathUtils.degToRad) as Vec3,
    } as Partial<SceneNode>);
  };

  const handleCameraScale = (axis: 0 | 1 | 2, val: number) => {
    const next = [...cameraScale] as Vec3;
    next[axis] = val;
    setCameraScale(next);
    if (!selectedUuid) return;
    eventBus.emit("imagePlane", {
      uuid: selectedUuid,
      cameraRotation: cameraRot.map(MathUtils.degToRad) as Vec3,
      cameraScale: next,
    });
  };

  const commitCameraScale = () => {
    if (!selectedUuid) return;
    updateNode(selectedUuid, { cameraScale } as Partial<SceneNode>);
  };

  return {
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
  };
}

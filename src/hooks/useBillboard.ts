import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Euler, Mesh, Quaternion } from "three";
import { type ImagePlaneNode, useSceneStore, type Vec3 } from "@/store/sceneStore";
import { eventBus } from "@/lib/eventBus";
import { gizmoInteracting } from "@/lib/gizmoInteracting";

const _euler = new Euler();
const _offsetQuat = new Quaternion();

export function useBillboard(mesh: Mesh, uuid: string) {
  const cameraRotRef = useRef<Vec3>([0, 0, 0]);
  const prevBillboard = useRef(false);

  useEffect(() => {
    const node = useSceneStore.getState().nodes[uuid] as ImagePlaneNode | undefined;
    if (node?.type === "ImagePlane") cameraRotRef.current = node.cameraRotation;
  }, [uuid]);

  useEffect(() => {
    const handler = ({ uuid: id, cameraRotation }: { uuid: string; cameraRotation: Vec3; cameraScale: Vec3 }) => {
      if (id !== uuid) return;
      cameraRotRef.current = cameraRotation; // radians
    };
    eventBus.on("imagePlane", handler);
    return () => eventBus.off("imagePlane", handler);
  }, [uuid]);

  useFrame(({ camera }) => {
    const node = useSceneStore.getState().nodes[uuid] as ImagePlaneNode | undefined;
    if (!node || node.type !== "ImagePlane") return;

    if (node.billboard) {
      if (!gizmoInteracting.current) {
        const [rx, ry, rz] = cameraRotRef.current;
        _euler.set(rx, ry, rz);
        _offsetQuat.setFromEuler(_euler);
        mesh.quaternion.copy(camera.quaternion).multiply(_offsetQuat);
      }
    } else if (prevBillboard.current) {
      mesh.rotation.set(node.rotation[0], node.rotation[1], node.rotation[2]);
    }

    prevBillboard.current = node.billboard;
  });
}

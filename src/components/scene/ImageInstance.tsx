import { useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useSceneStore, createImagePlaneNode } from "@/store/sceneStore";
import { useBillboard } from "@/hooks/useBillboard";
import { useSizeAttenuation } from "@/hooks/useSizeAttenuation";

interface ImageInstanceProps {
  url: string;
  name: string;
}

export function ImageInstance({ url, name }: ImageInstanceProps) {
  const texture = useTexture(url);
  const addModel = useSceneStore((s) => s.addModel);
  const removeNode = useSceneStore((s) => s.removeNode);
  const registerObject = useSceneStore((s) => s.registerObject);
  const unregisterObject = useSceneStore((s) => s.unregisterObject);

  const mesh = useMemo(() => {
    const w =
      ((texture.image as Record<string, unknown>)?.width as number) || 1;
    const h =
      ((texture.image as Record<string, unknown>)?.height as number) || 1;
    const max = Math.max(w, h);
    const geo = new THREE.PlaneGeometry(w / max, h / max);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
  }, [texture]);

  useEffect(() => {
    mesh.name = name;
    addModel({ [mesh.uuid]: createImagePlaneNode(mesh.uuid, name) }, mesh.uuid);
    registerObject(mesh.uuid, mesh);
    return () => {
      removeNode(mesh.uuid);
      unregisterObject(mesh.uuid);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    };
  }, [mesh, name]);

  useBillboard(mesh, mesh.uuid);
  useSizeAttenuation(mesh, mesh.uuid);

  return <primitive object={mesh} />;
}

import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useSceneStore } from "@/store/sceneStore";
import { flattenScene } from "@/lib/scene";

interface ModelInstanceProps {
  url: string;
}

export function ModelInstance({ url }: ModelInstanceProps) {
  const { scene } = useGLTF(url);
  const addModel = useSceneStore((s) => s.addModel);
  const removeNode = useSceneStore((s) => s.removeNode);
  const registerObject = useSceneStore((s) => s.registerObject);
  const unregisterObject = useSceneStore((s) => s.unregisterObject);
  const rootUuidRef = useRef<string | null>(null);

  useEffect(() => {
    const { rootUuid, nodes } = flattenScene(scene);
    rootUuidRef.current = rootUuid;
    addModel(nodes, rootUuid);
    scene.traverse((obj) => registerObject(obj.uuid, obj));

    return () => {
      if (rootUuidRef.current) removeNode(rootUuidRef.current);
      scene.traverse((obj) => unregisterObject(obj.uuid));
    };
  }, [scene]);

  return <primitive object={scene} position={[0, 0, 0]} />;
}

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useSceneStore } from "@/store/sceneStore";
import { flattenScene } from "@/lib/scene";

interface ModelInstanceProps {
  id: string;
  url: string;
}

export function ModelInstance({ id, url }: ModelInstanceProps) {
  const { scene } = useGLTF(url);
  const addModel = useSceneStore((s) => s.addModel);
  const removeModel = useSceneStore((s) => s.removeModel);
  const registerObject = useSceneStore((s) => s.registerObject);
  const unregisterObject = useSceneStore((s) => s.unregisterObject);

  useEffect(() => {
    const { rootUuid, nodes } = flattenScene(scene);
    addModel(id, nodes, rootUuid);
    scene.traverse((obj) => registerObject(obj.uuid, obj));

    return () => {
      removeModel(id);
      scene.traverse((obj) => unregisterObject(obj.uuid));
    };
  }, [scene, id]);

  return <primitive object={scene} position={[0, 0, 0]} />;
}

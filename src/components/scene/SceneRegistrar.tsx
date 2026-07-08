import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useSceneStore } from "@/store/sceneStore";
import { SCENE_ROOT_ID } from "@/lib/scene";

export function SceneRegistrar() {
  const threeScene = useThree((s) => s.scene);
  const registerObject = useSceneStore((s) => s.registerObject);
  const unregisterObject = useSceneStore((s) => s.unregisterObject);

  useEffect(() => {
    registerObject(SCENE_ROOT_ID, threeScene);
    return () => unregisterObject(SCENE_ROOT_ID);
  }, [threeScene]);

  return null;
}

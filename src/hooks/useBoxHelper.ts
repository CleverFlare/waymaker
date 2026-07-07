import { useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxHelper, type Object3D } from "three";

export function useBoxHelper(
  object: Object3D | null,
  color = 0xffff00,
): BoxHelper | null {
  const [boxHelper, setBoxHelper] = useState<BoxHelper | null>(null);

  useEffect(() => {
    if (!object) {
      setBoxHelper(null);
      return;
    }
    const helper = new BoxHelper(object, color);
    helper.material.depthTest = false;
    helper.material.depthWrite = false;
    helper.material.transparent = true;
    helper.renderOrder = 1;
    setBoxHelper(helper);
    return () => setBoxHelper(null);
  }, [object, color]);

  useFrame(() => boxHelper?.update());

  return boxHelper;
}

import { useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Sprite,
  SpriteMaterial,
  TextureLoader,
  Vector3,
  type Object3D,
} from "three";
import pivotPointPng from "@/assets/pivot-point.png?url";

const _worldPos = new Vector3();

export function usePivotSprite(object: Object3D | null): Sprite | null {
  const [sprite, setSprite] = useState<Sprite | null>(null);

  useEffect(() => {
    if (!object) {
      setSprite(null);
      return;
    }

    // 1. Initialize loader and load texture INSIDE the lifecycle
    const loader = new TextureLoader();
    const texture = loader.load(pivotPointPng, (loadedTexture) => {
      // Windows WebGPU requirement: flag it for recalculation once it arrives
      loadedTexture.needsUpdate = true;
    });

    const mat = new SpriteMaterial({
      map: texture,
      sizeAttenuation: false,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

    const s = new Sprite(mat);
    s.scale.setScalar(0.02);
    s.renderOrder = 2;
    setSprite(s);

    return () => {
      setSprite(null);
      mat.dispose();
      texture.dispose(); // Always clean up textures to avoid GPU memory leaks!
    };
  }, [object]);

  useFrame(() => {
    if (!sprite || !object) return;
    object.getWorldPosition(_worldPos);
    sprite.position.copy(_worldPos);
  });

  return sprite;
}

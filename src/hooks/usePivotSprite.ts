import { useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  MultiplyBlending,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  Vector3,
  type Object3D,
} from "three";

const _worldPos = new Vector3();
const pivotTexture = new TextureLoader().load("/pivot-point.png");

export function usePivotSprite(object: Object3D | null): Sprite | null {
  const [sprite, setSprite] = useState<Sprite | null>(null);

  useEffect(() => {
    if (!object) {
      setSprite(null);
      return;
    }
    const mat = new SpriteMaterial({
      map: pivotTexture,
      sizeAttenuation: false,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      blending: MultiplyBlending,
    });
    const s = new Sprite(mat);
    s.scale.setScalar(0.02);
    s.renderOrder = 2;
    setSprite(s);
    return () => {
      setSprite(null);
      mat.dispose();
    };
  }, [object]);

  useFrame(() => {
    if (!sprite || !object) return;
    object.getWorldPosition(_worldPos);
    sprite.position.copy(_worldPos);
  });

  return sprite;
}

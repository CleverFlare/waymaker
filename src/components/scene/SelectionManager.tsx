import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Vector2 } from "three";
import { useSceneStore } from "@/store/sceneStore";
import { useDragGuard } from "@/hooks/useDragGuard";
import { useBoxHelper } from "@/hooks/useBoxHelper";
import { usePivotSprite } from "@/hooks/usePivotSprite";
import { gizmoInteracting } from "@/lib/gizmoInteracting";

export function SelectionManager() {
  const { scene, camera, raycaster, gl } = useThree();
  const selectNode = useSceneStore((s) => s.selectNode);
  const selectedUuid = useSceneStore((s) => s.selectedUuid);
  const getObject = useSceneStore((s) => s.getObject);
  const nodes = useSceneStore((s) => s.nodes);
  const { onPointerDown, wasDrag } = useDragGuard(5);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  useEffect(() => {
    const canvas = gl.domElement;

    const handleClick = (e: MouseEvent) => {
      if (wasDrag(e)) return;
      if (gizmoInteracting.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new Vector2(x, y), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const hit = intersects.find((i) => nodesRef.current[i.object.uuid]);
      selectNode(hit ? hit.object.uuid : null);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("click", handleClick);
    };
  }, [scene, camera, raycaster, gl, onPointerDown, wasDrag, selectNode]);

  const selectedObject = selectedUuid ? getObject(selectedUuid) : null;
  const boxHelper = useBoxHelper(selectedObject ?? null);
  const pivotSprite = usePivotSprite(selectedObject ?? null);

  return (
    <>
      {boxHelper && <primitive object={boxHelper} />}
      {pivotSprite && <primitive object={pivotSprite} />}
    </>
  );
}

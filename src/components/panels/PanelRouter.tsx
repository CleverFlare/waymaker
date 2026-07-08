import { type ReactElement } from "react";
import { useSceneStore, type SceneNode, type ImagePlaneNode } from "@/store/sceneStore";
import { DefaultPanel } from "./DefaultPanel";
import { ImagePlanePanel } from "./ImagePlanePanel";

const PANELS: Partial<Record<string, (node: SceneNode) => ReactElement>> = {
  ImagePlane: (node) => <ImagePlanePanel node={node as ImagePlaneNode} />,
};

export function PanelRouter() {
  const selectedUuid = useSceneStore((s) => s.selectedUuid);
  const node = useSceneStore((s) => s.nodes[selectedUuid ?? ""] ?? null);

  if (!selectedUuid || !node) return null;

  const render = PANELS[node.type];
  return render ? render(node) : <DefaultPanel node={node} />;
}

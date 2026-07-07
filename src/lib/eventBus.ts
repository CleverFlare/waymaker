import mitt from "mitt";
import type { Vec3 } from "@/store/sceneStore";

type Events = {
  transform: { uuid: string; position: Vec3; rotation: Vec3; scale: Vec3 };
};

export const eventBus = mitt<Events>();

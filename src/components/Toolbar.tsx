import { Move, MousePointer2, RotateCw, Scaling } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSceneStore, type Tool } from "@/store/sceneStore";

const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select", icon: <MousePointer2 /> },
  { id: "move", label: "Move", icon: <Move /> },
  { id: "rotate", label: "Rotate", icon: <RotateCw /> },
  { id: "resize", label: "Resize", icon: <Scaling /> },
];

export function Toolbar() {
  const activeTool = useSceneStore((s) => s.activeTool);
  const setActiveTool = useSceneStore((s) => s.setActiveTool);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-xl border border-border bg-background/80 p-1.5 shadow-lg backdrop-blur-sm">
      {tools.map(({ id, label, icon }) => (
        <Tooltip key={id}>
          <TooltipTrigger
            render={
              <Button
                variant={activeTool === id ? "default" : "outline"}
                size="icon-lg"
                onClick={() => setActiveTool(id)}
                aria-pressed={activeTool === id}
              >
                {icon}
              </Button>
            }
          />
          <TooltipContent side="top">{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

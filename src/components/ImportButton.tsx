import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImportButtonProps {
  onImport: (files: FileList) => void;
  className?: string;
}

export function ImportButton({ onImport, className }: ImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".glb,.gltf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onImport(e.target.files);
          e.target.value = "";
        }}
      />
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-2", className)}
        onClick={() => inputRef.current?.click()}
      >
        <Upload />
        Import
      </Button>
    </>
  );
}

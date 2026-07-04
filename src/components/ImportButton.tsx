import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportButtonProps {
  onImport: (files: FileList) => void;
}

export function ImportButton({ onImport }: ImportButtonProps) {
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
        className="absolute top-4 left-4 gap-2"
        onClick={() => inputRef.current?.click()}
      >
        <Upload />
        Import
      </Button>
    </>
  );
}

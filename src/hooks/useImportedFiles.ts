import { useEffect, useState } from "react";

const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

export interface SceneModel {
  id: string;
  url: string;
}

export interface SceneImage {
  id: string;
  url: string;
  name: string;
}

export function useImportedFiles() {
  const [models, setModels] = useState<SceneModel[]>([]);
  const [images, setImages] = useState<SceneImage[]>([]);

  useEffect(() => {
    return window.electronAPI.onImportFiles((files) => {
      for (const { name, buffer } of files) {
        const url = URL.createObjectURL(new Blob([buffer]));
        if (IMAGE_EXT.test(name)) {
          setImages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              url,
              name: name.replace(/\.[^.]+$/, ""),
            },
          ]);
        } else {
          setModels((prev) => [...prev, { id: crypto.randomUUID(), url }]);
        }
      }
    });
  }, []);

  return { models, images };
}

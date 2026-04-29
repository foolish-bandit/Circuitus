import { useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

interface DraftDiagramProps {
  initialJson: string;
  onChange: (json: string) => void;
}

interface ExcalidrawSnapshot {
  elements: readonly unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
}

const SAVE_DEBOUNCE_MS = 600;

export default function DraftDiagram({ initialJson, onChange }: DraftDiagramProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  let initialData: ExcalidrawSnapshot | null = null;
  if (initialJson) {
    try {
      initialData = JSON.parse(initialJson) as ExcalidrawSnapshot;
    } catch {
      initialData = null;
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="w-full h-full">
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api;
        }}
        initialData={
          initialData
            ? {
                elements: initialData.elements as never,
                appState: initialData.appState as never,
                files: initialData.files as never,
              }
            : undefined
        }
        onChange={(elements, appState, files) => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            const snapshot: ExcalidrawSnapshot = {
              elements: elements as readonly unknown[],
              appState: { viewBackgroundColor: appState.viewBackgroundColor },
              files: files as Record<string, unknown>,
            };
            onChange(JSON.stringify(snapshot));
          }, SAVE_DEBOUNCE_MS);
        }}
      />
    </div>
  );
}

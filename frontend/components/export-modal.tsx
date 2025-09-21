"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { exportToSvg, exportToBlob } from "@excalidraw/excalidraw";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  fileId: string;
  excalidrawRef: React.MutableRefObject<any>;
}

export function ExportModal({ open, onOpenChange, code, fileId, excalidrawRef }: ExportModalProps) {
  const [exportType, setExportType] = useState<"both" | "image" | "code">("both");
  const [imageFormat, setImageFormat] = useState<"png" | "svg">("png");
  const [backgroundTransparent, setBackgroundTransparent] = useState(false);

  async function handleExport() {
    if (exportType === "code" || exportType === "both") {
      const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `file-${fileId}.txt`;
      link.click();
    }

    if (exportType === "image" || exportType === "both") {
      if (!excalidrawRef.current) return;
      const elements = excalidrawRef.current.getSceneElements();
      const appState = excalidrawRef.current.getAppState();
      const files = excalidrawRef.current.getFiles();

      if (imageFormat === "svg") {
        const svg = await exportToSvg({
          elements,
          appState: {
            ...appState,
            exportBackground: !backgroundTransparent,
            viewBackgroundColor: backgroundTransparent
              ? "transparent"
              : appState.viewBackgroundColor,
          },
          files,
        });
        const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `file-${fileId}.svg`;
        link.click();
      } else {
        const blob = await exportToBlob({
          elements,
          appState: {
            ...appState,
            exportBackground: !backgroundTransparent,
            viewBackgroundColor: backgroundTransparent
              ? "transparent"
              : appState.viewBackgroundColor,
          },
          files,
          mimeType: "image/png",
          quality: 1,
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `file-${fileId}.png`;
        link.click();
      }
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Export Type</p>
            <div className="flex gap-4 mt-2">
              <label>
                <input
                  type="radio"
                  checked={exportType === "both"}
                  onChange={() => setExportType("both")}
                />{" "}
                Both
              </label>
              <label>
                <input
                  type="radio"
                  checked={exportType === "image"}
                  onChange={() => setExportType("image")}
                />{" "}
                Image Only
              </label>
              <label>
                <input
                  type="radio"
                  checked={exportType === "code"}
                  onChange={() => setExportType("code")}
                />{" "}
                Code Only
              </label>
            </div>
          </div>

          {(exportType === "image" || exportType === "both") && (
            <>
              <div>
                <p className="text-sm font-medium">Image Format</p>
                <div className="flex gap-4 mt-2">
                  <label>
                    <input
                      type="radio"
                      checked={imageFormat === "png"}
                      onChange={() => setImageFormat("png")}
                    />{" "}
                    PNG
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={imageFormat === "svg"}
                      onChange={() => setImageFormat("svg")}
                    />{" "}
                    SVG
                  </label>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mt-4">Background</p>
                <div className="flex gap-4 mt-2">
                  <label>
                    <input
                      type="radio"
                      checked={!backgroundTransparent}
                      onChange={() => setBackgroundTransparent(false)}
                    />{" "}
                    Default
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={backgroundTransparent}
                      onChange={() => setBackgroundTransparent(true)}
                    />{" "}
                    Transparent
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button className="cursor-pointer" onClick={handleExport}>
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

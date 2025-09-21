"use client";

import dynamic from "next/dynamic";
import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { fetchFile, updateFile } from "@/lib/api";
import { PanelRightClose, PanelRightOpen, Save, Download } from "lucide-react";
import "@excalidraw/excalidraw/index.css";
import Loading from "@/components/loader";
import { useParams } from "next/navigation";
import { exportToSvg, exportToBlob } from "@excalidraw/excalidraw";
import { ExportModal } from "@/components/export-modal";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

export default function FilePage() {

  const excalidrawRef = useRef<any>(null);
  const whiteboardRef = useRef<any>(null);

  const { workspaceId, fileId } = useParams() as {
    workspaceId: string;
    fileId: string;
  };

  const [savedCode, setSavedCode] = useState<string>("");
  const [code, setCode] = useState("");
  const [showEditor, setShowEditor] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [fileLoaded, setFileLoaded] = useState(false);
  const fullyLoaded = fileLoaded;

  const [icons, setIcons] = useState<string[]>([]);
  const iconsRef = useRef<string[]>([]);
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const providerDisposableRef = useRef<{ dispose: () => void } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadFileAndIcons() {
      try {
        const f = await fetchFile(workspaceId, fileId);
        if (!isMounted) return;

        const state = f.whiteboard_state || {};
        whiteboardRef.current = {
          elements: state.elements || [],
          appState: { ...state.appState, collaborators: new Map() },
          files: state.files || {},
        };

        const initialCode = f.code_content || "";
        setCode(initialCode);
        setSavedCode(initialCode);
        setLastUpdated(f.updated_at);
        setFileLoaded(true);

        const res = await fetch("/api/icons");
        if (!res.ok) throw new Error("Failed to load icons");
        const data: string[] = await res.json();

        setIcons(data);
        iconsRef.current = data;

        if (editorRef.current) {
          editorRef.current.trigger("keyboard", "editor.action.triggerSuggest", {});
        }
      } catch {
        if (!isMounted) return;
        setIcons([]);
        iconsRef.current = [];
      }
    }

    loadFileAndIcons();

    return () => {
      isMounted = false;
      if (providerDisposableRef.current) {
        providerDisposableRef.current.dispose();
        providerDisposableRef.current = null;
      }
    };
  }, [workspaceId, fileId]);

  async function save() {
    const currentState = whiteboardRef.current;

    let payload: any = {};
    if (code !== savedCode) {
      payload.code_content = code;
    } else {
      payload.whiteboard_state = currentState;
    }

    const updated = await updateFile(workspaceId, fileId, payload);

    if (payload.code_content && excalidrawRef.current) {
      const state = updated.whiteboard_state || { elements: [], files: {}, appState: {} };
      excalidrawRef.current.updateScene(state);
      if (state.files) {
        excalidrawRef.current.addFiles(Object.values(state.files));
      }
    }

    setLastUpdated(updated.updated_at);
    setSavedCode(code);
  }

  function handleEditorBeforeMount(monaco: any) {
    monaco.languages.register({ id: "diagramdsl" });

    monaco.languages.setMonarchTokensProvider("diagramdsl", {
      tokenizer: {
        root: [
          [/\/\/.*/, "comment"],

          [/(icon)(\s*:)(\s*[a-zA-Z0-9_-]+)/, ["special.attr", "colon", "special.value"]],
          [/(color)(\s*:)(\s*[a-zA-Z0-9_-]+)/, ["special.attr", "colon", "special.value"]],

          [/^[ \t]*[A-Za-z0-9_() ]+(?=\s*\[)/, "node.name"],
          [/[A-Za-z0-9_() ]+(?=\s*(>|:|\[))/, "node.name"],

          [/{/, "curly.open"],
          [/}/, "curly.close"],
          [/\[/, "bracket.open"],
          [/\]/, "bracket.close"],

          [/</, "operator"],
          [/>/, "operator"],
          [/-+/, "operator"],

          [/[A-Za-z0-9_()]+(?=$)/, "node.name"],
          [/[A-Za-z0-9_()]+(?=\s*(\[|:|$))/, "node.name"],

          [/(:)(\s*[a-zA-Z0-9() ]+)/, ["colon", "connection.label"]],

          [/\b(icon|label|color|colorMode|styleMode|typeface|title|direction)\b/, "attribute"],

          [/".*?"/, "string"],

          [/\b(blue)\b/, "blue.constant"],
          [/\b(red)\b/, "red.constant"],
          [/\b(green|black|pastel|bold|outline|shadow|plain|watercolor|rough|clean|mono|right|down|left|up)\b/i, "constant"],

          [/[a-zA-Z_$][\w$]*/, "identifier"],
        ],
      },
    });

    monaco.languages.setLanguageConfiguration("diagramdsl", {
      comments: { lineComment: "//" },
      brackets: [
        ["{", "}"],
        ["[", "]"],
      ],
      autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: '"', close: '"' },
      ],
    });

    monaco.editor.defineTheme("dslTheme", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "888888" },
        { token: "curly.open", foreground: "007acc" },
        { token: "curly.close", foreground: "ff00aa" },
        { token: "bracket.open", foreground: "ffea00" },
        { token: "bracket.close", foreground: "ff00aa" },
        { token: "colon", foreground: "ffea00" },
        { token: "operator", foreground: "6FCF97" },
        { token: "attribute", foreground: "aa00ff" },

        { token: "node.name", foreground: "00bfff" },
        { token: "icon.value", foreground: "6FCF97" },
        { token: "special.attr", foreground: "6FCF97" },
        { token: "special.value", foreground: "6FCF97" },

        { token: "blue.constant", foreground: "00bfff" },
        { token: "red.constant", foreground: "6FCF97" },
        { token: "constant", foreground: "ffaa00" },

        { token: "string", foreground: "ffffff" },
      ],
      colors: {
        "editor.foreground": "#ffffff",
        "editor.background": "#1C1C1C",
        "editorLineNumber.foreground": "#666666",
        "editorLineNumber.activeForeground": "#ffffff",
        "editor.lineHighlightBackground": "#2A2B2B",
        "editor.lineHighlightBorder": "#2A2B2B",
        "editorCursor.foreground": "#ffffff",
        "editor.selectionBackground": "#555577",
        "editor.inactiveSelectionBackground": "#333355",
      },
    });
  }

  if (!fullyLoaded) {
    return <Loading />;
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="flex-1">
        <Excalidraw
          initialData={{
            ...whiteboardRef.current,
            appState: {
              ...(whiteboardRef.current?.appState || {}),
              viewBackgroundColor: "#1C1C1C",
            },
          }}
          onChange={(elements, appState, files) => {
            whiteboardRef.current = { elements, appState, files };
          }}
          excalidrawAPI={(api) => {
            excalidrawRef.current = api;

            if (whiteboardRef.current?.files) {
              api.addFiles(Object.values(whiteboardRef.current.files));
            }
          }}
        />
      </div>

      <div
        className={`border-l border-black bg-[#1C1C1C] flex flex-col transform transition-all duration-300 ease-in-out ${
          showEditor ? "translate-x-0 w-1/3" : "translate-x-full w-0"
        }`}
      >
        {showEditor && (
          <>
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-[#2A2A2A]">
              <div className="flex items-center gap-2">
                <button onClick={save} className="p-1 hover:bg-gray-600 rounded cursor-pointer" title="Save">
                  <Save size={16} className="text-white" />
                </button>
                <button
                  onClick={() => setExportOpen(true)}
                  className="p-1 hover:bg-gray-600 rounded cursor-pointer"
                  title="Export"
                >
                  <Download size={16} className="text-white" />
                </button>
              </div>
              <span className="text-xs text-gray-400">
                {lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleString()}` : "Never saved"}
              </span>
            </div>

            <Editor
              height="100%"
              language="diagramdsl"
              value={code}
              beforeMount={handleEditorBeforeMount}
              onMount={(editor, monaco) => {
 
                editorRef.current = editor;
                monacoRef.current = monaco;

                monaco.editor.setTheme("dslTheme");

                if (providerDisposableRef.current) {
                  providerDisposableRef.current.dispose();
                  providerDisposableRef.current = null;
                }

                providerDisposableRef.current = monaco.languages.registerCompletionItemProvider("diagramdsl", {
                  triggerCharacters: [" ", "-", ":", ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_"],
                  provideCompletionItems: (model, position) => {
                    const text = model.getLineContent(position.lineNumber);
                    const beforeCursor = text.slice(0, position.column - 1);

                    if (!/\[icon:\s*[a-zA-Z0-9_-]*$/.test(beforeCursor)) {
                      return { suggestions: [] };
                    }

                    const match = beforeCursor.match(/\[icon:\s*([a-zA-Z0-9_-]*)$/);
                    const typed = match ? match[1] : "";

                    const list = iconsRef.current || [];
                    const filtered = !typed
                      ? list
                      : list.filter((name) => name.toLowerCase().startsWith(typed.toLowerCase()));

                    return {
                      suggestions: filtered.map((name) => ({
                        label: name,
                        kind: monaco.languages.CompletionItemKind.Value,
                        insertText: name,
                        detail: "Icon",
                        range: new monaco.Range(
                          position.lineNumber,
                          position.column - typed.length,
                          position.lineNumber,
                          position.column
                        ),
                      })),
                    };
                  },
                });
              }}
              onChange={(v) => setCode(v || "")}
              options={{
                wordWrap: "on",
                fontSize: 17,
                lineHeight: 28,
                letterSpacing: 0.5,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,

                quickSuggestions: false,
                suggestOnTriggerCharacters: true,
              }}
            />
          </>
        )}
      </div>

      <button
        onClick={() => setShowEditor(!showEditor)}
        className="absolute top-50 right-4 z-50 bg-gray-800 text-white p-2 rounded shadow hover:bg-gray-700 transition cursor-pointer"
      >
        {showEditor ? <PanelRightClose /> : <PanelRightOpen />}
      </button>
      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        code={code}
        fileId={fileId}
        excalidrawRef={excalidrawRef}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  FileIcon,
  FilePlus,
  GitBranch,
  Settings2,
  Pencil,
  X,
  Check,
  Trash2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { Skeleton } from "./ui/skeleton";
import {
  fetchWorkspaces,
  createWorkspace,
  fetchFiles,
  createFile,
  updateFile,
  deleteFile,
  type Workspace,
  getOrCreateLastFile,
} from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { toast } from "sonner";
import { useTheme } from "next-themes";

const nav = {
  navSecondary: [
    { title: "GitHub", url: "https://github.com/fish-not-phish/eido", icon: GitBranch },
    { title: "Settings", url: "/settings", icon: Settings2 },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const params = useParams() as { workspaceId?: string; fileId?: string };

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [wsLoading, setWsLoading] = useState(true);

  const [files, setFiles] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const ws = await fetchWorkspaces();
        setWorkspaces(ws);
      } finally {
        setWsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const wsId = params.workspaceId;
    if (!wsId) {
      setFiles([]);
      setFilesLoading(false);
      return;
    }
    setFilesLoading(true);
    fetchFiles(wsId)
      .then(setFiles)
      .finally(() => setFilesLoading(false));
  }, [params.workspaceId]);

  async function handleNewFile() {
    const wsId = params.workspaceId;
    if (!wsId) return;
    const f = await createFile(wsId, "Untitled");
    setFiles((prev) => [f, ...prev]);
    router.push(`/dashboard/${wsId}/files/${f.id}`);
  }

  async function commitRename(fileId: string) {
    const wsId = params.workspaceId;
    if (!wsId) return;
    if (!editValue.trim()) {
      setEditingId(null);
      setEditValue("");
      return;
    }
    try {
      const updated = await updateFile(wsId, fileId, { name: editValue });
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, name: updated.name } : f))
      );
      toast.success("File renamed");
    } catch (err) {
      console.error("Rename failed:", err);
      toast.error("Failed to rename file");
    } finally {
      setEditingId(null);
      setEditValue("");
    }
  }

  async function handleDelete(fileId: string) {
    const wsId = params.workspaceId;
    if (!wsId) return;

    try {
      await deleteFile(wsId, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));

      const nextFile = await getOrCreateLastFile(wsId);
      router.push(`/dashboard/${wsId}/files/${nextFile.id}`);

      toast.success("File deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete file");
    }
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex items-center gap-2">
                  <Image
                    src="/eido-light.svg"
                    alt="Eido Logo"
                    width={140} 
                    height={40}
                    className="h-7 w-auto dark:hidden"
                  />
                  <Image
                    src="/eido-dark.svg"
                    alt="Eido Logo"
                    width={140} 
                    height={40}
                    className="h-7 w-auto hidden dark:block"
                  />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <WorkspaceSwitcher />

        <SidebarGroup>
          <SidebarGroupLabel className="flex justify-between items-center">
            <span>Files</span>
            <button
              onClick={handleNewFile}
              className="text-xs flex items-center gap-1 cursor-pointer"
              disabled={!params.workspaceId}
            >
              <FilePlus className="w-4 h-4" /> New
            </button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </SidebarMenuItem>
                ))
              ) : (
                files.map((f) => (
                  <SidebarMenuItem key={f.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      {editingId === f.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            className="flex-1 px-1 py-0.5 text-sm border rounded"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                          />
                          <button
                            onClick={() => commitRename(f.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditValue("");
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <SidebarMenuButton
                            asChild
                            className="flex-1"
                            isActive={params.fileId === String(f.id)}
                          >
                            <Link href={`/dashboard/${params.workspaceId}/files/${f.id}`}>
                              <FileIcon className="mr-1 h-4 w-4" />
                              {f.name}
                            </Link>
                          </SidebarMenuButton>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingId(f.id);
                                setEditValue(f.name);
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <Pencil className="w-4 h-4 cursor-pointer" />
                            </button>
                            <button
                              onClick={() => handleDelete(f.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 cursor-pointer" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />

      <SidebarFooter>
        <SidebarMenu>
          {nav.navSecondary.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm">
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <NavUser/>
      </SidebarFooter>
    </Sidebar>
  );
}

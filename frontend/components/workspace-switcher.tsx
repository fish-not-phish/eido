"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Settings, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  fetchWorkspaces,
  getOrCreateLastFile,
  type Workspace,
} from "@/lib/api";
import { useParams } from "next/navigation";

export function WorkspaceSwitcher() {
  const params = useParams() as { workspaceId?: string };
  const { isMobile } = useSidebar();
  const router = useRouter();

  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [active, setActive] = React.useState<Workspace | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const ws = await fetchWorkspaces();
        setWorkspaces(ws);

        const current = ws.find((w) => w.id === params.workspaceId);
        setActive(current ?? ws[0] ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.workspaceId]);

  if (loading || !active) return null;

  async function handleWorkspaceSelect(ws: Workspace) {
    setActive(ws);
    try {
      const file = await getOrCreateLastFile(ws.id);
      router.push(`/dashboard/${ws.id}/files/${file.id}`);
    } catch (err) {
      console.error("Failed to load workspace file:", err);
      router.push(`/dashboard/${ws.id}`);
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem className="px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground 
                         focus:outline-none focus:ring-0 focus-visible:ring-0 cursor-pointer"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <span className="font-bold">
                  {active.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{active.name}</span>
                <span className="truncate text-xs">Workspace</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => handleWorkspaceSelect(ws)}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <span className="text-xs font-semibold">
                    {ws.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {ws.name}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/${active.id}/invite`)}
              className="gap-2 p-2 cursor-pointer"
            >
              <UserPlus className="size-4" />
              Add Members
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/${active.id}/settings`)}
              className="gap-2 p-2 cursor-pointer"
            >
              <Settings className="size-4" />
              Workspace Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/new-workspace`)}
              className="gap-2 p-2 cursor-pointer"
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Add workspace
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

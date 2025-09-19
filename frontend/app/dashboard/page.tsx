"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWorkspaces, getOrCreateLastFile } from "@/lib/api";
import { toast } from "sonner";
import Loading from "@/components/loader";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const workspaces = await fetchWorkspaces();

        if (workspaces.length === 0) {
          router.replace("/dashboard/new-workspace");
          return;
        }

        const lastUsedId = localStorage.getItem("lastWorkspaceId");
        const ws =
          workspaces.find((w) => w.id === lastUsedId) || workspaces[0];

        const file = await getOrCreateLastFile(ws.id);

        localStorage.setItem("lastWorkspaceId", ws.id);
        router.replace(`/dashboard/${ws.id}/files/${file.id}`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load workspaces");
      }
    })();
  }, [router]);

  return <Loading />;
}

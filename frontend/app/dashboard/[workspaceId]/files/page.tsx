"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { getOrCreateLastFile } from "@/lib/api";

export default function WorkspaceIndex() {
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };

  useEffect(() => {
    (async () => {
      if (!workspaceId) return;
      const f = await getOrCreateLastFile(workspaceId);
      router.replace(`/dashboard/${workspaceId}/files/${f.id}`);
    })();
  }, [workspaceId, router]);

  return null;
}

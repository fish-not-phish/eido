"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace, getOrCreateLastFile, type Workspace } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setLoading(true);
    try {
      const ws: Workspace = await createWorkspace(name.trim());

      const file = await getOrCreateLastFile(ws.id);

      toast.success(`Workspace "${ws.name}" created successfully`);
      router.push(`/dashboard/${ws.id}/files/${file.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create workspace");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl">Create Workspace</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                placeholder="e.g. Marketing Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="pt-6">
            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
              {loading ? "Creating..." : "Create Workspace"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

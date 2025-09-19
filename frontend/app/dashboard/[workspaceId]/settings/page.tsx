"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; 
import { deleteWorkspace, listMembers, removeMember, updateMember, type Membership } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";

type PermKey = "read" | "write" | "delete";

function toPermArray(m: Membership): PermKey[] {
  const out: PermKey[] = [];
  if (m.can_read) out.push("read");
  if (m.can_write) out.push("write");
  if (m.can_delete) out.push("delete");
  return out;
}

export default function WorkspaceSettingsPage() {
  const params = useParams() as { workspaceId: string };
  const workspaceId = params.workspaceId;

  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [permByMember, setPermByMember] = useState<Record<string, PermKey[]>>(
    {}
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await listMembers(workspaceId);
        setMembers(data);

        const initial: Record<string, PermKey[]> = {};
        for (const m of data) initial[m.id] = toPermArray(m);
        setPermByMember(initial);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load members");
      } finally {
        setLoading(false);
      }
    })();
  }, [workspaceId]);

  async function handleDeleteWorkspace() {
    try {
      await deleteWorkspace(workspaceId);
      toast.success("Workspace deleted");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete workspace");
    }
  }

  async function persistPerms(memberId: string, vals: PermKey[]) {
    try {
      const updated = await updateMember(workspaceId, memberId, {
        can_read: vals.includes("read"),
        can_write: vals.includes("write"),
        can_delete: vals.includes("delete"),
      });

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, ...updated } : m))
      );
      toast.success("Member updated");
    } catch (err) {
      console.error(err);
      toast.error("Update failed");

      const original = members.find((m) => m.id === memberId);
      if (original) {
        setPermByMember((prev) => ({
          ...prev,
          [memberId]: toPermArray(original),
        }));
      }
    }
  }

  function roleBadge(role: string) {
    switch (role) {
      case "owner":
        return <Badge className="bg-purple-600 text-white">Owner</Badge>;
      case "admin":
        return <Badge className="bg-blue-600 text-white">Admin</Badge>;
      case "member":
        return <Badge className="bg-gray-600 text-white">Member</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 flex flex-col items-center gap-6">
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle>Workspace Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((m) => {
              const selected = permByMember[m.id] ?? [];

              const apply = (vals: PermKey[]) => {
                setPermByMember((prev) => ({ ...prev, [m.id]: vals }));
                void persistPerms(m.id, vals);
              };

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {m.email ?? `User ${m.user_id}`}
                    </span>
                    <div className="mt-1">{roleBadge(m.role)}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    {m.role !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Change Role
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              updateMember(workspaceId, m.id, { role: "admin" })
                                .then((updated) => {
                                  setMembers((prev) =>
                                    prev.map((row) =>
                                      row.id === m.id ? { ...row, ...updated } : row
                                    )
                                  );
                                  toast.success("Member updated");
                                })
                                .catch(() => toast.error("Update failed"))
                            }
                          >
                            Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateMember(workspaceId, m.id, { role: "member" })
                                .then((updated) => {
                                  setMembers((prev) =>
                                    prev.map((row) =>
                                      row.id === m.id ? { ...row, ...updated } : row
                                    )
                                  );
                                  toast.success("Member updated");
                                })
                                .catch(() => toast.error("Update failed"))
                            }
                          >
                            Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    <MultiSelect
                      // Support both prop name variations
                      // @ts-expect-error
                      value={selected}
                      values={selected}
                      onValueChange={(vals: PermKey[] | string[]) =>
                        apply(vals as PermKey[])
                      }
                      onValuesChange={(vals: PermKey[] | string[]) =>
                        apply(vals as PermKey[])
                      }
                    >
                      <MultiSelectTrigger className="w-[220px]">
                        <MultiSelectValue placeholder="Permissions..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        <MultiSelectGroup>
                          <MultiSelectItem value="read" className="cursor-pointer">Read</MultiSelectItem>
                          <MultiSelectItem value="write" className="cursor-pointer">Write</MultiSelectItem>
                          <MultiSelectItem value="delete" className="cursor-pointer">Delete</MultiSelectItem>
                        </MultiSelectGroup>
                      </MultiSelectContent>
                    </MultiSelect>
                    {m.role !== "owner" && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={async () => {
                          try {
                            await removeMember(workspaceId, m.id);
                            setMembers((prev) => prev.filter((row) => row.id !== m.id));
                            toast.success("Member removed");
                          } catch (err) {
                            console.error(err);
                            toast.error("Failed to remove member");
                          }
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Deleting this workspace will remove all files and memberships.
          </p>
          <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={handleDeleteWorkspace} 
            >
              Delete Workspace
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

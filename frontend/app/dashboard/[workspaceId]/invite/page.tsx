"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { inviteMember, searchUsers, type UserType } from "@/lib/api";
import { toast } from "sonner";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function InvitePage() {
  const params = useParams() as { workspaceId: string };
  const workspaceId = params.workspaceId;

  const [users, setUsers] = useState<UserType[]>([]);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }
    let active = true;
    searchUsers(query, workspaceId)
        .then(setUsers)
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [query]);

  async function handleInvite(user: UserType) {
    try {
      await inviteMember(workspaceId, {
        email: user.email,
        role: "member",
        can_read: true,
        can_write: true,
        can_delete: false,
      });
      toast.success(`${user.email} invited successfully`);
      setSelectedUser(null);
      setQuery("");
      setUsers([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to invite user");
    }
  }

  return (
    <div className="p-6 flex justify-center">
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Member
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Command>
            <CommandInput
              placeholder="Search users by name or email..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup heading="Users">
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.username} ${user.email}`}
                    onSelect={() => setSelectedUser(user)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{user.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

      
        </CardContent>
        {selectedUser && (
            <div className="flex items-center justify-between border rounded p-4 mx-5 my-5">
              <div className="flex flex-col">
                <span className="font-medium">{selectedUser.username}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedUser.email}
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => handleInvite(selectedUser)}
                className="ml-2 cursor-pointer"
              >
                Add Member
              </Button>
            </div>
          )}
      </Card>
    </div>
  );
}

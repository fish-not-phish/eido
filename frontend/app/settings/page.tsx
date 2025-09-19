"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  searchUsersForSuperuser,
  listSuperusers,
  setSuperuser,
  type UserType,
} from "@/lib/api";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { UserPlus, Shield, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import RegistrationToggle from "@/components/registration-toggle";
import { ModeToggle } from "@/components/theme-toggle";

export default function SuperuserSettingsPage() {
  const router = useRouter(); 
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  const [superusers, setSuperusers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listSuperusers();
        setSuperusers(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load superusers");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }
    searchUsersForSuperuser(query)
      .then(setUsers)
      .catch(() => {});
  }, [query]);

  async function handlePromote(user: UserType) {
    try {
      await setSuperuser(user.id, true);
      toast.success(`${user.email} is now a superuser`);
      setSuperusers((prev) => [...prev, { ...user, is_superuser: true }]);
      setSelectedUser(null);
      setQuery("");
      setUsers([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to promote user");
    }
  }

  async function handleDemote(user: UserType) {
    try {
      await setSuperuser(user.id, false);
      toast.success(`${user.email} is no longer a superuser`);
      setSuperusers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to demote user");
    }
  }

  return (
    <div className="p-6 flex flex-col items-center gap-8">
       <div className="w-full max-w-5xl flex items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="w-full max-w-5xl flex items-center mb-4">
        <RegistrationToggle />
      </div>
      <div className="w-full max-w-5xl flex items-center mb-4 gap-3">
        <span>Theme:</span> <ModeToggle />
      </div>
      
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Superuser
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
              onClick={() => handlePromote(selectedUser)}
              className="ml-2 cursor-pointer"
            >
              Make Superuser
            </Button>
          </div>
        )}
      </Card>

      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Active Superusers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {superusers.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No superusers found.
                </div>
              )}
              {superusers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{user.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => handleDemote(user)}
                  >
                    Demote to User
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateMe } from "@/lib/api"
import { useState } from "react"

export function AccountDialog({ user, setUser, onClose }: {
  user: { name: string; email: string } | null
  setUser: React.Dispatch<React.SetStateAction<{ name: string; email: string; avatar: string } | null>>
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      setLoading(true)
      const updated = await updateMe({ email, password })
      setUser(prev =>
        prev ? { ...prev, name: updated.username, email: updated.email } : null
      )
      toast.success("Account updated")
      onClose()
    } catch (err) {
      console.error(err)
      toast.error("Failed to update account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          defaultValue={user?.email}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          name="password"
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}

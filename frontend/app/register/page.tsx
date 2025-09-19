"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { register, login, listWorkspaces, getOrCreateLastFile } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Image from "next/image"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await register(email, password)

      await login(email, password)

      const workspaces = await listWorkspaces()
      if (!workspaces || workspaces.length === 0) {
        throw new Error("No workspace found after registration")
      }
      const workspaceId = workspaces[0].id

      const file = await getOrCreateLastFile(workspaceId)

      toast.success("Account created successfully")
      router.push(`/dashboard/${workspaceId}/files/${file.id}`)
    } catch (err: any) {
      console.error(err)
      toast.error("Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/eido-light.svg"
              alt="Eido Logo"
              width={120}
              height={32}
              className="h-8 w-auto dark:hidden"
            />
            <Image
              src="/eido-dark.svg"
              alt="Eido Logo"
              width={120}
              height={32}
              className="h-8 w-auto hidden dark:block"
            />
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className={cn("flex flex-col gap-6 w-80")}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Create an account</h1>
              <p className="text-muted-foreground text-sm text-balance">
                Enter your email and password to get started
              </p>
            </div>

            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@eido.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                {loading ? "Creating account..." : "Register"}
              </Button>
            </div>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <a href="/login" className="underline underline-offset-4">
                Login
              </a>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-muted relative hidden lg:block">
        <img
          src="/bubble.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}

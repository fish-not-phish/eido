"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#1C1C1C]">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
      <span className="ml-2 text-white">Loading...</span>
    </div>
  );
}

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const dir = path.join(process.cwd(), "public/icons");
  const files = await fs.promises.readdir(dir);
  const icons = files
    .filter((f) => f.endsWith(".png"))
    .map((f) => f.replace(".png", ""));
  return NextResponse.json(icons);
}

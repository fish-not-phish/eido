import icons from "@/public/icons.json";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(icons);
}

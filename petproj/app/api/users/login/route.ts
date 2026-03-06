import { NextResponse } from "next/server";

/**
 * @deprecated Login is now handled directly by the NestJS backend.
 * Use `loginApi()` from `@/utils/api` in your components instead.
 */
export async function POST() {
  return NextResponse.json(
    { error: "This route is deprecated. Use the NestJS backend directly." },
    { status: 410 }
  );
}


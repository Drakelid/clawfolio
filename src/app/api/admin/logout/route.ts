import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth";

function shouldUseSecureCookie(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim() === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: shouldUseSecureCookie(request),
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return Response.json({ success: true });
}

import { saveProjectImageUpload } from "@/lib/project-image-upload";
import { validateAdminCookie } from "@/lib/server-auth";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  if (!(await validateAdminCookie())) {
    return unauthorized();
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return Response.json({ error: "Invalid upload payload" }, { status: 400 });
  }

  const file = formData.get("file");
  const projectTitle = formData.get("projectTitle");

  if (!(file instanceof File)) {
    return Response.json({ error: "Image file is required" }, { status: 400 });
  }

  try {
    const path = await saveProjectImageUpload(
      file,
      typeof projectTitle === "string" ? projectTitle : undefined
    );

    return Response.json({ data: { path } }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to save uploaded image",
      },
      { status: 400 }
    );
  }
}

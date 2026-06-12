import { NextResponse } from "next/server";
import { uploadImageAdmin } from "@/lib/ghost/admin";
import { builderAuthed } from "@/lib/builder";

// Image upload for the builder: forwards a file to Ghost's Admin images API and
// returns the public URL. Protected by BUILDER_SECRET.
export async function POST(request: Request) {
  if (!builderAuthed(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let file: FormDataEntryValue | null = null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
  }

  try {
    const name = file instanceof File ? file.name : "upload.png";
    const url = await uploadImageAdmin(file, name);
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[builder] upload failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "upload_failed" },
      { status: 502 },
    );
  }
}

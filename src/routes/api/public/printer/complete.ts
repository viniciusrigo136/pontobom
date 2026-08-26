import { createFileRoute } from "@tanstack/react-router";

function checkToken(request: Request): boolean {
  const expected = process.env["PRINTER_AGENT_TOKEN"];
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/printer/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!checkToken(request)) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }

        type Body = { job_id?: string; status?: string; error?: string };
        let body: Body | null = null;
        try {
          body = (await request.json()) as Body;
        } catch {
          body = null;
        }

        const jobId = body?.job_id;
        const status = body?.status === "error" ? "error" : "printed";
        if (!jobId) return Response.json({ error: "job_id obrigatório" }, { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data, error } = await supabaseAdmin
          .from("print_jobs")
          .update({
            status,
            printed_at: status === "printed" ? new Date().toISOString() : null,
            error: status === "error" ? (body?.error ?? "Falha na impressão") : null,
          })
          .eq("id", jobId)
          .select("id, status")
          .maybeSingle();

        if (error) return Response.json({ error: error.message }, { status: 500 });
        if (!data) return Response.json({ error: "job não encontrado" }, { status: 404 });

        return Response.json({ ok: true, job: data });
      },
    },
  },
});

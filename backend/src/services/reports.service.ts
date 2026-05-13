import { env } from "../config/env";
import { AppError } from "../utils/AppError";

type Json = Record<string, unknown>;

export type RenderedFile = {
  buffer: Buffer;
  contentType: string;
  filename: string;
};

async function postToReports(path: string, payload: Json): Promise<RenderedFile> {
  const url = `${env.phpReportsUrl.replace(/\/$/, "")}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown error";
    throw new AppError(`reports service unreachable: ${reason}`, 502);
  }

  if (!res.ok) {
    let message = `reports service returned ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body === "object" && "message" in body) {
        message = String((body as { message: unknown }).message);
      }
    } catch {
      // ignore — non-JSON error body
    }
    throw new AppError(message, res.status === 400 ? 400 : 502);
  }

  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] ?? "document";
  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType, filename };
}

export const reportsService = {
  pdfReceipt(payload: Json): Promise<RenderedFile> {
    return postToReports("/pdf/receipt", payload);
  },
  pdfInvoice(payload: Json): Promise<RenderedFile> {
    return postToReports("/pdf/invoice", payload);
  },
  pdfLease(payload: Json): Promise<RenderedFile> {
    return postToReports("/pdf/lease", payload);
  },
  pdfReport(payload: Json): Promise<RenderedFile> {
    return postToReports("/pdf/report", payload);
  },
  csv(payload: { filename?: string; columns: string[]; rows: Array<Record<string, unknown>> }): Promise<RenderedFile> {
    return postToReports("/csv", payload as unknown as Json);
  },
};

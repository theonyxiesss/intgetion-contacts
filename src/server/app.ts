import { ZodError } from "zod";
import {
  HttpError,
  httpErrorResponse,
  notFound,
  reportError,
  validationError,
} from "@intgetion/kit";
import * as contacts from "../modules/contacts/service";
import { isUuid, requireCaller, requireServiceToken } from "./auth";

export type AppConfig = { serviceToken: string };

const MAX_BODY = 16 * 1024;

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > MAX_BODY) {
    throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Body too large");
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw validationError({ body: "invalid json" });
  }
}

function uuidParam(value: string | undefined): string {
  if (!value || !isUuid(value)) throw notFound();
  return value;
}

type Route = {
  method: string;
  pattern: RegExp;
  run: (request: Request, params: string[]) => Promise<unknown>;
};

const routes: Route[] = [
  {
    method: "GET",
    pattern: /^\/v1\/me\/contacts$/,
    run: async (request) => {
      const found = await contacts.getOwnContacts(requireCaller(request).userId);
      if (!found) throw notFound();
      return found;
    },
  },
  {
    method: "PUT",
    pattern: /^\/v1\/me\/contacts$/,
    run: async (request) => {
      const { userId } = requireCaller(request);
      const input = contacts.contactsInput.parse(await readJson(request));
      return contacts.saveContacts(userId, input);
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/contacts\/([^/]+)$/,
    run: async (_request, [id]) => {
      const found = await contacts.getOwnContacts(uuidParam(id));
      if (!found) throw notFound();
      return found;
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/contacts\/([^/]+)\/email$/,
    run: async (_request, [id]) => ({
      email: await contacts.findContactEmail(uuidParam(id)),
    }),
  },
  {
    method: "DELETE",
    pattern: /^\/v1\/contacts\/([^/]+)$/,
    run: async (_request, [id]) => ({
      deleted: await contacts.deleteContacts(uuidParam(id)),
    }),
  },
];

export function toResponse(error: unknown): Response {
  if (error instanceof HttpError) return httpErrorResponse(error);
  if (error instanceof ZodError) {
    return httpErrorResponse(validationError(error.issues));
  }
  if ((error as { cause?: { code?: string } }).cause?.code === "23503") {
    return httpErrorResponse(notFound("Candidate profile not found"));
  }
  reportError(error, "contacts-service");
  return Response.json(
    { error: { code: "INTERNAL", message: "Internal error" } },
    { status: 500 },
  );
}

export function createApp(config: AppConfig) {
  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return Response.json({ ok: true });
      }
      requireServiceToken(request, config.serviceToken);
      for (const route of routes) {
        if (route.method !== request.method) continue;
        const match = route.pattern.exec(url.pathname);
        if (!match) continue;
        return Response.json(await route.run(request, match.slice(1)), {
          headers: { "cache-control": "no-store" },
        });
      }
      throw notFound();
    } catch (error) {
      return toResponse(error);
    }
  };
}

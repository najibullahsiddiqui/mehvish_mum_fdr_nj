import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      details,
    },
    { status },
  );
}

export function jsonOk<T>(data: T, message?: string) {
  return NextResponse.json({
    ok: true,
    data,
    message,
  });
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

export function routeError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("The submitted data is invalid.", 422, error.flatten());
  }

  if (error instanceof HttpError) {
    return jsonError(error.message, error.status);
  }

  if (error instanceof Error && "status" in error && typeof error.status === "number") {
    return jsonError(error.message, error.status);
  }

  const message = error instanceof Error ? error.message : "Something went wrong.";
  return jsonError(message, 500);
}

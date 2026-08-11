import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true as const, data }, { status });
}

export function fail(
  message: string,
  status = 400,
  code?: string,
  details?: unknown,
): NextResponse<ApiFailure> {
  return NextResponse.json(
    {
      ok: false as const,
      error: {
        message,
        ...(code ? { code } : {}),
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status },
  );
}

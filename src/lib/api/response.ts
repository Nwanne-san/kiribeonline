import { NextResponse } from "next/server";

export type ApiSuccessPayload<T = unknown> = {
  success: true;
  data?: T;
  message?: string;
};

export type ApiErrorPayload = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
};

export function apiSuccess<T>(data?: T, message?: string, status = 200) {
  return NextResponse.json<ApiSuccessPayload<T>>(
    { success: true, data, message },
    { status }
  );
}

export function apiError(
  message: string,
  statusCode = 400,
  errors?: Record<string, string[]>
) {
  return NextResponse.json<ApiErrorPayload>(
    { success: false, message, errors, statusCode },
    { status: statusCode }
  );
}

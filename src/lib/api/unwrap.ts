import type { ApiSuccessPayload } from "@/lib/api";

export function unwrapApiData<T>(result: T | ApiSuccessPayload<T>): T {
  if (
    result &&
    typeof result === "object" &&
    "success" in result &&
    (result as ApiSuccessPayload<T>).success === true &&
    "data" in result
  ) {
    return (result as ApiSuccessPayload<T>).data as T;
  }
  return result as T;
}

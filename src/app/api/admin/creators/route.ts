import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWrite,
} from "@/lib/auth";
import { createCreatorAdmin, listCreatorsAdmin } from "@/lib/admin/creators";
import { z } from "zod";

export const dynamic = "force-dynamic";

const creatorInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  role: z.string().min(1),
  bio: z.string().optional(),
  quote: z.string().optional(),
  portraitId: z.union([z.string(), z.number()]),
  badges: z.array(z.object({ label: z.string(), color: z.string().optional() })).optional(),
  achievements: z
    .array(z.object({ label: z.string(), value: z.string(), icon: z.string().optional() }))
    .optional(),
  featuredOnHomepage: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    return apiSuccess(await listCreatorsAdmin());
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminWrite(request);
    const body = await request.json();
    const input = parseBody(creatorInputSchema, body);
    return apiSuccess(await createCreatorAdmin(input));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

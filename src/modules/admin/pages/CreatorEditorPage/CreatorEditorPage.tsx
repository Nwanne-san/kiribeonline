"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminCard,
  AdminFieldLabel,
  AdminPageHeader,
} from "@/modules/admin/components/AdminUi";
import { MediaPicker } from "@/modules/admin/components/MediaPicker";
import type { AdminMediaRef } from "@/lib/admin/types";
import { AdminRoutes } from "@/routes/admin.routes";
import { KiribeButton, KiribeTextField } from "@/modules/shared/components/ui";
import { useMutationService } from "@/utils/hooks/useMutationService";
import client from "@/utils/client";
import { unwrapApiData } from "@/lib/api/unwrap";

type CreatorEditorPageProps = {
  creatorId?: string;
};

export function CreatorEditorPage({ creatorId }: CreatorEditorPageProps) {
  const router = useRouter();
  const isEdit = Boolean(creatorId);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [quote, setQuote] = useState("");
  const [portrait, setPortrait] = useState<AdminMediaRef | null>(null);

  useEffect(() => {
    if (!creatorId) return;
    void (async () => {
      const res = await client.request<never, Record<string, unknown>>({
        path: `/api/admin/creators/${creatorId}`,
        method: ApiMethods.GET,
      });
      const data = unwrapApiData(res);
      setName(String(data.name ?? ""));
      setRole(String(data.role ?? ""));
      setBio(String(data.bio ?? ""));
      setQuote(String(data.quote ?? ""));
      const p = data.portrait;
      if (p && typeof p === "object" && "id" in p) {
        setPortrait(p as AdminMediaRef);
      }
    })();
  }, [creatorId]);

  const { mutate, isPending } = useMutationService({
    service: (payload) => ({
      path: isEdit ? `/api/admin/creators/${creatorId}` : "/api/admin/creators",
      method: isEdit ? ApiMethods.PATCH : ApiMethods.POST,
      data: payload,
    }),
    options: {
      successTitle: isEdit ? "Creator updated" : "Creator created",
      redirectTo: AdminRoutes.creators,
    },
  });

  const save = () => {
    if (!name.trim() || !role.trim() || !portrait?.id) return;
    mutate({
      name: name.trim(),
      role: role.trim(),
      bio: bio.trim() || undefined,
      quote: quote.trim() || undefined,
      portraitId: portrait.id,
    });
  };

  return (
    <>
      <AdminPageHeader title={isEdit ? "Edit creator" : "New creator"} />
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        <AdminCard sx={{ flex: 1, p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <AdminFieldLabel label="Name" required />
              <KiribeTextField fullWidth value={name} onChange={(e) => setName(e.target.value)} />
            </Box>
            <Box>
              <AdminFieldLabel label="Role" required />
              <KiribeTextField fullWidth value={role} onChange={(e) => setRole(e.target.value)} />
            </Box>
            <Box>
              <AdminFieldLabel label="Bio" />
              <KiribeTextField fullWidth multiline minRows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Box>
            <Box>
              <AdminFieldLabel label="Quote" />
              <KiribeTextField fullWidth multiline minRows={2} value={quote} onChange={(e) => setQuote(e.target.value)} />
            </Box>
          </Stack>
        </AdminCard>
        <AdminCard sx={{ width: { md: 320 }, p: 3 }}>
          <MediaPicker label="Portrait" value={portrait} onChange={setPortrait} />
        </AdminCard>
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <KiribeButton onClick={save} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </KiribeButton>
        <KiribeButton variant="outlined" onClick={() => router.push(AdminRoutes.creators)}>
          Cancel
        </KiribeButton>
      </Stack>
    </>
  );
}

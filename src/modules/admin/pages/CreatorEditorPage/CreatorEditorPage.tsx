"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import { MediaPicker } from "@/modules/admin/components/MediaPicker";
import type { AdminMediaRef } from "@/server/modules";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminTextarea,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { AdminRoutes } from "@/routes/admin.routes";
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

  const canSave = name.trim() && role.trim() && portrait?.id && !isPending;

  const save = () => {
    if (!canSave) return;
    mutate({
      name: name.trim(),
      role: role.trim(),
      bio: bio.trim() || undefined,
      quote: quote.trim() || undefined,
      portraitId: portrait.id,
    });
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={isEdit ? "Edit creator" : "New creator"}
        subtitle="Directors, actors, and other cultural figures featured across the site."
        action={
          <AdminButton
            variant="secondary"
            leftIcon={<ArrowBackRounded sx={{ fontSize: 16 }} />}
            onClick={() => router.push(AdminRoutes.creators)}
          >
            Back
          </AdminButton>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <AdminPanel title="Profile">
          <div className="space-y-4 p-5">
            <AdminField label="Name" htmlFor="creator-name" required>
              <AdminInput
                id="creator-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kunle Afolayan"
              />
            </AdminField>

            <AdminField label="Role" htmlFor="creator-role" required
              hint="Short professional descriptor — Director, Actor, Editor, etc."
            >
              <AdminInput
                id="creator-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </AdminField>

            <AdminField label="Bio" htmlFor="creator-bio">
              <AdminTextarea
                id="creator-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Short biography — 2–3 sentences."
              />
            </AdminField>

            <AdminField label="Pull quote" htmlFor="creator-quote">
              <AdminTextarea
                id="creator-quote"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                rows={2}
                placeholder="A one-line quote surfaced on the Spotlight card."
              />
            </AdminField>
          </div>
        </AdminPanel>

        <AdminPanel title="Portrait">
          <div className="p-5">
            <MediaPicker label="Portrait" value={portrait} onChange={setPortrait} />
          </div>
        </AdminPanel>
      </div>

      <div className="flex items-center gap-2">
        <AdminButton
          onClick={save}
          disabled={!canSave}
          leftIcon={<SaveRounded sx={{ fontSize: 16 }} />}
        >
          {isPending ? "Saving…" : "Save"}
        </AdminButton>
        <AdminButton variant="secondary" onClick={() => router.push(AdminRoutes.creators)}>
          Cancel
        </AdminButton>
      </div>
    </div>
  );
}

import { getPayloadClient } from "@/lib/payload/get-payload";
import { slugify } from "@/utils/helper";

export type CreatorInput = {
  name: string;
  slug?: string;
  role: string;
  bio?: string;
  quote?: string;
  portraitId: string | number;
  badges?: Array<{ label: string; color?: string }>;
  achievements?: Array<{ label: string; value: string; icon?: string }>;
  featuredOnHomepage?: boolean;
  sortOrder?: number;
};

export async function listCreatorsAdmin() {
  const payload = await getPayloadClient();
  return payload.find({ collection: "creators", sort: "sortOrder", limit: 100, depth: 1, overrideAccess: true });
}

export async function getCreatorAdmin(id: string) {
  const payload = await getPayloadClient();
  return payload.findByID({ collection: "creators", id, depth: 2, overrideAccess: true });
}

export async function createCreatorAdmin(input: CreatorInput) {
  const payload = await getPayloadClient();
  return payload.create({
    collection: "creators",
    data: {
      name: input.name,
      slug: input.slug ?? slugify(input.name),
      role: input.role,
      bio: input.bio,
      quote: input.quote,
      portrait: input.portraitId,
      badges: input.badges,
      achievements: input.achievements,
      featuredOnHomepage: input.featuredOnHomepage ?? false,
      sortOrder: input.sortOrder ?? 0,
    } as never,
    overrideAccess: true,
  });
}

export async function updateCreatorAdmin(id: string, input: Partial<CreatorInput>) {
  const payload = await getPayloadClient();
  const data: Record<string, unknown> = {};
  if (input.name) data.name = input.name;
  if (input.slug) data.slug = input.slug;
  if (input.role) data.role = input.role;
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.quote !== undefined) data.quote = input.quote;
  if (input.portraitId) data.portrait = input.portraitId;
  if (input.badges) data.badges = input.badges;
  if (input.achievements) data.achievements = input.achievements;
  if (input.featuredOnHomepage !== undefined) data.featuredOnHomepage = input.featuredOnHomepage;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  return payload.update({ collection: "creators", id, data, overrideAccess: true });
}

export async function deleteCreatorAdmin(id: string) {
  const payload = await getPayloadClient();
  return payload.delete({ collection: "creators", id, overrideAccess: true });
}

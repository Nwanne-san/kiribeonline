import { getHomepageForPublic } from "@/lib/content";
import { HomePage } from "@/modules/editorial/pages/HomePage";

export default async function Page() {
  const data = await getHomepageForPublic();
  return <HomePage data={data} />;
}

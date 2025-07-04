import { redirect } from "next/navigation";

export default function ArtworkRedirectPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/artwork/${params.id}/direct`);
}

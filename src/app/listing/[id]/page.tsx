import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** Alias route for listing detail. */
export default async function ListingAliasPage({ params }: Props) {
  const { id } = await params;
  redirect(`/product/${id}`);
}

import { getDocsPage, getDocsPages } from "@/lib/docs"
import { notFound } from "next/navigation"

// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600

export const generateStaticParams = async () => {
  return getDocsPages().map((page) => ({ slug: page.slug }))
}

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const page = getDocsPage(slug)
  if (!page) {
    notFound()
  }

  const content = page.content

  return (
    <pre style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}>
      {content}
    </pre>
  )
}

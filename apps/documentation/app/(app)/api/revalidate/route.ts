import { blocksToMarkdown, convertRecordToSimple } from "@mikemajara/notion-cms"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json()
    const record = await convertRecordToSimple(data)

    if (!record.slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }

    // Revalidate the specific page tag
    revalidateTag(`docs-${record.slug}`)

    return NextResponse.json(
      { message: `Page with slug "${record.slug}" revalidated successfully` },
      { status: 200 }
    )
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 })
  }
}

// Optional: Support GET requests with query parameter
export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug")

    if (!slug) {
      return NextResponse.json(
        { error: "Slug query parameter is required" },
        { status: 400 }
      )
    }

    // Revalidate the specific page tag
    revalidateTag(`docs-${slug}`)

    return NextResponse.json(
      { message: `Page with slug "${slug}" revalidated successfully` },
      { status: 200 }
    )
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 })
  }
}

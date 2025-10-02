import {
  blocksToHtml,
  blocksToMarkdown,
  convertRecordToSimple,
  NotionCMS
} from "@mikemajara/notion-cms"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ReactMarkdown from "react-markdown"
// Import to ensure prototype extensions are executed
import "@/notion/notion-types-art-gallery-inventory"

export default async function ArtworkPage({
  params
}: {
  params: { id: string }
}) {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
    files: {
      strategy: "direct"
    }
  })

  try {
    // Fetch the specific artwork by ID using the generated query method
    const pageId = (await params).id
    const artwork = await convertRecordToSimple(
      await notionCMS.getRecordRaw(pageId)
    )
    const content = await notionCMS.getPageContentRaw(pageId)
    const md = await blocksToMarkdown(content)
    console.log(md)
    const htmlContent = await blocksToHtml(content)

    if (!artwork) {
      notFound()
    }

    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="mx-auto max-w-4xl">
          {/* Artwork Header */}
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold">
              {artwork["Artwork Title"]}
            </h1>
            {artwork.Artist && (
              <p className="mb-4 text-xl text-muted-foreground">
                by {artwork.Artist}
              </p>
            )}

            {/* Medium as Tag */}
            {artwork.Medium && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary">{artwork.Medium}</Badge>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8 mb-8 lg:grid-cols-2">
            {/* Artwork Image */}
            {artwork.Image && artwork.Image.length > 0 && (
              <div className="space-y-4">
                <div className="overflow-hidden relative rounded-lg aspect-square">
                  <Image
                    src={artwork.Image[0].url}
                    alt={artwork["Artwork Title"] || "Artwork"}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Artwork Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Artwork Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {artwork.Price && (
                    <div className="flex justify-between">
                      <span className="font-medium">Price:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${artwork.Price}
                      </span>
                    </div>
                  )}

                  {artwork.Medium && (
                    <div className="flex justify-between">
                      <span className="font-medium">Medium:</span>
                      <span>{artwork.Medium}</span>
                    </div>
                  )}

                  {artwork.Dimensions && (
                    <div className="flex justify-between">
                      <span className="font-medium">Dimensions:</span>
                      <span>{artwork.Dimensions}</span>
                    </div>
                  )}

                  {artwork["Date Acquired"] && (
                    <div className="flex justify-between">
                      <span className="font-medium">Date Acquired:</span>
                      <span>{artwork["Date Acquired"].getFullYear()}</span>
                    </div>
                  )}

                  {artwork.Status && (
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant="secondary">{artwork.Status}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Page Content */}
          {content && content.length > 0 && (
            <div className="mt-12">
              <Card>
                <CardHeader>
                  <CardTitle>About This Artwork</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">
                    <ReactMarkdown>{md}</ReactMarkdown>
                  </p>
                  <hr />
                  <hr />
                  <div
                    className="max-w-none prose prose-lg"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />

                  {/* <div className="max-w-none prose prose-lg">
                    {pageContent.map((block, index) => (
                      <div key={index} className="mb-4">
                        {renderBlock(block)}
                      </div>
                    ))}
                  </div> */}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error fetching artwork:", error)
    // notFound();
  }
}

import { NotionCMS } from "@mikemajara/notion-cms";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Import to ensure prototype extensions are executed
import "@/notion/notion-types-art-gallery-inventory";

export default async function ArtworkPage({
  params,
}: {
  params: { id: string };
}) {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!, {
    files: {
      strategy: "direct",
    },
  });

  try {
    // Fetch the specific artwork by ID using the generated query method
    const artworkResults = await notionCMS
      .queryArtGalleryInventory(process.env.NOTION_CMS_DATABASE_ID!)
      .filter("Published", "equals", true)
      .all();

    // Find the artwork with matching ID
    const artwork = artworkResults.find((art) => art.id === params.id);

    if (!artwork) {
      notFound();
    }

    // Fetch the page content blocks
    const pageContent = await notionCMS.getPageContent(params.id);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Artwork Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              {artwork["Artwork Title"]}
            </h1>
            {artwork.Artist && (
              <p className="text-xl text-muted-foreground mb-4">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Artwork Image */}
            {artwork.Image && artwork.Image.length > 0 && (
              <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-lg">
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
          {pageContent && pageContent.length > 0 && (
            <div className="mt-12">
              <Card>
                <CardHeader>
                  <CardTitle>About This Artwork</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-lg max-w-none">
                    {pageContent.map((block, index) => (
                      <div key={index} className="mb-4">
                        {renderBlock(block)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching artwork:", error);
    notFound();
  }
}

// Helper function to render different types of blocks
function renderBlock(block: any) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="mb-4">
          {block.content?.richText?.map((text: any, index: number) => (
            <span
              key={index}
              className={`
                ${text.annotations?.bold ? "font-bold" : ""}
                ${text.annotations?.italic ? "italic" : ""}
                ${text.annotations?.underline ? "underline" : ""}
                ${text.annotations?.strikethrough ? "line-through" : ""}
                ${
                  text.annotations?.code
                    ? "bg-gray-100 px-1 rounded font-mono text-sm"
                    : ""
                }
              `}
            >
              {text.text?.content || ""}
            </span>
          )) || block.content?.text}
        </p>
      );

    case "heading_1":
      return (
        <h1 className="text-3xl font-bold mb-4">{block.content?.text || ""}</h1>
      );

    case "heading_2":
      return (
        <h2 className="text-2xl font-semibold mb-3">
          {block.content?.text || ""}
        </h2>
      );

    case "heading_3":
      return (
        <h3 className="text-xl font-medium mb-2">
          {block.content?.text || ""}
        </h3>
      );

    case "bulleted_list_item":
      return <li className="ml-4 mb-2">{block.content?.text || ""}</li>;

    case "numbered_list_item":
      return <li className="ml-4 mb-2">{block.content?.text || ""}</li>;

    case "image": {
      const imageUrl = block.content?.url;
      const imageCaption = block.content?.caption || "";

      if (imageUrl) {
        return (
          <div className="my-6">
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={imageUrl}
                alt={imageCaption || "Image"}
                fill
                className="object-cover"
              />
            </div>
            {imageCaption && (
              <p className="text-sm text-muted-foreground mt-2 text-center italic">
                {imageCaption}
              </p>
            )}
          </div>
        );
      }
      return null;
    }

    case "divider":
      return <hr className="my-6 border-border" />;

    case "quote":
      return (
        <blockquote className="border-l-4 border-primary pl-4 italic my-4">
          {block.content?.text || ""}
        </blockquote>
      );

    case "code": {
      const codeText = block.content?.text || "";
      const language = block.content?.language || "";

      return (
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4">
          <code className={`text-sm ${language ? `language-${language}` : ""}`}>
            {codeText}
          </code>
        </pre>
      );
    }

    default: {
      // For unsupported block types, try to extract text content
      const text = block.content?.text || "";
      return text ? <div className="mb-4">{text}</div> : null;
    }
  }
}

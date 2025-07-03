import { NotionCMS } from "@mikemajara/notion-cms";
import { RecordResourceTracker } from "@/notion";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "@/notion/notion-types-resource-tracker";

interface ResourceWithContent {
  resource: RecordResourceTracker;
  content: string;
  hasContent: boolean;
}

async function getResourceById(
  id: string
): Promise<ResourceWithContent | null> {
  try {
    const notionCMS = new NotionCMS(process.env.NOTION_API_KEY || "");
    const databaseId = process.env.NOTION_RESOURCE_TRACKER_DATABASE_ID || "";
    console.debug(`id`, id);
    const resource = (await notionCMS
      .queryResourceTracker(databaseId)
      .filter("ID", "equals", parseInt(id))
      .single()) as RecordResourceTracker;

    if (!resource) {
      return null;
    }

    // Fetch page content
    let content = "";
    let hasContent = false;

    try {
      const blocks = await notionCMS.getPageContent(resource.id, true);
      content = notionCMS.blocksToMarkdown(blocks);
      hasContent = blocks.length > 0 && content.trim().length > 0;
    } catch (contentError) {
      console.warn("Could not fetch page content:", contentError);
      // Don't fail the whole request if content fetching fails
    }

    return {
      resource,
      content,
      hasContent,
    };
  } catch (error) {
    console.error("Error fetching resource:", error);
    return null;
  }
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const result = await getResourceById(id);

  if (!result) {
    notFound();
  }

  const { resource, content, hasContent } = result;

  return (
    <div className="container max-w-4xl py-8 mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>
        </Button>
      </div>

      {/* Title Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold">{resource.Title}</h1>
          <Badge variant="outline" className="text-sm">
            {resource.ID?.prefix
              ? `${resource.ID.prefix}-${resource.ID.number}`
              : resource.ID?.number || "N/A"}
          </Badge>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={resource["Is Active"] ? "default" : "destructive"}>
            {resource["Is Active"] ? "Active" : "Inactive"}
          </Badge>
          <Badge
            variant={resource["Tag Compliance"] ? "default" : "destructive"}
          >
            {resource["Tag Compliance"] ? "Compliant" : "Non-compliant"}
          </Badge>
          <Badge
            variant={resource["Can Be Deprovisioned"] ? "secondary" : "outline"}
          >
            {resource["Can Be Deprovisioned"] ? "Can Be Deprovisioned" : "Keep"}
          </Badge>
          {resource["Auto Shutdown Configured"] && (
            <Badge variant="outline">Auto Shutdown Configured</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Resource Type
              </label>
              <div className="mt-1">
                {resource.advanced["Resource Type"] ? (
                  <Badge
                    variant="outline"
                    className={`bg-${resource.advanced["Resource Type"].color}-100`}
                  >
                    {resource.advanced["Resource Type"].name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Environment
              </label>
              <div className="mt-1">
                {resource.advanced.Environment ? (
                  <Badge
                    variant="outline"
                    className={`bg-${resource.advanced.Environment.color}-100`}
                  >
                    {resource.advanced.Environment.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Region
              </label>
              <div className="mt-1">
                {resource.advanced.Region ? (
                  <Badge
                    variant="outline"
                    className={`bg-${resource.advanced.Region.color}-100`}
                  >
                    {resource.advanced.Region.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Team
              </label>
              <div className="mt-1">
                <span>{resource.Team || "N/A"}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Instance Size / Tier
              </label>
              <div className="mt-1">
                <span>{resource["Instance Size / Tier"] || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Cost & Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Estimated Monthly Cost
              </label>
              <div className="mt-1">
                <span className="text-2xl font-bold text-green-600">
                  $
                  {resource["Estimated Monthly Cost (USD)"]?.toFixed(2) ||
                    "0.00"}
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Provision Date
              </label>
              <div className="mt-1">
                <span>
                  {resource["Provision Date"]
                    ? new Date(resource["Provision Date"]).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Last Review Date
              </label>
              <div className="mt-1">
                <span>
                  {resource["Last Review Date"]
                    ? new Date(
                        resource["Last Review Date"]
                      ).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Last Used Date
              </label>
              <div className="mt-1">
                <span>
                  {resource["Last Used Date"]
                    ? new Date(resource["Last Used Date"]).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ownership & Review */}
        <Card>
          <CardHeader>
            <CardTitle>Ownership & Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Owner
              </label>
              <div className="flex items-center gap-2 mt-1">
                {resource.advanced.Owner?.[0]?.avatar_url && (
                  <Avatar className="size-6">
                    <AvatarImage src={resource.advanced.Owner[0].avatar_url} />
                  </Avatar>
                )}
                <span>
                  {resource.advanced.Owner?.map(
                    (person: { name: string | null }) => person.name
                  ).join(", ") || "N/A"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Reviewed by DevOps
              </label>
              <div className="mt-1">
                {resource.advanced["Reviewed by DevOps"]?.name ? (
                  <Badge
                    variant="outline"
                    className={`bg-${resource.advanced["Reviewed by DevOps"].color}-100`}
                  >
                    {resource.advanced["Reviewed by DevOps"].name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Reason for Keeping
              </label>
              <div className="flex flex-wrap gap-1 mt-1">
                {resource.advanced["Reason for Keeping"]?.length > 0 ? (
                  resource.advanced["Reason for Keeping"].map(
                    (reason, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={`bg-${reason.color}-100`}
                      >
                        {reason.name}
                      </Badge>
                    )
                  )
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services & Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Services & Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Service Names
              </label>
              <div className="flex flex-wrap gap-1 mt-1">
                {resource.advanced["Service Name"]?.length > 0 ? (
                  resource.advanced["Service Name"].map((service, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={`bg-${service.color}-100`}
                    >
                      {service.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes & Links - Full Width */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Notes
            </label>
            <div className="mt-1">
              <p className="text-sm leading-relaxed">
                {resource.Notes || "No notes available."}
              </p>
            </div>
          </div>

          {resource["Linked Project / Jira Ticket"] && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Linked Project / Jira Ticket
              </label>
              <div className="mt-1">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={resource["Linked Project / Jira Ticket"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Link
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Section */}
      {hasContent && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Page Content</span>
              <Badge variant="secondary" className="text-xs">
                From Notion
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose-sm prose max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

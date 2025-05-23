import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { NotionCMS } from "@mikemajara/notion-cms";
import { RecordResourceTracker } from "@/notion";
import Link from "next/link";
// Import the generated file to register the queryResourceTracker method
import "@/notion/notion-types-resource-tracker";

async function getResourceTrackerData(): Promise<RecordResourceTracker[]> {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY || "");
  const databaseId = process.env.NOTION_RESOURCE_TRACKER_DATABASE_ID || "";

  const response = notionCMS
    .queryResourceTracker(databaseId)
    .filter("Can Be Deprovisioned", "equals", true)
    .sort("Title")
    .sort("Last Review Date", "descending")
    .all();

  // console.log("response", response[3].Owner);
  return response;
}

export default async function ResourceTrackerPage() {
  const data = await getResourceTrackerData();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Resource Tracker</h1>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>id</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Resource Type</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Service Name</TableHead>
              <TableHead>Instance Size / Tier</TableHead>
              <TableHead>Est. Monthly Cost (USD)</TableHead>
              <TableHead>Provision Date</TableHead>
              <TableHead>Last Review Date</TableHead>
              <TableHead>Last Used Date</TableHead>
              <TableHead>Is Active</TableHead>
              <TableHead>Tag Compliance</TableHead>
              <TableHead>Can Be Deprovisioned</TableHead>
              <TableHead>Auto Shutdown Configured</TableHead>
              <TableHead>Reviewed by DevOps</TableHead>
              <TableHead>Reason for Keeping</TableHead>
              <TableHead>Linked Project / Jira Ticket</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record) => (
              <TableRow
                key={record.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <TableCell>
                  <Link
                    className="hover:underline"
                    href={`/resource/${record.id}`}
                  >
                    {record.id}
                  </Link>
                </TableCell>
                <TableCell>{record.ID || "N/A"}</TableCell>
                <TableCell>{record.Title}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {record.advanced["Resource Type"] && (
                      <span
                        className={`px-2 py-1 text-xs rounded bg-${record.advanced["Resource Type"].color}-100`}
                      >
                        {record.advanced["Resource Type"].name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {record.advanced.Environment && (
                      <span
                        className={`px-2 py-1 text-xs rounded bg-${record.advanced.Environment.color}-100`}
                      >
                        {record.advanced.Environment.name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {record.advanced.Region && (
                      <span
                        className={`px-2 py-1 text-xs rounded bg-${record.advanced.Region.color}-100`}
                      >
                        {record.advanced.Region.name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{record.Team}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {record.advanced.Owner?.[0]?.avatar_url && (
                      <Avatar className="size-4">
                        <AvatarImage
                          src={record.advanced.Owner[0].avatar_url}
                        />
                      </Avatar>
                    )}
                    {record.advanced.Owner?.map(
                      (person: { name: string | null }) => person.name
                    ).join(", ") || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {record.advanced["Service Name"]?.map((service, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs rounded bg-${service.color}-100`}
                      >
                        {service.name}
                      </span>
                    )) || "N/A"}
                  </div>
                </TableCell>
                <TableCell>{record["Instance Size / Tier"] || "N/A"}</TableCell>
                <TableCell>
                  $
                  {record["Estimated Monthly Cost (USD)"]?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell>
                  {record["Provision Date"]
                    ? new Date(record["Provision Date"]).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {record["Last Review Date"]
                    ? new Date(record["Last Review Date"]).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {record["Last Used Date"]
                    ? new Date(record["Last Used Date"]).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      record["Is Active"]
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {record["Is Active"] ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      record["Tag Compliance"]
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {record["Tag Compliance"] ? "Compliant" : "Non-compliant"}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      record["Can Be Deprovisioned"]
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {record["Can Be Deprovisioned"] ? "Yes" : "No"}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      record["Auto Shutdown Configured"]
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {record["Auto Shutdown Configured"] ? "Yes" : "No"}
                  </span>
                </TableCell>
                <TableCell>
                  {record.advanced["Reviewed by DevOps"]?.name ? (
                    <span
                      className={`px-2 py-1 text-xs rounded bg-${record.advanced["Reviewed by DevOps"].color}-100`}
                    >
                      {record.advanced["Reviewed by DevOps"].name}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {record.advanced["Reason for Keeping"]?.map(
                      (reason, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs rounded bg-${reason.color}-100`}
                        >
                          {reason.name}
                        </span>
                      )
                    ) || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  {record["Linked Project / Jira Ticket"] ? (
                    <a
                      href={record["Linked Project / Jira Ticket"]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Link
                    </a>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={record.Notes}>
                    {record.Notes || "N/A"}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

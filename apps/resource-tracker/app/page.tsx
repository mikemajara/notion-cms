import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ResourceTrackerRecord } from "../notion/notion-types-resource-tracker";
import { NotionCMS } from "notion-cms";

async function getResourceTrackerData() {
  try {
    const notionCMS = new NotionCMS(process.env.NOTION_API_KEY || "");
    const databaseId = process.env.NOTION_RESOURCE_TRACKER_DATABASE_ID;

    if (!databaseId) {
      throw new Error("Database ID is not configured");
    }

    const response = await notionCMS.getDatabase<ResourceTrackerRecord>(
      databaseId,
      {
        pageSize: 100,
        sorts: [{ property: "Title", direction: "ascending" }],
      }
    );

    return response;
  } catch (error) {
    console.error("Failed to fetch resource tracker data:", error);
    throw error;
  }
}

export default async function ResourceTrackerPage() {
  const data = await getResourceTrackerData();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Resource Tracker</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Resource Type</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Est. Monthly Cost</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.Title}</TableCell>
                <TableCell>{record["Resource Type"]}</TableCell>
                <TableCell>{record.Environment}</TableCell>
                <TableCell>{record.Team}</TableCell>
                <TableCell>
                  {record.Owner?.map((person) => person.name).join(", ") ||
                    "N/A"}
                </TableCell>
                <TableCell>
                  $
                  {record["Estimated Monthly Cost (USD)"]?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell>
                  {record["Is Active"] ? "Active" : "Inactive"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

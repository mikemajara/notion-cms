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
import { Avatar, AvatarImage } from "@/components/ui/avatar";

async function getResourceTrackerData() {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY || "");
  const databaseId = process.env.NOTION_RESOURCE_TRACKER_DATABASE_ID || "";

  // const response = await notionCMS.getDatabase<ResourceTrackerRecord>(
  //   databaseId,
  //   {
  //     pageSize: 100,
  //     sorts: [{ property: "Title", direction: "ascending" }],
  //   }
  // );
  const response = await notionCMS
    .query(databaseId)
    .sort("Title", "ascending")
    .all();
  console.log("response", response[3].Owner);
  return response;
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
              <TableHead>Raw</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.Title}</TableCell>
                <TableCell
                  className={`bg-${record.advanced["Resource Type"].color}-100`}
                >
                  {record["Resource Type"]}
                </TableCell>
                <TableCell>{record.Environment}</TableCell>
                <TableCell>{record.Team}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-4">
                      <AvatarImage
                        src={record.advanced.Owner[0]?.avatar_url || ""}
                      />
                    </Avatar>
                    {record.advanced.Owner?.map(
                      (person: { name: string | null }) => person.name
                    ).join(", ") || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  $
                  {record["Estimated Monthly Cost (USD)"]?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell>
                  {record["Is Active"] ? "Active" : "Inactive"}
                </TableCell>
                <TableCell>{JSON.stringify(record.advanced)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

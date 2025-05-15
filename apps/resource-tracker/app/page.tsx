import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { NotionCMS } from "@mikemajara/notion-cms";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { query, RecordResourceTracker } from "@/notion";

async function getResourceTrackerData() {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY || "");
  const databaseId = process.env.NOTION_RESOURCE_TRACKER_DATABASE_ID || "";

  // Use the NotionCMS query method until we run the generator to create the type-safe query
  // const response = await notionCMS
  //   .query<RecordResourceTracker>(databaseId)
  //   .filter("Resource Type")
  //   .equals("EC2")
  //   .all();

  // FIX: Example not working
  // const response = await query(notionCMS, databaseId)
  //   .filter("Reason for Keeping")
  //   .equals(["Critical service"])
  //   .all();

  const response = await query(notionCMS, databaseId)
    .filter("Reason for Keeping")
    .contains("Critical service")
    .all();

  // console.log("response", response[3].Owner);
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
            {data.map((record: RecordResourceTracker) => (
              <TableRow key={record.ID}>
                <TableCell>{record.Title}</TableCell>
                <TableCell
                  className={`bg-${
                    record.advanced["Resource Type"]?.color || "gray"
                  }-100`}
                >
                  {record["Resource Type"]}
                </TableCell>
                <TableCell>{record.Environment}</TableCell>
                <TableCell>{record.Team}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-4">
                      <AvatarImage
                        src={record.advanced.Owner?.[0]?.avatar_url || ""}
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

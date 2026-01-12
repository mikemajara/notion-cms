import { Card, CardContent } from "@/components/ui/card"
import { NotionCMS } from "../notion"

export default async function Home() {
  const notionCMS = new NotionCMS(process.env.NOTION_API_KEY!)
  // TODO: Simple record doesn't support Status property
  // need to include that in the notion-cms library such that
  // status resolves to single select if it's the same type
  // in the notion API
  const clients = await notionCMS
    .query("eRPDataSourceClients", { recordType: "simple" })
    .all()

  const projects = await notionCMS
    .query("eRPDataSourceProjects", { recordType: "simple" })
    .all()

  console.log(clients)
  console.log(projects)

  return (
    <div className="flex flex-col gap-5 items-center px-5 w-full min-h-screen">
      <h1 className="text-2xl font-bold">Notion Source</h1>
      <Card className="w-full">
        <CardContent>
          <iframe
            src="https://mikemajara.notion.site/ebd/2822a789c1fc8007b7caeaba2ccb3eeb?v=2822a789c1fc802dbe93000c5d82d82f"
            width="100%"
            height="600"
            frameborder="0"
            allowfullscreen
          />
        </CardContent>
      </Card>
      {/* Hero Section */}
      <h1 className="text-2xl font-bold">HTML Table From simple record</h1>
      <Card className="w-full">
        <CardContent>
          <table className="w-full table-auto">
            <thead className="text-gray-500 bg-gray-100">
              <tr className="text-left border-b">
                <th className="px-4 py-2">Client Name</th>
                <th className="px-4 py-2">Contact Person</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Projects</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {clients.map((client) => (
                <tr key={client.id} className="border-b hover:bg-gray-50">
                  <td>{client["Client Name"]}</td>
                  <td>{client["Contact Person"]}</td>
                  <td>{client["Email"]}</td>
                  <td>{client["Phone"]}</td>
                  <td>{client.Status}</td>
                  <td>
                    {
                      projects.find((project) =>
                        project.Client.includes(client.id)
                      )?.["Project Name"]
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

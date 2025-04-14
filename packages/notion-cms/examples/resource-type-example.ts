import { NotionCMS } from "../src";

// Initialize the Notion CMS client
const notionCms = new NotionCMS(process.env.NOTION_API_KEY || "");

// Example: Database ID for a resources database
const databaseId = process.env.NOTION_DATABASE_ID || "";

/**
 * Example demonstrating the layered API approach for a Resource Type multi-select field
 */
async function runResourceTypeExample() {
  try {
    console.log("Fetching resource records using the layered API...");

    // Fetch database records using the advanced API
    const { results } = await notionCms.getDatabaseAdvanced(databaseId);

    if (results.length === 0) {
      console.log("No records found");
      return;
    }

    // Loop through each record to demonstrate multi-select access
    for (const record of results) {
      console.log(
        `\n--- RECORD: ${record.Title || record.Name || record.id} ---`
      );

      // Check if the record has a Resource Type property
      if ("Resource Type" in record) {
        // Simple API access - string value
        const simpleValue = record["Resource Type"];
        console.log("Simple access:");
        console.log(simpleValue); // "EC2" or similar

        // Advanced API access - full object with id, name, and color
        const advancedValue = record.advanced["Resource Type"];
        console.log("\nAdvanced access:");
        console.log(JSON.stringify(advancedValue, null, 2));
        // Output example:
        // {
        //   "id": "t|O@",
        //   "name": "EC2",
        //   "color": "yellow"
        // }

        // Raw API access - original Notion API response
        const rawValue = record.raw.properties["Resource Type"];
        console.log("\nRaw access:");
        console.log("Type:", rawValue.type);

        // Example usage in application code
        console.log("\nExample usage:");

        // Using simple value for display
        console.log(`Resource Type: ${simpleValue}`);

        // Using advanced value for styling based on color
        if (Array.isArray(advancedValue)) {
          // For multi-select with multiple values
          for (const item of advancedValue) {
            console.log(
              `<span class="tag tag-${item.color}">${item.name}</span>`
            );
          }
        } else if (advancedValue && typeof advancedValue === "object") {
          // For single select
          console.log(
            `<span class="tag tag-${advancedValue.color}">${advancedValue.name}</span>`
          );
        }

        // Break after the first resource with this property
        break;
      }
    }

    console.log("\n--- COMPARISON TO REGULAR API ---");
    // Demonstrate the same using the regular API (for comparison)
    const regularResults = await notionCms.getDatabase(databaseId);
    const regularRecord = regularResults.results[0];

    if ("Resource Type" in regularRecord) {
      console.log("Regular API access:");
      console.log(regularRecord["Resource Type"]); // Just the string value
      console.log("No advanced or raw access available in regular API");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
runResourceTypeExample();

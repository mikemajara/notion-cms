import { NotionCMS } from "../src";

// Initialize the Notion CMS client
const notionCms = new NotionCMS(process.env.NOTION_API_KEY || "");

// Example: Database ID for a resources database
const databaseId = process.env.NOTION_DATABASE_ID || "";

/**
 * Example demonstrating the unified API approach with layered access
 */
async function runExample() {
  try {
    console.log("Fetching records with unified API...");

    // Fetch database records - now all access levels are included automatically
    const { results } = await notionCms.getDatabase(databaseId);

    if (results.length === 0) {
      console.log("No records found");
      return;
    }

    // Get the first record for demonstration
    const record = results[0];

    console.log("\n--- RECORD ID ---");
    console.log(record.id);

    // Example 1: Accessing a Title Property at different levels
    console.log("\n--- TITLE PROPERTY EXAMPLE ---");
    // Assuming the database has a 'Name' property of type 'title'
    if ("Name" in record) {
      console.log("Simple access (direct property):");
      console.log(record["Name"]); // Simple string - directly on the record

      console.log("\nAdvanced access (.advanced property):");
      if (record.advanced && "Name" in record.advanced) {
        console.log(record.advanced["Name"]); // Array with formatting info
      } else {
        console.log("Advanced data not available");
      }

      console.log("\nRaw access (.raw property):");
      if (
        record.raw &&
        record.raw.properties &&
        "Name" in record.raw.properties
      ) {
        console.log(record.raw.properties["Name"]); // Raw Notion API response
      } else {
        console.log("Raw data not available");
      }
    }

    // Example 2: Accessing a Multi-Select Property at different levels
    console.log("\n--- MULTI-SELECT PROPERTY EXAMPLE ---");
    // Assuming the database has a 'Tags' property of type 'multi_select'
    if ("Tags" in record) {
      console.log("Simple access (direct property):");
      console.log(record["Tags"]); // Array of strings

      console.log("\nAdvanced access (.advanced property):");
      if (record.advanced && "Tags" in record.advanced) {
        console.log(record.advanced["Tags"]); // Array of objects with id, name, color
      } else {
        console.log("Advanced data not available");
      }

      console.log("\nRaw access (.raw property):");
      if (
        record.raw &&
        record.raw.properties &&
        "Tags" in record.raw.properties
      ) {
        console.log(record.raw.properties["Tags"]); // Raw Notion API response
      } else {
        console.log("Raw data not available");
      }
    }

    // Example 3: Demonstrating different coding patterns
    console.log("\n--- CODING PATTERNS ---");

    console.log("1. Direct property access (simple):");
    for (const key of Object.keys(record).filter(
      (k) => k !== "advanced" && k !== "raw"
    )) {
      if (typeof record[key] !== "function" && key !== "id") {
        console.log(
          `${key}: ${JSON.stringify(record[key]).substring(0, 50)}...`
        );
      }
    }

    console.log("\n2. Advanced property access:");
    if (record.advanced) {
      for (const key of Object.keys(record.advanced)) {
        if (key !== "id") {
          console.log(
            `${key}: ${JSON.stringify(record.advanced[key]).substring(
              0,
              50
            )}...`
          );
        }
      }
    } else {
      console.log("Advanced data not available");
    }

    console.log(
      "\n3. Accessing specific properties with both simple and advanced data:"
    );
    if ("Description" in record) {
      console.log(`Simple: ${record.Description}`);
      if (record.advanced && "Description" in record.advanced) {
        console.log(
          `Advanced: ${JSON.stringify(record.advanced.Description).substring(
            0,
            100
          )}...`
        );
      } else {
        console.log("Advanced description data not available");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
runExample();

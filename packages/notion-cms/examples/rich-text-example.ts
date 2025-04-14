import { NotionCMS } from "../src";

// Initialize the Notion CMS client
const notionCms = new NotionCMS(process.env.NOTION_API_KEY || "");

// Example: Database ID for a database with rich text
const databaseId = process.env.NOTION_DATABASE_ID || "";

/**
 * Example demonstrating the layered API approach for rich text fields with formatting
 */
async function runRichTextExample() {
  try {
    console.log("Fetching records with rich text using the layered API...");

    // Fetch database records using the advanced API
    const { results } = await notionCms.getDatabaseAdvanced(databaseId);

    if (results.length === 0) {
      console.log("No records found");
      return;
    }

    // Find a record with a Description property (or any rich text property)
    const record = results.find(
      (record) =>
        "Description" in record &&
        record.advanced.Description &&
        Array.isArray(record.advanced.Description) &&
        record.advanced.Description.length > 0
    );

    if (!record) {
      console.log("No records with rich text Description found");
      return;
    }

    console.log(
      `\n--- RECORD: ${record.Title || record.Name || record.id} ---`
    );

    // Simple API access - just the text content
    console.log("\nSimple access (plain text):");
    console.log(record.Description);
    // Example: "A dark green leafy vegetable"

    // Advanced API access - full formatting information
    console.log("\nAdvanced access (with formatting):");
    console.log(JSON.stringify(record.advanced.Description, null, 2));
    // Example output:
    // [
    //   {
    //     "content": "A dark ",
    //     "annotations": { "bold": false, "italic": false, "color": "default" },
    //     "href": null
    //   },
    //   {
    //     "content": "green",
    //     "annotations": { "bold": false, "italic": false, "color": "green" },
    //     "href": null
    //   },
    //   {
    //     "content": " leafy vegetable",
    //     "annotations": { "bold": false, "italic": false, "color": "default" },
    //     "href": null
    //   }
    // ]

    // Raw API access - original Notion API response
    console.log("\nRaw access:");
    console.log("Type:", record.raw.properties.Description.type);

    // Example: Converting to HTML with formatting
    console.log("\nConverting to HTML with color formatting:");
    const html = convertRichTextToHtml(record.advanced.Description);
    console.log(html);
    // Example: <span>A dark </span><span style="color: green;">green</span><span> leafy vegetable</span>

    // Example: Converting to HTML with Tailwind classes
    console.log("\nConverting to HTML with Tailwind classes:");
    const tailwindHtml = convertRichTextToTailwind(record.advanced.Description);
    console.log(tailwindHtml);
    // Example: <span>A dark </span><span class="text-green-500">green</span><span> leafy vegetable</span>
  } catch (error) {
    console.error("Error:", error);
  }
}

/**
 * Helper function to convert rich text to HTML with inline styles
 */
function convertRichTextToHtml(richText: any[]): string {
  if (!Array.isArray(richText)) return "";

  return richText
    .map((segment) => {
      const { content, annotations } = segment;

      // Start with basic span
      let html = "<span";

      // Add style attributes based on annotations
      const styles: string[] = [];

      if (annotations) {
        if (annotations.bold) styles.push("font-weight: bold");
        if (annotations.italic) styles.push("font-style: italic");
        if (annotations.underline) styles.push("text-decoration: underline");
        if (annotations.strikethrough)
          styles.push("text-decoration: line-through");
        if (annotations.color && annotations.color !== "default") {
          styles.push(`color: ${getColorValue(annotations.color)}`);
        }
      }

      // Add style attribute if needed
      if (styles.length > 0) {
        html += ` style="${styles.join("; ")}"`;
      }

      // Add href if present
      if (segment.href) {
        return `<a href="${segment.href}" ${
          styles.length > 0 ? `style="${styles.join("; ")}"` : ""
        }>${content}</a>`;
      }

      // Close the tag and add content
      html += `>${content}</span>`;

      return html;
    })
    .join("");
}

/**
 * Helper function to convert rich text to HTML with Tailwind classes
 */
function convertRichTextToTailwind(richText: any[]): string {
  if (!Array.isArray(richText)) return "";

  return richText
    .map((segment) => {
      const { content, annotations } = segment;

      // Start with basic span
      let html = "<span";

      // Add Tailwind classes based on annotations
      const classes: string[] = [];

      if (annotations) {
        if (annotations.bold) classes.push("font-bold");
        if (annotations.italic) classes.push("italic");
        if (annotations.underline) classes.push("underline");
        if (annotations.strikethrough) classes.push("line-through");
        if (annotations.color && annotations.color !== "default") {
          classes.push(getTailwindColor(annotations.color));
        }
      }

      // Add class attribute if needed
      if (classes.length > 0) {
        html += ` class="${classes.join(" ")}"`;
      }

      // Add href if present
      if (segment.href) {
        return `<a href="${segment.href}" ${
          classes.length > 0 ? `class="${classes.join(" ")}"` : ""
        }>${content}</a>`;
      }

      // Close the tag and add content
      html += `>${content}</span>`;

      return html;
    })
    .join("");
}

/**
 * Helper function to convert Notion colors to CSS color values
 */
function getColorValue(color: string): string {
  const colorMap: Record<string, string> = {
    blue: "#0077cc",
    brown: "#8d6e63",
    gray: "#9e9e9e",
    green: "#00aa55",
    orange: "#f57c00",
    pink: "#e91e63",
    purple: "#9c27b0",
    red: "#e53935",
    yellow: "#ffc107",
    blue_background: "#e3f2fd",
    brown_background: "#efebe9",
    gray_background: "#f5f5f5",
    green_background: "#e8f5e9",
    orange_background: "#fff3e0",
    pink_background: "#fce4ec",
    purple_background: "#f3e5f5",
    red_background: "#ffebee",
    yellow_background: "#fffde7",
  };

  return colorMap[color] || "inherit";
}

/**
 * Helper function to convert Notion colors to Tailwind classes
 */
function getTailwindColor(color: string): string {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600",
    brown: "text-amber-800",
    gray: "text-gray-500",
    green: "text-green-600",
    orange: "text-orange-500",
    pink: "text-pink-500",
    purple: "text-purple-600",
    red: "text-red-600",
    yellow: "text-yellow-500",
    blue_background: "bg-blue-100",
    brown_background: "bg-amber-100",
    gray_background: "bg-gray-100",
    green_background: "bg-green-100",
    orange_background: "bg-orange-100",
    pink_background: "bg-pink-100",
    purple_background: "bg-purple-100",
    red_background: "bg-red-100",
    yellow_background: "bg-yellow-100",
  };

  return colorMap[color] || "";
}

// Run the example
runRichTextExample();

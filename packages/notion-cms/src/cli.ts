#!/usr/bin/env node

import { Command } from "commander";
import { generateTypes, generateMultipleDatabaseTypes } from "./generator";
import * as path from "path";
import * as fs from "fs";
import * as readline from "readline";

const program = new Command();

// Helper function to create readline interface for user prompts
function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Helper function to prompt user for confirmation
async function confirmOverwrite(filePath: string): Promise<boolean> {
  const rl = createPrompt();

  return new Promise((resolve) => {
    rl.question(
      `File already exists: ${filePath}\nDo you want to overwrite it? (y/N): `,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === "y");
      }
    );
  });
}

program
  .name("notion-cms")
  .description("CLI for generating TypeScript types from Notion databases");

program
  .command("generate")
  .description("Generate TypeScript types from a Notion database")
  .option("-d, --database <id>", "Notion database ID (for single database)")
  .option(
    "--databases <ids>",
    "Multiple Notion database IDs separated by commas"
  )
  .option("-o, --output <path>", "Output path", "./notion")
  .requiredOption("-t, --token <token>", "Notion API token")
  .option("-f, --force", "Force overwrite existing files without asking", false)
  .action(async (options) => {
    try {
      // Validate that either --database or --databases is provided
      if (!options.database && !options.databases) {
        console.error(
          "Error: Either --database or --databases must be provided"
        );
        process.exit(1);
      }

      if (options.database && options.databases) {
        console.error(
          "Error: Cannot use both --database and --databases options"
        );
        process.exit(1);
      }

      const outputPath = path.resolve(process.cwd(), options.output);

      // Parse database IDs
      const databaseIds = options.databases
        ? options.databases.split(",").map((id: string) => id.trim())
        : [options.database];

      console.log(
        `Generating types for ${
          databaseIds.length === 1 ? "database" : "databases"
        }: ${databaseIds.join(", ")}`
      );
      console.log(`Output path: ${outputPath}`);

      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      // For multiple databases, we'll generate a combined file
      if (databaseIds.length > 1) {
        await generateMultipleDatabaseTypes(
          databaseIds,
          outputPath,
          options.token,
          options.force
        );
      } else {
        // Single database - use existing logic
        const baseTypesFile = path.join(outputPath, "notion-types.ts");
        if (fs.existsSync(baseTypesFile) && !options.force) {
          const shouldOverwrite = await confirmOverwrite(baseTypesFile);
          if (!shouldOverwrite) {
            console.log("Keeping existing notion-types.ts file.");
          } else {
            fs.unlinkSync(baseTypesFile);
            console.log("Overwriting existing notion-types.ts file.");
          }
        } else if (fs.existsSync(baseTypesFile) && options.force) {
          fs.unlinkSync(baseTypesFile);
          console.log("Force overwriting existing notion-types.ts file.");
        }

        await generateTypes(
          databaseIds[0],
          outputPath,
          options.token,
          options.force
        );
      }

      console.log("Types generated successfully!");
    } catch (error) {
      console.error("Error generating types:", error);
      process.exit(1);
    }
  });

program.parse(process.argv);

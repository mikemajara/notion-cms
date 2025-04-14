#!/usr/bin/env node

import { Command } from "commander";
import { generateTypes } from "./generator";
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
  .requiredOption("-d, --database <id>", "Notion database ID")
  .option("-o, --output <path>", "Output path", "./notion")
  .requiredOption("-t, --token <token>", "Notion API token")
  .option("-f, --force", "Force overwrite existing files without asking", false)
  .action(async (options) => {
    try {
      const outputPath = path.resolve(process.cwd(), options.output);

      console.log(`Generating types for database: ${options.database}`);
      console.log(`Output path: ${outputPath}`);

      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      // Check if the base types file exists and prompt for overwrite if needed
      const baseTypesFile = path.join(outputPath, "notion-types.ts");
      if (fs.existsSync(baseTypesFile) && !options.force) {
        const shouldOverwrite = await confirmOverwrite(baseTypesFile);
        if (!shouldOverwrite) {
          console.log("Keeping existing notion-types.ts file.");
        } else {
          // Delete the file so it will be regenerated
          fs.unlinkSync(baseTypesFile);
          console.log("Overwriting existing notion-types.ts file.");
        }
      } else if (fs.existsSync(baseTypesFile) && options.force) {
        // Force delete the file if the force flag is set
        fs.unlinkSync(baseTypesFile);
        console.log("Force overwriting existing notion-types.ts file.");
      }

      await generateTypes(
        options.database,
        outputPath,
        options.token,
        options.force
      );

      console.log("Types generated successfully!");
    } catch (error) {
      console.error("Error generating types:", error);
      process.exit(1);
    }
  });

program.parse(process.argv);

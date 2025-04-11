#!/usr/bin/env node

import { Command } from "commander";
import { generateTypes } from "./generator";

const program = new Command();

program
  .name("notion-cms")
  .description("Generate TypeScript types from Notion databases")
  .version("0.0.1");

program
  .command("generate")
  .description("Generate TypeScript types from a Notion database")
  .argument("<database-id>", "ID of the Notion database")
  .requiredOption("-t, --token <token>", "Notion API token")
  .option(
    "-o, --output <path>",
    "Output directory for generated types",
    "./src/types"
  )
  .action(
    async (databaseId: string, options: { token: string; output: string }) => {
      try {
        await generateTypes(databaseId, options.output, options.token);
        console.log("✨ Types generated successfully!");
      } catch (error) {
        console.error("Error generating types:", error);
        process.exit(1);
      }
    }
  );

program.parse();

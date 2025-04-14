#!/usr/bin/env node

import { Command } from "commander";
import { generateTypes } from "./generator";
import * as path from "path";

const program = new Command();

program
  .name("notion-cms")
  .description("CLI for generating TypeScript types from Notion databases");

program
  .command("generate")
  .description("Generate TypeScript types from a Notion database")
  .requiredOption("-d, --database <id>", "Notion database ID")
  .option("-o, --output <path>", "Output path", "./notion")
  .requiredOption("-t, --token <token>", "Notion API token")
  .action(async (options) => {
    try {
      const outputPath = path.resolve(process.cwd(), options.output);

      console.log(`Generating types for database: ${options.database}`);
      console.log(`Output path: ${outputPath}`);

      await generateTypes(options.database, outputPath, options.token);

      console.log("Types generated successfully!");
    } catch (error) {
      console.error("Error generating types:", error);
      process.exit(1);
    }
  });

program.parse(process.argv);

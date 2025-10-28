#!/usr/bin/env node

import { Command } from "commander"
import { generateTypes, generateMultipleDatabaseTypes } from "./generator"
import * as path from "path"
import * as fs from "fs"
import packageJson from "../package.json"

const program = new Command()

program
  .name("notion-cms " + packageJson.version)
  .description("CLI for generating TypeScript types from Notion databases")

program
  .command("generate")
  .description("Generate TypeScript types from a Notion database")
  .option("-d, --database <id>", "Notion database ID (for single database)")
  .option(
    "--databases <ids>",
    "Multiple Notion database IDs separated by commas"
  )
  .option("-o, --output <path>", "Output path", "./notion")
  .option("-v, --version", "Show version")
  .requiredOption("-t, --token <token>", "Notion API token")
  .action(async (options) => {
    try {
      if (options.version) {
        console.log(packageJson.version)
        process.exit(0)
      }

      if (!options.database && !options.databases) {
        console.error(
          "Error: Either --database or --databases must be provided"
        )
        process.exit(1)
      }

      if (options.database && options.databases) {
        console.error(
          "Error: Cannot use both --database and --databases options"
        )
        process.exit(1)
      }

      const outputPath = path.resolve(process.cwd(), options.output)

      const databaseIds = options.databases
        ? options.databases.split(",").map((id: string) => id.trim())
        : [options.database]

      console.log(
        `Generating types for ${
          databaseIds.length === 1 ? "database" : "databases"
        }: ${databaseIds.join(", ")}`
      )
      console.log(`Output path: ${outputPath}`)

      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true })
      }

      if (databaseIds.length > 1) {
        await generateMultipleDatabaseTypes(
          databaseIds,
          outputPath,
          options.token
        )
      } else {
        const baseTypesFile = path.join(outputPath, "notion-types.ts")
        if (fs.existsSync(baseTypesFile)) {
          fs.unlinkSync(baseTypesFile)
        }
        const results = await generateTypes(
          databaseIds[0],
          outputPath,
          options.token
        )

        if (results.length > 0) {
          console.log(
            `Generated data sources for ${databaseIds[0]}: ${results
              .map((entry) => entry.databaseKey)
              .join(", ")}`
          )
        }
      }

      console.log("Types generated successfully!")
    } catch (error) {
      console.error("Error generating types:", error)
      process.exit(1)
    }
  })

program.parse(process.argv)

#!/usr/bin/env node

import { Command } from "commander"
import { generateTypes } from "./generator"
import * as path from "path"
import * as fs from "fs"
import packageJson from "../package.json"

const program = new Command()

program
  .name("notion-cms " + packageJson.version)
  .description("CLI for generating TypeScript types from Notion databases")

program
  .command("generate")
  .description("Generate TypeScript types from Notion databases")
  .option(
    "-d, --databases <ids...>",
    "Notion database IDs (comma-separated or repeat flag)"
  )
  .option(
    "--database-prefix",
    "Prefix generated data source names with their parent database name"
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

      const outputPath = path.resolve(process.cwd(), options.output)

      const databaseInput = options.databases
      if (!databaseInput) {
        console.error("Error: --databases must be provided")
        process.exit(1)
      }

      const databaseIds = (
        Array.isArray(databaseInput) ? databaseInput : [databaseInput]
      )
        .flatMap((id: string) =>
          String(id)
            .split(/[\s,]+/)
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
        )
        .filter((id: string) => id.length > 0)
        .filter((id: string, index: number, all: string[]) => {
          return all.indexOf(id) === index
        })

      if (databaseIds.length === 0) {
        console.error("Error: Provide at least one Notion database ID")
        process.exit(1)
      }

      console.log(
        `Generating types for ${
          databaseIds.length === 1 ? "database" : "databases"
        }: ${databaseIds.join(", ")}`
      )
      console.log(`Output path: ${outputPath}`)

      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true })
      }

      const baseTypesFile = path.join(outputPath, "notion-types.ts")
      if (fs.existsSync(baseTypesFile)) {
        fs.unlinkSync(baseTypesFile)
      }

      const includeDatabasePrefix = Boolean(options.databasePrefix)

      for (const databaseId of databaseIds) {
        const results = await generateTypes(
          databaseId,
          outputPath,
          options.token,
          {
            includeDatabaseNamePrefix: includeDatabasePrefix
          }
        )

        if (results.length > 0) {
          console.log(
            `Generated data sources for ${databaseId}: ${results
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

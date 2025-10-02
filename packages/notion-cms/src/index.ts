export { NotionCMS, registerDatabase } from "./client"
export type { DatabaseRegistry } from "./client"

export type { NotionCMSConfig } from "./config"

export { QueryBuilder, OPERATOR_MAP } from "./database/query-builder"
export type {
  SortDirection,
  LogicalOperator,
  FilterCondition,
  QueryResult,
  NotionFieldType,
  DatabaseFieldMetadata,
  OperatorMap,
  FieldTypeFor,
  OperatorsFor,
  SelectOptionsFor,
  ValueTypeFor,
  ValueTypeMap,
  TypeSafeFilterCondition
} from "./database/query-builder"

export type {
  ContentBlockAdvanced,
  ContentTableRowAdvanced,
  ContentBlockRaw
} from "./types/content-types"

export type {
  SimpleBlock,
  TableBlockContent,
  TableRowCell,
  TableRowBlockContent,
  SimpleTableBlock,
  SimpleTableRowBlock
} from "./content/content-converter"

export type { DatabaseRecord } from "./types/public"

export {
  richTextToPlain,
  richTextToMarkdown,
  richTextToHtml
} from "./utils/rich-text"

export { blocksToMarkdown } from "./content/block-content-converter/converter-raw-markdown"
export { blocksToHtml } from "./content/block-content-converter/converter-raw-html"
export {
  convertRecordToSimple,
  convertRecordToAdvanced,
  convertRecord,
  convertRecords
} from "./database/record-processor"
export {
  convertBlockToSimple,
  convertBlocksToSimple,
  convertBlocksToAdvanced
} from "./content/block-converter"

export { NotionCMS, registerDatabase } from "./client"
export type { DatabaseRegistry } from "./client"

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
  SimpleTableRowBlock,
  NotionCMSConfig
} from "./content/content-converter"

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
  NotionPropertyType,
  NotionProperty
} from "./utils/property-helpers"
export type { DatabaseRecord, DatabaseRecordType } from "./types/public"
export type { RecordGetOptions } from "./database/database-service"

export { BlockProcessor } from "./content/processor"
export { PageContentService } from "./content/page-content-service"
export { DatabaseService } from "./database/database-service"
export { richTextToPlain, richTextToMarkdown } from "./utils/rich-text"
export { richTextToHtml } from "./utils/rich-text"
export {
  groupConsecutiveListItems,
  mapRawBlocksWithDepth,
  walkRawBlocks
} from "./utils/block-traversal"
export { blocksToMarkdown } from "./content/block-content-converter/converter-raw-markdown"
export { blocksToHtml } from "./content/block-content-converter/converter-raw-html"

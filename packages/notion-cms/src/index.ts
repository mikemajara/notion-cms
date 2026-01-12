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
  ContentBlockRaw,
  ContentTableRowAdvanced,
  DatabaseRecord
} from "@notion-utils/types"

export {
  convertRecordToSimple,
  convertRecordToAdvanced,
  convertRecord,
  convertRecords
} from "./database/record-processor"

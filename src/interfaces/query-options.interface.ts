import {
  FilterQuery,
  ProjectionType,
  QueryOptions as MongooseQueryOptions,
  PopulateOptions as MongoosePopulateOptions,
  ClientSession,
} from 'mongoose';

/**
 * Pagination configuration options.
 */
export interface PaginationOptions {
  /** Page number (1-indexed). Defaults to 1. */
  page?: number;
  /** Number of items per page. Defaults to 10. */
  limit?: number;
}

/**
 * Sort order type compatible with Mongoose.
 * Use 1 or 'asc' for ascending, -1 or 'desc' for descending.
 */
export type SortOrder = 1 | -1 | 'asc' | 'desc';

/**
 * Sort options object where keys are field names and values are sort orders.
 * @example { createdAt: -1, name: 1 }
 */
export interface SortOptions {
  [key: string]: SortOrder;
}

/**
 * Options for find/read operations.
 * @template T - The document type
 */
export interface FindOptions<T> {
  /** Mongoose filter query to match documents */
  filter?: FilterQuery<T>;
  /** Fields to include or exclude from the result */
  projection?: ProjectionType<T>;
  /** Sort order for the results */
  sort?: SortOptions;
  /** Pagination options */
  pagination?: PaginationOptions;
  /** Populate options for referenced documents */
  populate?: string | string[] | MongoosePopulateOptions | MongoosePopulateOptions[];
  /** Additional Mongoose query options */
  options?: MongooseQueryOptions<T>;
  /** MongoDB session for transaction support */
  session?: ClientSession;
}

/**
 * Result structure for paginated queries.
 * @template T - The document type (can be Document or FlattenMaps<T> for lean queries)
 */
export interface PaginatedResult<T> {
  /** Array of documents/objects matching the query */
  data: T[];
  /** Pagination metadata */
  meta: {
    /** Total number of documents matching the filter */
    total: number;
    /** Current page number */
    page: number;
    /** Number of items per page */
    limit: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether there is a next page */
    hasNextPage: boolean;
    /** Whether there is a previous page */
    hasPrevPage: boolean;
  };
}

/**
 * Options for mutation operations (create, delete).
 */
export interface MutationOptions {
  /** MongoDB session for transaction support */
  session?: ClientSession;
}

/**
 * Options for update operations.
 * Extends MutationOptions with validation control.
 */
export interface UpdateOptions extends MutationOptions {
  /** Whether to run Mongoose validators. Defaults to true. */
  runValidators?: boolean;
}
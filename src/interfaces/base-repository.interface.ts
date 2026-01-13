import { Document, FilterQuery, UpdateQuery, FlattenMaps } from 'mongoose';
import { IdType } from './types';
import { FindOptions, PaginatedResult, MutationOptions, UpdateOptions } from './query-options.interface';

/** Find options without filter and pagination (for findById) */
type FindOptionsWithoutFilterPagination<T> = Omit<FindOptions<T>, 'filter' | 'pagination'>;

/** Find options without pagination (for findOne) */
type FindOptionsWithoutPagination<T> = Omit<FindOptions<T>, 'pagination'>;

/**
 * Base repository interface defining all MongoDB CRUD operations.
 *
 * This interface provides a consistent API for database operations with:
 * - Full CRUD support (Create, Read, Update, Delete)
 * - Lean query variants for better performance
 * - Pagination with metadata
 * - Transaction/session support on all operations
 *
 * @template T - The Mongoose Document type
 */
export interface IBaseRepository<T extends Document> {
  // ============================================
  // CREATE
  // ============================================

  /** Create a single document */
  create(data: Partial<T>, options?: MutationOptions): Promise<T>;

  /** Create multiple documents */
  createMany(data: Partial<T>[], options?: MutationOptions): Promise<T[]>;

  // ============================================
  // READ - Returns Mongoose Documents
  // ============================================

  /** Find document by ID. Returns full Mongoose document or null. */
  findById(id: IdType, options?: FindOptionsWithoutFilterPagination<T>): Promise<T | null>;

  /** Find single document by filter. Returns full Mongoose document or null. */
  findOne(options?: FindOptionsWithoutPagination<T>): Promise<T | null>;

  /** Find multiple documents. Returns array of Mongoose documents. */
  findMany(options?: FindOptions<T>): Promise<T[]>;

  /** Find with pagination metadata. Returns documents with pagination info. */
  findWithPagination(options?: FindOptions<T>): Promise<PaginatedResult<T>>;

  // ============================================
  // READ LEAN - Returns plain JS objects (faster)
  // ============================================

  /** Find by ID (lean). Returns plain JS object without Mongoose methods. */
  findByIdLean(id: IdType, options?: FindOptionsWithoutFilterPagination<T>): Promise<FlattenMaps<T> | null>;

  /** Find single document (lean). Returns plain JS object without Mongoose methods. */
  findOneLean(options?: FindOptionsWithoutPagination<T>): Promise<FlattenMaps<T> | null>;

  /** Find multiple documents (lean). Returns plain JS objects without Mongoose methods. */
  findManyLean(options?: FindOptions<T>): Promise<FlattenMaps<T>[]>;

  /** Find with pagination (lean). Returns plain JS objects with pagination metadata. */
  findWithPaginationLean(options?: FindOptions<T>): Promise<PaginatedResult<FlattenMaps<T>>>;

  // ============================================
  // UPDATE
  // ============================================

  /** Update document by ID. Returns updated document or null. Runs validators by default. */
  updateById(id: IdType, update: UpdateQuery<T>, options?: UpdateOptions): Promise<T | null>;

  /** Update single document by filter. Returns updated document or null. Runs validators by default. */
  updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: UpdateOptions): Promise<T | null>;

  /** Update multiple documents. Returns count of modified documents. Runs validators by default. */
  updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: UpdateOptions): Promise<number>;

  // ============================================
  // DELETE
  // ============================================

  /** Delete document by ID. Returns deleted document or null. */
  deleteById(id: IdType, options?: MutationOptions): Promise<T | null>;

  /** Delete single document by filter. Returns deleted document or null. */
  deleteOne(filter: FilterQuery<T>, options?: MutationOptions): Promise<T | null>;

  /** Delete multiple documents. Returns count of deleted documents. */
  deleteMany(filter: FilterQuery<T>, options?: MutationOptions): Promise<number>;

  // ============================================
  // UTILITY
  // ============================================

  /** Count documents matching filter */
  count(filter?: FilterQuery<T>, options?: MutationOptions): Promise<number>;

  /** Check if document exists matching filter */
  exists(filter: FilterQuery<T>, options?: MutationOptions): Promise<boolean>;
}

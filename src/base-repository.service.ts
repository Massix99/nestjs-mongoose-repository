import {
  Document,
  FilterQuery,
  FlattenMaps,
  Model,
  UpdateQuery,
  PopulateOptions as MongoosePopulateOptions,
} from 'mongoose';
import { IBaseRepository } from './interfaces/base-repository.interface';
import { IdType } from './interfaces/types';
import {
  FindOptions,
  PaginatedResult,
  MutationOptions,
  UpdateOptions,
} from './interfaces/query-options.interface';

type FindOptionsWithoutFilterPagination<T> = Omit<FindOptions<T>, 'filter' | 'pagination'>;

/**
 * Abstract base repository providing common MongoDB operations.
 *
 * Note on lean queries:
 * When `lean: true` is passed, Mongoose returns plain JS objects (FlattenMaps<T>)
 * instead of full Mongoose documents. These objects don't have methods like
 * .save(), .populate(), etc. but are significantly faster for read-only operations.
 *
 * @template T - Document type extending Mongoose Document
 */
export abstract class BaseRepositoryService<T extends Document>
  implements IBaseRepository<T>
{
  protected constructor(protected readonly model: Model<T>) {}

  // ============================================
  // CREATE
  // ============================================

  async create(data: Partial<T>, options?: MutationOptions): Promise<T> {
    const doc = new this.model(data);
    if (options?.session) {
      return doc.save({ session: options.session });
    }
    return doc.save();
  }

  async createMany(data: Partial<T>[], options?: MutationOptions): Promise<T[]> {
    const docs = options?.session
      ? await this.model.insertMany(data, { session: options.session })
      : await this.model.insertMany(data);
    return docs as unknown as T[];
  }

  // ============================================
  // READ
  // ============================================

  /**
   * Find document by ID
   * @returns Mongoose Document or null
   */
  async findById(
    id: IdType,
    options?: FindOptionsWithoutFilterPagination<T>,
  ): Promise<T | null> {
    let query = this.model.findById(id);
    query = this.applyQueryOptions(query, options);
    return query.exec();
  }

  /**
   * Find single document by filter
   * @returns Mongoose Document or null
   */
  async findOne(options?: Omit<FindOptions<T>, 'pagination'>): Promise<T | null> {
    let query = this.model.findOne(options?.filter || {});
    query = this.applyQueryOptions(query, options);
    return query.exec();
  }

  /**
   * Find multiple documents
   * @returns Array of Mongoose Documents
   */
  async findMany(options?: FindOptions<T>): Promise<T[]> {
    let query = this.model.find(options?.filter || {});
    query = this.applyQueryOptions(query, options);

    if (options?.pagination) {
      const { page = 1, limit = 10 } = options.pagination;
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    return query.exec();
  }

  /**
   * Find with pagination metadata
   * @param options - Query options
   * @returns PaginatedResult with data and meta (total, pages, hasNext, hasPrev)
   */
  async findWithPagination(options?: FindOptions<T>): Promise<PaginatedResult<T>> {
    const filter = options?.filter || {};
    const page = options?.pagination?.page || 1;
    const limit = options?.pagination?.limit || 10;

    const [data, total] = await Promise.all([
      this.findMany({ ...options, pagination: { page, limit } }),
      this.count(filter, { session: options?.session }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // ============================================
  // READ LEAN - Returns plain JS objects (faster)
  // ============================================

  /**
   * Find document by ID (lean)
   * @returns Plain JS object without Mongoose methods, null if not found
   */
  async findByIdLean(
    id: IdType,
    options?: FindOptionsWithoutFilterPagination<T>,
  ): Promise<FlattenMaps<T> | null> {
    let query = this.model.findById(id);
    query = this.applyQueryOptions(query, options);
    const result = await query.lean().exec();
    return result as FlattenMaps<T> | null;
  }

  /**
   * Find single document by filter (lean)
   * @returns Plain JS object without Mongoose methods, null if not found
   */
  async findOneLean(
    options?: Omit<FindOptions<T>, 'pagination'>,
  ): Promise<FlattenMaps<T> | null> {
    let query = this.model.findOne(options?.filter || {});
    query = this.applyQueryOptions(query, options);
    const result = await query.lean().exec();
    return result as FlattenMaps<T> | null;
  }

  /**
   * Find multiple documents (lean)
   * @returns Array of plain JS objects without Mongoose methods
   */
  async findManyLean(options?: FindOptions<T>): Promise<FlattenMaps<T>[]> {
    let query = this.model.find(options?.filter || {});
    query = this.applyQueryOptions(query, options);

    if (options?.pagination) {
      const { page = 1, limit = 10 } = options.pagination;
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    const result = await query.lean().exec();
    return result as FlattenMaps<T>[];
  }

  /**
   * Find with pagination metadata (lean)
   * @returns PaginatedResult with plain JS objects
   */
  async findWithPaginationLean(
    options?: FindOptions<T>,
  ): Promise<PaginatedResult<FlattenMaps<T>>> {
    const filter = options?.filter || {};
    const page = options?.pagination?.page || 1;
    const limit = options?.pagination?.limit || 10;

    const [data, total] = await Promise.all([
      this.findManyLean({ ...options, pagination: { page, limit } }),
      this.count(filter, { session: options?.session }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  /**
   * Update document by ID
   * @param id - Document ID
   * @param update - Update query ($set, $inc, etc.)
   * @param options - Update options (session, runValidators)
   * @returns Updated document or null if not found
   */
  async updateById(
    id: IdType,
    update: UpdateQuery<T>,
    options?: UpdateOptions,
  ): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, update, {
        new: true,
        runValidators: options?.runValidators ?? true,
        session: options?.session,
      })
      .exec();
  }

  /**
   * Update single document by filter
   */
  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: UpdateOptions,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(filter, update, {
        new: true,
        runValidators: options?.runValidators ?? true,
        session: options?.session,
      })
      .exec();
  }

  /**
   * Update multiple documents
   * @returns Number of modified documents
   */
  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: UpdateOptions,
  ): Promise<number> {
    const result = await this.model
      .updateMany(filter, update, {
        runValidators: options?.runValidators ?? true,
        session: options?.session,
      })
      .exec();
    return result.modifiedCount;
  }

  // ============================================
  // DELETE
  // ============================================

  async deleteById(id: IdType, options?: MutationOptions): Promise<T | null> {
    return this.model
      .findByIdAndDelete(id, { session: options?.session })
      .exec();
  }

  async deleteOne(filter: FilterQuery<T>, options?: MutationOptions): Promise<T | null> {
    return this.model
      .findOneAndDelete(filter, { session: options?.session })
      .exec();
  }

  async deleteMany(filter: FilterQuery<T>, options?: MutationOptions): Promise<number> {
    const result = await this.model
      .deleteMany(filter)
      .session(options?.session ?? null)
      .exec();
    return result.deletedCount;
  }

  // ============================================
  // UTILITY
  // ============================================

  async count(filter?: FilterQuery<T>, options?: MutationOptions): Promise<number> {
    return this.model
      .countDocuments(filter || {})
      .session(options?.session ?? null)
      .exec();
  }

  async exists(filter: FilterQuery<T>, options?: MutationOptions): Promise<boolean> {
    const result = await this.model
      .exists(filter)
      .session(options?.session ?? null);
    return result !== null;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private applyQueryOptions<Q>(query: Q, options?: Partial<FindOptions<T>>): Q {
    if (!options) return query;

    const q = query as any;

    if (options.projection) {
      q.select(options.projection);
    }

    if (options.sort) {
      q.sort(options.sort);
    }

    if (options.populate) {
      this.applyPopulate(q, options.populate);
    }

    if (options.session) {
      q.session(options.session);
    }

    if (options.options) {
      q.setOptions(options.options);
    }

    return query;
  }

  private applyPopulate(
    query: any,
    populate: string | string[] | MongoosePopulateOptions | MongoosePopulateOptions[],
  ): void {
    if (typeof populate === 'string') {
      query.populate(populate);
    } else if (Array.isArray(populate)) {
      query.populate(populate);
    } else {
      query.populate(populate);
    }
  }
}

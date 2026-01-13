import { Document, Types, FlattenMaps } from 'mongoose';

/**
 * Base document type extending Mongoose Document
 */
export type BaseDocument = Document;

/**
 * Lean document type - plain JS object returned by .lean()
 * Uses Mongoose's FlattenMaps to properly type the flattened structure
 */
export type LeanDoc<T> = FlattenMaps<T> & { _id: Types.ObjectId };

/**
 * Flexible ID type accepting both ObjectId and string
 */
export type IdType = Types.ObjectId | string;

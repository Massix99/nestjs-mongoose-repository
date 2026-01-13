# NestJS Mongoose Repository

A type-safe, reusable base repository for NestJS applications using Mongoose. Provides a clean API for common MongoDB operations with full TypeScript support.

## Features

- **Full CRUD Operations** - Create, Read, Update, Delete with type safety
- **Pagination** - Built-in pagination with metadata (total, pages, hasNext, hasPrev)
- **Lean Queries** - Dedicated `*Lean()` methods returning plain JS objects for better performance
- **Transaction Support** - Session support on all operations for MongoDB transactions
- **Validation by Default** - `runValidators: true` on all update operations
- **Flexible Queries** - Populate, projection, sorting, and filtering support
- **Clean Architecture** - Abstract base class for easy extension

## Installation

```bash
npm install nestjs-mongoose-repository
```

### Peer Dependencies

This package requires the following peer dependencies:

```json
{
  "@nestjs/common": "^10.0.0 || ^11.0.0",
  "@nestjs/mongoose": "^10.0.0 || ^11.0.0",
  "mongoose": "^7.0.0 || ^8.0.0"
}
```

## Quick Start

### 1. Define your Mongoose Schema

```typescript
// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  age?: number;

  @Prop({ default: true })
  isActive: boolean;

  // timestamps: true adds these automatically
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
```

### 2. Create your Repository

```typescript
// user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepositoryService } from 'nestjs-mongoose-repository';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserRepository extends BaseRepositoryService<UserDocument> {
  constructor(@InjectModel(User.name) userModel: Model<UserDocument>) {
    super(userModel);
  }

  // Add custom methods as needed
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.findOne({ filter: { email } });
  }

  async findActiveUsers(): Promise<UserDocument[]> {
    return this.findMany({
      filter: { isActive: true },
      sort: { createdAt: -1 },
    });
  }
}
```

### 3. Register in your Module

```typescript
// user.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UserRepository, UserService],
  exports: [UserRepository],
})
export class UserModule {}
```

### 4. Use in your Service

```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createUser(name: string, email: string) {
    return this.userRepository.create({ name, email });
  }

  async getUsers(page: number, limit: number) {
    return this.userRepository.findWithPagination({
      pagination: { page, limit },
      sort: { createdAt: -1 },
    });
  }

  async getUserById(id: string) {
    return this.userRepository.findById(id);
  }
}
```

## API Reference

### Available Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `create(data, options?)` | Create a single document | `T` |
| `createMany(data[], options?)` | Create multiple documents | `T[]` |
| `findById(id, options?)` | Find document by ID | `T \| null` |
| `findOne(options?)` | Find single document by filter | `T \| null` |
| `findMany(options?)` | Find multiple documents | `T[]` |
| `findWithPagination(options?)` | Find with pagination metadata | `PaginatedResult<T>` |
| `findByIdLean(id, options?)` | Find by ID (plain object) | `FlattenMaps<T> \| null` |
| `findOneLean(options?)` | Find one (plain object) | `FlattenMaps<T> \| null` |
| `findManyLean(options?)` | Find many (plain objects) | `FlattenMaps<T>[]` |
| `findWithPaginationLean(options?)` | Paginated (plain objects) | `PaginatedResult<FlattenMaps<T>>` |
| `updateById(id, update, options?)` | Update document by ID | `T \| null` |
| `updateOne(filter, update, options?)` | Update single document | `T \| null` |
| `updateMany(filter, update, options?)` | Update multiple documents | `number` (modified count) |
| `deleteById(id, options?)` | Delete document by ID | `T \| null` |
| `deleteOne(filter, options?)` | Delete single document | `T \| null` |
| `deleteMany(filter, options?)` | Delete multiple documents | `number` (deleted count) |
| `count(filter?, options?)` | Count documents | `number` |
| `exists(filter, options?)` | Check if document exists | `boolean` |

### FindOptions

```typescript
interface FindOptions<T> {
  filter?: FilterQuery<T>;        // Mongoose filter query
  projection?: ProjectionType<T>; // Fields to include/exclude
  sort?: SortOptions;             // Sort order { field: 1 | -1 }
  pagination?: {                  // Pagination options
    page?: number;                // Page number (default: 1)
    limit?: number;               // Items per page (default: 10)
  };
  populate?: string | string[] | PopulateOptions | PopulateOptions[];
  session?: ClientSession;        // Transaction session
  options?: QueryOptions;         // Additional Mongoose options
}
```

### MutationOptions

```typescript
interface MutationOptions {
  session?: ClientSession;        // Transaction session
}

interface UpdateOptions extends MutationOptions {
  runValidators?: boolean;        // Default: true
}
```

### PaginatedResult

```typescript
interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
```

## Examples

### Filtering

```typescript
// Find all active users older than 18
const users = await userRepository.findMany({
  filter: { isActive: true, age: { $gt: 18 } },
});

// Using MongoDB operators
const users = await userRepository.findMany({
  filter: {
    $or: [{ role: 'admin' }, { role: 'moderator' }],
    createdAt: { $gte: new Date('2024-01-01') },
  },
});
```

### Sorting

```typescript
// Sort by name ascending
const users = await userRepository.findMany({
  sort: { name: 1 },
});

// Multiple sort fields
const users = await userRepository.findMany({
  sort: { role: 1, createdAt: -1 },
});
```

### Pagination

```typescript
// Get page 2 with 20 items per page
const result = await userRepository.findWithPagination({
  filter: { isActive: true },
  pagination: { page: 2, limit: 20 },
  sort: { createdAt: -1 },
});

// Result structure:
// {
//   data: User[],
//   meta: {
//     total: 150,
//     page: 2,
//     limit: 20,
//     totalPages: 8,
//     hasNextPage: true,
//     hasPrevPage: true,
//   }
// }
```

### Projection

```typescript
// Only return name and email fields
const users = await userRepository.findMany({
  projection: { name: 1, email: 1 },
});

// Exclude specific fields
const users = await userRepository.findMany({
  projection: { password: 0, __v: 0 },
});
```

### Populate

```typescript
// Simple populate
const user = await userRepository.findById(userId, {
  populate: 'posts',
});

// Multiple fields
const user = await userRepository.findById(userId, {
  populate: ['posts', 'comments'],
});

// Deep populate with options
const user = await userRepository.findById(userId, {
  populate: [
    {
      path: 'posts',
      populate: { path: 'author', select: 'name email' },
    },
  ],
});
```

### Lean Queries

Use `*Lean()` methods for better performance when you don't need Mongoose document methods:

```typescript
// Returns plain JS object (FlattenMaps<T>) - faster, no .save(), .populate()
const user = await userRepository.findByIdLean(id);
const users = await userRepository.findManyLean({ filter: { isActive: true } });
const paginated = await userRepository.findWithPaginationLean({
  pagination: { page: 1, limit: 10 },
});

// Regular methods return Mongoose Documents with full functionality
const doc = await userRepository.findById(id);
doc.name = 'New Name';
await doc.save(); // Works with Mongoose documents
```

**When to use lean queries:**
- Read-only operations (displaying data, API responses)
- Performance-critical code paths
- When you don't need `.save()`, `.populate()`, virtuals, or getters/setters

**When to use regular queries:**
- When you need to modify and save the document
- When you need Mongoose middleware (pre/post hooks)
- When you need virtuals or getters/setters

### Transactions

```typescript
const session = await connection.startSession();
session.startTransaction();

try {
  // All operations use the same session
  await userRepository.create({ name: 'John', email: 'john@example.com' }, { session });
  await userRepository.updateById(otherId, { $inc: { count: 1 } }, { session });
  await userRepository.deleteById(oldUserId, { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### Update Operations

```typescript
// Update by ID
await userRepository.updateById(userId, {
  $set: { name: 'New Name' },
});

// Update with increment
await userRepository.updateById(userId, {
  $inc: { loginCount: 1 },
  $set: { lastLoginAt: new Date() },
});

// Update by filter
await userRepository.updateOne(
  { email: 'old@example.com' },
  { $set: { email: 'new@example.com' } },
);

// Update many
const modifiedCount = await userRepository.updateMany(
  { isActive: false },
  { $set: { deletedAt: new Date() } },
);

// Disable validators if needed
await userRepository.updateById(userId, update, { runValidators: false });
```

### Custom Repository Methods

```typescript
@Injectable()
export class UserRepository extends BaseRepositoryService<UserDocument> {
  constructor(@InjectModel(User.name) model: Model<UserDocument>) {
    super(model);
  }

  async findByEmail(email: string) {
    return this.findOne({ filter: { email } });
  }

  async findActiveAdmins() {
    return this.findMany({
      filter: { role: 'admin', isActive: true },
      sort: { createdAt: -1 },
    });
  }

  async softDelete(id: string) {
    return this.updateById(id, {
      $set: { deletedAt: new Date(), isActive: false },
    });
  }

  async incrementLoginCount(id: string) {
    return this.updateById(id, {
      $inc: { loginCount: 1 },
      $set: { lastLoginAt: new Date() },
    });
  }
}
```

## TypeScript Support

This package is written in TypeScript and provides full type safety:

```typescript
// Document type flows through all operations
const user: UserDocument | null = await userRepository.findById(id);

// Lean types are correctly inferred
const userLean: FlattenMaps<UserDocument> | null = await userRepository.findByIdLean(id);

// Pagination result is fully typed
const result: PaginatedResult<UserDocument> = await userRepository.findWithPagination({
  pagination: { page: 1, limit: 10 },
});
```

## License

MIT

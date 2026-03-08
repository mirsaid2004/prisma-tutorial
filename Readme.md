# Prisma Tutorial

A comprehensive guide to understanding and using Prisma ORM with PostgreSQL.

## Table of Contents

1. [Setup & Installation](#setup--installation)
2. [What is a Model](#what-is-a-model)
3. [Row-Level Attributes](#row-level-attributes)
4. [Block-Level Attributes](#block-level-attributes)
5. [Relations](#relations)
6. [Prisma Client](#prisma-client)
7. [Write Operations](#write-operations)
8. [Read Operations: Select & Include](#read-operations-select--include)
9. [Running the Project](#running-the-project)

---

## Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

### Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages:

- `prisma` - ORM toolkit
- `@prisma/client` - Database client
- `@prisma/adapter-pg` - PostgreSQL adapter
- `typescript` - TypeScript support
- `dotenv` - Environment variable management

### Step 2: Configure Database Connection

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/prisma_tutorial"
```

Replace `user`, `password`, and database name with your actual PostgreSQL credentials.

### Step 3: Set Up Prisma Schema

The schema file is located at `prisma/schema.prisma`. It defines:

- **Generator**: Tells Prisma to generate the client
- **Datasource**: Points to your database
- **Models**: Your data structures

### Step 4: Run Migrations

Create and apply migrations to your database:

```bash
npx prisma migrate dev --name init
```

This command:

- Creates a new migration file
- Applies the migration to your database
- Generates Prisma Client

### Step 5: Run the Project

```bash
node src/index.ts
```

Or with TypeScript:

```bash
npx ts-node src/index.ts
```

---

## What is a Model

A **model** is a blueprint for a table in your database. It defines:

- Table structure
- Field names and types
- Constraints and validations
- Relationships with other tables

### Example Model: User

```prisma
model User {
  id             String          @id @default(uuid())
  name           String
  email          String          @unique
  isAdmin        Boolean
  posts          Post[]          @relation("posts")
  favoritePosts  Post[]          @relation("favorite posts")
  userPreference UserPreference?
}
```

This creates a `User` table with:

- Unique identifier (`id`)
- User information (`name`, `email`, `isAdmin`)
- Relationships to `Post` and `UserPreference`

---

## Row-Level Attributes

Row-level attributes define characteristics of individual **fields** (columns). They modify how a single field behaves.

### Common Row-Level Attributes

| Attribute     | Purpose                          | Example                                   |
| ------------- | -------------------------------- | ----------------------------------------- |
| `@id`         | Marks a field as primary key     | `id String @id`                           |
| `@unique`     | Ensures all values are unique    | `email String @unique`                    |
| `@default()`  | Sets a default value             | `createdAt DateTime @default(now())`      |
| `@updatedAt`  | Auto-updates timestamp on change | `updatedAt DateTime @updatedAt`           |
| `@relation()` | Defines foreign key relationship | `author User @relation(fields: [userId])` |

### Examples

```prisma
model Post {
  // Primary key with UUID default
  id            String     @id @default(uuid())

  // Simple string field
  title         String

  // Numeric field
  averageRating Float

  // Timestamp - auto-set on creation
  createdAt     DateTime   @default(now())

  // Timestamp - auto-updated on every change
  updatedAt     DateTime   @updatedAt

  // Foreign key field (links to User.id)
  userId        String

  // Optional field (can be null)
  favoriteById  String?
}
```

---

## Block-Level Attributes

Block-level attributes define characteristics of the **entire model** (table). They apply to the model as a whole, not individual fields.

### Common Block-Level Attributes

| Attribute      | Purpose                                 | Syntax                           |
| -------------- | --------------------------------------- | -------------------------------- |
| `@@id()`       | Composite primary key (multiple fields) | `@@id([field1, field2])`         |
| `@@unique()`   | Composite unique constraint             | `@@unique([field1, field2])`     |
| `@@index()`    | Create database index for performance   | `@@index([field])`               |
| `@@map()`      | Map model to different table name       | `@@map("table_name")`            |
| `@@relation()` | Explicit relation name                  | Used in multi-relation scenarios |

### Examples

```prisma
model Post {
  id        String @id @default(uuid())
  title     String
  userId    String

  // Composite unique constraint:
  // A user can't have multiple posts with same title
  @@unique([userId, title])

  // Create database index for faster queries
  @@index([userId])

  // Map to different table name in database
  @@map("posts_table")
}

model UserProfile {
  userId   String
  username String

  // Composite primary key (two fields together are unique)
  @@id([userId, username])
}
```

---

## Relations

Relations define how models **connect to each other**. They enable powerful queries across related data.

### Types of Relations

#### 1. One-to-One (1:1)

One record in Table A matches exactly one record in Table B.

```prisma
model User {
  id             String          @id @default(uuid())
  userPreference UserPreference?
}

model UserPreference {
  id     String @id @default(uuid())
  user   User   @relation(fields: [userId], references: [id])
  userId String @unique  // @unique makes it 1:1
}
```

**Query Example:**

```typescript
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
  include: { userPreference: true },
});
```

---

#### 2. One-to-Many (1:N)

One record in Table A matches multiple records in Table B.

```prisma
model User {
  id    String @id @default(uuid())
  posts Post[] @relation("posts")  // User has many posts
}

model Post {
  id     String @id @default(uuid())
  author User   @relation("posts", fields: [userId], references: [id])
  userId String
}
```

**Query Example:**

```typescript
// Get user with all their posts
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
  include: { posts: true },
});

// Get post with author info
const post = await prisma.post.findUnique({
  where: { id: "post-id" },
  include: { author: true },
});
```

---

#### 3. Many-to-Many (N:M)

Multiple records in Table A can match multiple records in Table B.

```prisma
model Post {
  id         String     @id @default(uuid())
  categories Category[]  // Post has many categories
}

model Category {
  id    String @id @default(uuid())
  posts Post[]  // Category has many posts
}
```

**Query Example:**

```typescript
// Get post with categories
const post = await prisma.post.findUnique({
  where: { id: "post-id" },
  include: { categories: true },
});

// Get category with all posts
const category = await prisma.category.findUnique({
  where: { id: "category-id" },
  include: { posts: true },
});
```

---

### Self-Relations

A model can relate to itself:

```prisma
model User {
  id       String @id @default(uuid())
  friends  User[] @relation("UserFriends")
  friendOf User[] @relation("UserFriends")
}
```

---

### Implicit vs Explicit Relations

**Implicit** (Prisma creates junction table automatically):

```prisma
model Post {
  categories Category[]
}

model Category {
  posts Post[]
}
```

**Explicit** (You control junction table):

```prisma
model Post {
  id            String              @id @default(uuid())
  postCategory  PostCategory[]
}

model Category {
  id            String              @id @default(uuid())
  postCategory  PostCategory[]
}

model PostCategory {
  postId     String
  categoryId String
  post       Post     @relation(fields: [postId], references: [id])
  category   Category @relation(fields: [categoryId], references: [id])

  @@id([postId, categoryId])
}
```

---

## Prisma Client

The **Prisma Client** is your programmatic interface to interact with your database. It's auto-generated based on your schema and provides type-safe database operations.

### Initializing Prisma Client

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
```

### Prisma Client Properties & Methods

| Property/Method  | Purpose                                | Type            |
| ---------------- | -------------------------------------- | --------------- |
| `user`           | Access User model queries              | Model Client    |
| `post`           | Access Post model queries              | Model Client    |
| `category`       | Access Category model queries          | Model Client    |
| `$connect()`     | Explicitly connect to database         | `Promise<void>` |
| `$disconnect()`  | Close database connection              | `Promise<void>` |
| `$queryRaw`      | Execute raw SQL queries                | Raw Query       |
| `$executeRaw`    | Execute raw SQL (no return)            | Raw Query       |
| `$transaction()` | Execute multiple operations atomically | Transaction     |
| `$on()`          | Listen to database events              | Event Listener  |

### Logging Configuration

Control what Prisma logs with the `log` option:

```typescript
const prisma = new PrismaClient({
  log: [
    {
      emit: "stdout",
      level: "query", // Log all queries
    },
    {
      emit: "stdout",
      level: "error", // Log errors
    },
    {
      emit: "stdout",
      level: "warn", // Log warnings
    },
    {
      emit: "event",
      level: "info", // Log info events
    },
  ],
});

// Event listener for logs
prisma.$on("query", (e) => {
  console.log("Query: " + e.query);
  console.log("Duration: " + e.duration + "ms");
});
```

### Log Levels

- **query**: Every database query executed
- **info**: General information
- **warn**: Warnings about potential issues
- **error**: Error messages

### Using Prisma Client

```typescript
import prisma from "./lib/prisma";

async function main() {
  // Create a user
  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
    },
  });

  console.log(user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Write Operations

Write operations modify your database: **CREATE**, **UPDATE**, and **DELETE**.

### Create

**Create a single record:**

```typescript
const newUser = await prisma.user.create({
  data: {
    name: "Alice Johnson",
    email: "alice@example.com",
    isAdmin: false,
  },
});
```

**Create multiple records:**

```typescript
const users = await prisma.user.createMany({
  data: [
    { name: "User 1", email: "user1@example.com", isAdmin: false },
    { name: "User 2", email: "user2@example.com", isAdmin: false },
  ],
  skipDuplicates: true, // Skip if email already exists
});
```

**Create with relations:**

```typescript
const userWithPost = await prisma.user.create({
  data: {
    name: "Bob Smith",
    email: "bob@example.com",
    posts: {
      create: {
        title: "My First Post",
        content: "This is great!",
      },
    },
  },
  include: { posts: true },
});
```

### Update

**Update a single record:**

```typescript
const updatedUser = await prisma.user.update({
  where: { id: "user-id" },
  data: {
    name: "Alice Updated",
    isAdmin: true,
  },
});
```

**Update multiple records:**

```typescript
const updated = await prisma.user.updateMany({
  where: { isAdmin: false },
  data: { isAdmin: true },
});
console.log(`${updated.count} users updated`);
```

**Increment/Decrement values:**

```typescript
const post = await prisma.post.update({
  where: { id: "post-id" },
  data: {
    averageRating: {
      increment: 0.5, // Add 0.5 to current value
    },
  },
});
```

**Update with relation:**

```typescript
const userWithNewPost = await prisma.user.update({
  where: { id: "user-id" },
  data: {
    posts: {
      create: {
        title: "New Post",
        content: "Content here",
      },
    },
  },
  include: { posts: true },
});
```

### Delete

**Delete a single record:**

```typescript
const deletedUser = await prisma.user.delete({
  where: { id: "user-id" },
});
```

**Delete multiple records:**

```typescript
const deleted = await prisma.user.deleteMany({
  where: { isAdmin: false },
});
console.log(`${deleted.count} users deleted`);
```

**Delete with cascade (related records):**

```typescript
// If User has relation to Posts, deleting user also deletes posts
const deletedUser = await prisma.user.delete({
  where: { id: "user-id" },
});
```

### Upsert

**Update if exists, create if not:**

```typescript
const user = await prisma.user.upsert({
  where: { email: "john@example.com" },
  update: { name: "John Updated" },
  create: { name: "John New", email: "john@example.com" },
});
```

---

## Read Operations: Select & Include

Read operations retrieve data from your database using **select** and **include**.

### Difference Between Select & Include

| Feature             | `select`                  | `include`            |
| ------------------- | ------------------------- | -------------------- |
| **Purpose**         | Choose specific fields    | Include related data |
| **Returns**         | Only selected fields      | Model + relations    |
| **Usage**           | Performance optimization  | Nested data fetching |
| **Relation Fields** | Can select from relations | Auto-loads relations |

### Using Include

**Include loads related data with the model:**

```typescript
// Get user WITH all their posts
const userWithPosts = await prisma.user.findUnique({
  where: { id: "user-id" },
  include: {
    posts: true, // Include all posts
  },
});

console.log(userWithPosts.posts); // Array of posts
```

**Include multiple relations:**

```typescript
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
  include: {
    posts: true,
    userPreference: true,
  },
});
```

**Include with filtering:**

```typescript
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
  include: {
    posts: {
      where: { published: true }, // Only published posts
      orderBy: { createdAt: "desc" },
      take: 5, // Limit to 5
    },
  },
});
```

**Nested include:**

```typescript
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
  include: {
    posts: {
      include: {
        categories: true, // Include categories of each post
      },
    },
  },
});
```

### Using Select

**Select specific fields only:**

```typescript
// Get only id, name, and email (NOT all fields)
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
  select: {
    id: true,
    name: true,
    email: true,
    // isAdmin is NOT included
  },
});
```

**Select from related models:**

```typescript
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
  select: {
    name: true,
    email: true,
    posts: {
      select: {
        id: true,
        title: true,
        // content is NOT included
      },
    },
  },
});
```

**Select with filtering:**

```typescript
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
  select: {
    name: true,
    posts: {
      where: { published: true },
      select: {
        id: true,
        title: true,
      },
    },
  },
});
```

### Common Query Methods

```typescript
// Find unique record
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
  include: { posts: true },
});

// Find first matching record
const firstUser = await prisma.user.findFirst({
  where: { isAdmin: true },
  select: { id: true, name: true },
});

// Find many records
const users = await prisma.user.findMany({
  where: { isAdmin: false },
  include: { posts: true },
  orderBy: { createdAt: "desc" },
  skip: 0,
  take: 10,
});

// Count records
const count = await prisma.user.count({
  where: { isAdmin: true },
});
```

### Select vs Include Examples

```typescript
// ❌ BAD: Include ALL fields when you only need some
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
  include: { posts: true },
});

// ✅ GOOD: Select only needed fields
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
  select: {
    id: true,
    name: true,
    posts: {
      select: { id: true, title: true },
    },
  },
});

// ✅ GOOD: Use include when you need all fields
const fullUser = await prisma.user.findUnique({
  where: { id: "user-id" },
  include: { posts: true },
});
```

---

## Project Structure

```
prisma/
  ├── schema.prisma         # Your data models
  ├── migrations/           # Database migration history
  └── migrations_lock.toml  # Migration lock file

src/
  ├── index.ts             # Main entry point
  └── lib/
      └── prisma.ts        # Prisma client configuration

generated/
  └── prisma/
      └── client.ts        # Auto-generated Prisma Client
```

---

## Key Takeaways

✅ **Setup**: Install dependencies, configure `.env`, run migrations  
✅ **Models**: Define your data structure with fields and relations  
✅ **Row-Level**: Use `@id`, `@unique`, `@default()` on individual fields  
✅ **Block-Level**: Use `@@id()`, `@@unique()`, `@@index()` for table-wide rules  
✅ **Relations**: Connect models using 1:1, 1:N, or N:M relationships

For more information, visit [Prisma Documentation](https://www.prisma.io/docs/)

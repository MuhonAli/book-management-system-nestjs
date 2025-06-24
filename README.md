# Book Management System

A TypeScript-based book management system built with NestJS, TypeORM, and SQLite.

## Features

- **Complete CRUD Operations**: Create, read, update, and delete authors and books
- **Advanced Search Functionality**: Search books by title, author, or ISBN; search authors by name
- **Status Management**: Track book availability (available, borrowed, reserved)
- **Author-Book Relationships**: Proper relational database with foreign key constraints
- **Data Validation**: Input validation using class-validator with comprehensive error handling
- **SQLite Database**: Lightweight database with TypeORM
- **REST API**: Clean RESTful endpoints with comprehensive documentation
- **Comprehensive Testing**: Full unit and end-to-end test coverage with Jest and Supertest
- **Business Logic Protection**: Prevents deletion of authors with books, ensures ISBN uniqueness

## Technology Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: SQLite
- **ORM**: TypeORM
- **Validation**: class-validator
- **Testing**: Jest (unit tests), Supertest (e2e tests)
- **API Testing**: REST endpoints with JSON responses

## Project Structure

```
src/
├── authors/
│   ├── dto/
│   │   ├── create-author.dto.ts
│   │   └── update-author.dto.ts
│   ├── entities/
│   │   └── author.entity.ts
│   ├── authors.controller.ts
│   ├── authors.service.ts
│   └── authors.module.ts
├── books/
│   ├── dto/
│   │   ├── create-book.dto.ts
│   │   └── update-book.dto.ts
│   ├── entities/
│   │   └── book.entity.ts
│   ├── books.controller.ts
│   ├── books.service.ts
│   └── books.module.ts
├── database/
│   └── database.module.ts
├── seeds/
│   └── seed.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

## Installation

```bash
# Install dependencies
npm install
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Authors

- `GET /authors` - Get all authors
- `GET /authors?name=AuthorName` - Search authors by full name
- `GET /authors?firstName=FirstName` - Search authors by first name
- `GET /authors?lastName=LastName` - Search authors by last name
- `GET /authors/with-books` - Get authors who have books
- `GET /authors/:id` - Get author by ID
- `GET /authors/:id/stats` - Get author statistics (book counts by status)
- `POST /authors` - Create a new author
- `PATCH /authors/:id` - Update an author
- `DELETE /authors/:id` - Delete an author (only if no books associated)

### Books

- `GET /books` - Get all books
- `GET /books?author=AuthorName` - Get books by author name (legacy)
- `GET /books?authorId=1` - Get books by author ID
- `GET /books?title=BookTitle` - Search books by title
- `GET /books/available` - Get available books
- `GET /books/:id` - Get book by ID
- `GET /books/isbn/:isbn` - Get book by ISBN
- `POST /books` - Create a new book
- `PATCH /books/:id` - Update a book
- `PATCH /books/:id/status` - Update book status
- `DELETE /books/:id` - Delete a book

### Example Author Object

```json
{
  "firstName": "George",
  "lastName": "Orwell",
  "bio": "English novelist and essayist, journalist and critic",
  "birthDate": "1903-06-25"
}
```

### Example Book Object

```json
{
  "title": "1984",
  "authorId": 1,
  "isbn": "978-0-452-28423-4",
  "description": "A dystopian social science fiction novel",
  "publishedDate": "1949-06-08",
  "status": "available"
}
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**
   ```bash
   npm run start:dev
   ```

3. **Seed the database with sample data:**
   ```bash
   npm run seed
   ```

4. **Test the complete API:**
   ```bash
   node test-complete-api.js
   ```

## Testing the API

### Using the Test Scripts

1. **Complete API test (Authors + Books):**
   ```bash
   node test-complete-api.js
   ```

2. **Legacy Books test:**
   ```bash
   node test-books.js
   ```

### Using curl commands

#### Authors API
```bash
# Create an author
curl -X POST http://localhost:3000/authors \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Stephen",
    "lastName": "King",
    "bio": "American author of horror fiction",
    "birthDate": "1947-09-21"
  }'

# Get all authors
curl http://localhost:3000/authors

# Search authors by name
curl "http://localhost:3000/authors?name=George"

# Get author statistics
curl http://localhost:3000/authors/1/stats
```

#### Books API
```bash
# Create a book with author relationship
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Shining",
    "authorId": 1,
    "isbn": "978-0-385-12167-5",
    "description": "A horror novel",
    "publishedDate": "1977-01-28"
  }'

# Get all books
curl http://localhost:3000/books

# Get books by author ID
curl "http://localhost:3000/books?authorId=1"

# Get available books only
curl http://localhost:3000/books/available
```

## Database

The SQLite database file (`books.db`) is automatically created in the project root when you first run the application.

## Testing

This project includes comprehensive testing with both unit tests and end-to-end (e2e) tests.

### Unit Tests

```bash
# Run all unit tests
npm test

# Run unit tests with coverage
npm run test:cov

# Run specific test file (Windows PowerShell)
npx jest --testPathPattern="authors.service.spec.ts"
npx jest --testPathPattern="books.service.spec.ts"

# Watch mode for development
npm run test:watch
```

**Unit Test Coverage:**
- ✅ Authors Service: All CRUD operations, search functionality, business logic
- ✅ Books Service: All CRUD operations, status management, ISBN validation
- ✅ Error handling and edge cases
- ✅ Database constraints and relationships

### End-to-End (E2E) Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific e2e test file
npx jest --config ./test/jest-e2e.json --testPathPattern="authors.e2e-spec.ts"
npx jest --config ./test/jest-e2e.json --testPathPattern="books.e2e-spec.ts"
npx jest --config ./test/jest-e2e.json --testPathPattern="critical-workflows.e2e-spec.ts"
```

**E2E Test Coverage:**
- ✅ Complete API workflow testing
- ✅ Author and Book CRUD operations via HTTP
- ✅ Search and filtering functionality
- ✅ Validation error scenarios
- ✅ Database relationships and constraints
- ✅ Critical business workflows

### Testing with Browser or API Tools

#### Using Browser (GET requests)
1. Start the application: `npm run start:dev`
2. Visit: `http://localhost:3000/authors`
3. Visit: `http://localhost:3000/books`
4. Search: `http://localhost:3000/authors?name=George`

#### Using Postman
1. Import the collection with base URL: `http://localhost:3000`
2. Set Content-Type header to `application/json` for POST/PATCH requests
3. Use the example payloads provided in API Endpoints section

## Development

```bash
# Run in development mode with hot reload
npm run start:dev

# Build the project
npm run build

# Run all tests (unit + e2e)
npm test && npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format
```

## Entity Schemas

### Author Entity
- `id`: Auto-generated primary key
- `firstName`: Author's first name (required)
- `lastName`: Author's last name (required)
- `bio`: Author biography (optional)
- `birthDate`: Author's birth date (optional)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `books`: One-to-many relationship with books

### Book Entity
- `id`: Auto-generated primary key
- `title`: Book title (required)
- `authorId`: Foreign key to Author (optional)
- `authorName`: Legacy author name field (optional)
- `isbn`: ISBN number (required, unique)
- `description`: Book description (optional)
- `publishedDate`: Publication date (optional)
- `status`: Book status (available, borrowed, reserved)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `author`: Many-to-one relationship with Author

## Features Summary

✅ **Complete CRUD operations** for both Authors and Books  
✅ **Relational database** with proper foreign key relationships  
✅ **Advanced search capabilities** (by name, title, author, etc.)  
✅ **Data validation** with comprehensive error handling  
✅ **Status tracking** for book availability  
✅ **Statistics endpoints** for author book counts  
✅ **Business logic protection** (prevent deletion of authors with books)  
✅ **ISBN uniqueness constraints** with proper validation  
✅ **Comprehensive unit test coverage** with Jest and mocked dependencies  
✅ **End-to-end API testing** with Supertest and real database interactions  
✅ **Critical workflow testing** ensuring system reliability  
✅ **Backward compatibility** with legacy author names  
✅ **Complete documentation** with examples and curl commands  
✅ **Multiple testing approaches** (unit, e2e, browser, Postman-ready)

## License

This project is licensed under the MIT License.

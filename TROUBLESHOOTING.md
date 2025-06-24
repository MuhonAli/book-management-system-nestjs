# Troubleshooting Guide

This guide helps resolve common issues you might encounter while setting up and running the Book Management System.

## Common Issues and Solutions

### 1. **Build Errors**

#### Issue: TypeScript compilation errors
```bash
error TS2307: Cannot find module '@nestjs/typeorm'
```

**Solution:**
```bash
# Install missing dependencies
npm install @nestjs/typeorm typeorm sqlite3
npm install -D @types/sqlite3

# Clean and rebuild
npm run build
```

#### Issue: Module resolution errors
```bash
Cannot resolve dependency
```

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json  # On Windows: rmdir /s node_modules & del package-lock.json
npm install
```

### 2. **Database Issues**

#### Issue: Database connection fails
```bash
Error: SQLITE_CANTOPEN: unable to open database file
```

**Solution:**
- Ensure the application has write permissions in the current directory
- Check if the database file is locked by another process
- Delete the existing `books.db` file and let the app recreate it

#### Issue: Table doesn't exist errors
```bash
SQLITE_ERROR: no such table: books
```

**Solution:**
```bash
# Delete the database and reseed
del books.db  # On Linux/Mac: rm books.db
npm run start:dev
# Wait for tables to be created, then stop the app
npm run seed
```

#### Issue: Foreign key constraint errors
```bash
FOREIGN KEY constraint failed
```

**Solution:**
- Ensure you're creating authors before creating books with `authorId`
- Run the seed script to populate with proper relationships: `npm run seed`

### 3. **API Errors**

#### Issue: Validation errors when creating records
```bash
400 Bad Request - Validation failed
```

**Common causes and solutions:**
- **Missing required fields**: Ensure `firstName`, `lastName` for authors and `title`, `isbn` for books
- **Invalid ISBN format**: Use valid ISBN-10 or ISBN-13 format (e.g., "978-0-452-28423-4")
- **Invalid date format**: Use ISO date format (YYYY-MM-DD) for dates
- **Duplicate ISBN**: Each book must have a unique ISBN

**Valid Author JSON:**
```json
{
  "firstName": "Stephen",
  "lastName": "King",
  "bio": "American author of horror fiction",
  "birthDate": "1947-09-21"
}
```

**Valid Book JSON:**
```json
{
  "title": "The Shining",
  "authorId": 1,
  "isbn": "978-0-385-12167-5",
  "description": "A horror novel",
  "publishedDate": "1977-01-28",
  "status": "available"
}
```

#### Issue: 404 Not Found errors
```bash
404 Not Found
```

**Solutions:**
- Verify the endpoint URL is correct
- Check that the record exists in the database
- For relationships, ensure the referenced author exists before creating books

### 4. **Server Issues**

#### Issue: Port already in use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find and kill the process using port 3000
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# On Linux/Mac:
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run start:dev
```

#### Issue: Module not found errors at runtime
```bash
Cannot find module './authors/authors.module'
```

**Solution:**
- Ensure all import paths are correct and use forward slashes
- Check that all required files exist
- Rebuild the project: `npm run build`

### 5. **Testing Issues**

#### Issue: Test scripts fail to connect
```bash
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
1. Ensure the server is running: `npm run start:dev`
2. Wait for the server to fully start (look for "Application is running on" message)
3. Then run the test script: `node test-complete-api.js`

#### Issue: Seed script fails
```bash
Error seeding database
```

**Solution:**
```bash
# Stop the development server first
# Then run the seed script
npm run seed

# If it still fails, delete the database and try again
del books.db  # On Linux/Mac: rm books.db
npm run seed
```

### 6. **Development Environment Issues**

#### Issue: Hot reload not working
**Solution:**
- Restart the development server: `npm run start:dev`
- Check if file watchers are working properly
- On Windows, ensure file permissions are correct

#### Issue: TypeScript errors in IDE but builds successfully
**Solution:**
- Restart your IDE/editor
- Clear IDE cache if available
- Ensure your IDE is using the project's TypeScript version

## Development Workflow

### Recommended Development Steps:
1. **Install dependencies**: `npm install`
2. **Build the project**: `npm run build`
3. **Start development server**: `npm run start:dev`
4. **Seed the database**: `npm run seed` (in a new terminal)
5. **Test the API**: `node test-complete-api.js`

### When Making Changes:
1. Stop the development server (Ctrl+C)
2. Make your changes
3. Start the server again: `npm run start:dev`
4. Test your changes

### Database Reset (if needed):
```bash
# Stop the server
# Delete the database file
del books.db  # On Linux/Mac: rm books.db
# Start the server (creates new database)
npm run start:dev
# Seed with sample data
npm run seed
```

## Getting Help

If you encounter issues not covered in this guide:

1. **Check the application logs** in the terminal where you're running `npm run start:dev`
2. **Verify your Node.js version** (should be 16+ recommended)
3. **Check the GitHub issues** for similar problems
4. **Create a new issue** with:
   - Your operating system
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Complete error message
   - Steps to reproduce the issue

## Useful Commands

```bash
# Check versions
node --version
npm --version

# Clean install
rm -rf node_modules package-lock.json
npm install

# Check running processes on port 3000
# Windows:
netstat -ano | findstr :3000
# Linux/Mac:
lsof -i :3000

# View database contents (requires sqlite3 CLI)
sqlite3 books.db ".tables"
sqlite3 books.db "SELECT * FROM authors;"
sqlite3 books.db "SELECT * FROM books;"
```

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from '../src/authors/entities/author.entity';
import { Book } from '../src/books/entities/book.entity';

describe('Critical API Workflows (e2e)', () => {
  let app: INestApplication;
  let authorRepository: Repository<Author>;
  let bookRepository: Repository<Book>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Add global validation pipe to match production setup
    app.useGlobalPipes(new ValidationPipe());
    
    await app.init();

    // Get repository instances for cleanup
    authorRepository = moduleFixture.get<Repository<Author>>(getRepositoryToken(Author));
    bookRepository = moduleFixture.get<Repository<Book>>(getRepositoryToken(Book));
  });

  beforeEach(async () => {
    // Clean up database before each test
    await bookRepository.clear();
    await authorRepository.clear();
  });

  afterAll(async () => {
    // Clean up database and close app
    await bookRepository.clear();
    await authorRepository.clear();
    await app.close();
  });

  describe('Complete Author Management Workflow', () => {
    it('should handle full CRUD operations for authors', async () => {
      // Step 1: Create an author
      const createResponse = await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'George',
          lastName: 'Orwell',
          bio: 'English novelist and essayist',
          birthDate: '1903-06-25',
        })
        .expect(201);

      const authorId = createResponse.body.id;
      expect(createResponse.body).toMatchObject({
        id: expect.any(Number),
        firstName: 'George',
        lastName: 'Orwell',
        bio: 'English novelist and essayist',
        birthDate: '1903-06-25',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Step 2: Retrieve the author
      const getResponse = await request(app.getHttpServer())
        .get(`/authors/${authorId}`)
        .expect(200);

      expect(getResponse.body).toMatchObject({
        id: authorId,
        firstName: 'George',
        lastName: 'Orwell',
        bio: 'English novelist and essayist',
        birthDate: '1903-06-25',
      });

      // Step 3: Update the author
      const updateResponse = await request(app.getHttpServer())
        .patch(`/authors/${authorId}`)
        .send({
          bio: 'Famous English novelist, known for 1984 and Animal Farm',
        })
        .expect(200);

      expect(updateResponse.body.bio).toBe('Famous English novelist, known for 1984 and Animal Farm');
      expect(updateResponse.body.firstName).toBe('George');

      // Step 4: Search for the author
      const searchResponse = await request(app.getHttpServer())
        .get('/authors?firstName=George')
        .expect(200);

      expect(searchResponse.body).toHaveLength(1);
      expect(searchResponse.body[0].id).toBe(authorId);

      // Step 5: Get all authors
      const allAuthorsResponse = await request(app.getHttpServer())
        .get('/authors')
        .expect(200);

      expect(allAuthorsResponse.body).toHaveLength(1);
      expect(allAuthorsResponse.body[0].id).toBe(authorId);

      // Step 6: Delete the author
      await request(app.getHttpServer())
        .delete(`/authors/${authorId}`)
        .expect(200);

      // Step 7: Verify author is deleted
      await request(app.getHttpServer())
        .get(`/authors/${authorId}`)
        .expect(404);
    });
  });

  describe('Complete Book Management Workflow', () => {
    let authorId: number;

    beforeEach(async () => {
      // Create an author for book tests
      const authorResponse = await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'J.K.',
          lastName: 'Rowling',
          bio: 'British author',
        });
      authorId = authorResponse.body.id;
    });

    it('should handle full CRUD operations for books', async () => {
      // Step 1: Create a book
      const createResponse = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Harry Potter and the Philosopher\'s Stone',
          isbn: '978-0747532699',
          description: 'The first Harry Potter book',
          authorId: authorId,
          status: 'available',
        })
        .expect(201);

      const bookId = createResponse.body.id;
      expect(createResponse.body).toMatchObject({
        id: expect.any(Number),
        title: 'Harry Potter and the Philosopher\'s Stone',
        isbn: '978-0747532699',
        description: 'The first Harry Potter book',
        authorId: authorId,
        status: 'available',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Step 2: Retrieve the book
      const getResponse = await request(app.getHttpServer())
        .get(`/books/${bookId}`)
        .expect(200);

      expect(getResponse.body).toMatchObject({
        id: bookId,
        title: 'Harry Potter and the Philosopher\'s Stone',
        isbn: '978-0747532699',
        authorId: authorId,
        status: 'available',
      });

      // Step 3: Find book by ISBN
      const isbnResponse = await request(app.getHttpServer())
        .get('/books/isbn/978-0747532699')
        .expect(200);

      expect(isbnResponse.body.id).toBe(bookId);

      // Step 4: Update the book
      const updateResponse = await request(app.getHttpServer())
        .patch(`/books/${bookId}`)
        .send({
          description: 'The first book in the Harry Potter series by J.K. Rowling',
        })
        .expect(200);

      expect(updateResponse.body.description).toBe('The first book in the Harry Potter series by J.K. Rowling');

      // Step 5: Update book status
      const statusResponse = await request(app.getHttpServer())
        .patch(`/books/${bookId}/status`)
        .send({ status: 'borrowed' })
        .expect(200);

      expect(statusResponse.body.status).toBe('borrowed');

      // Step 6: Verify book is not in available books
      const availableResponse = await request(app.getHttpServer())
        .get('/books/available')
        .expect(200);

      expect(availableResponse.body.find(book => book.id === bookId)).toBeUndefined();

      // Step 7: Return the book
      await request(app.getHttpServer())
        .patch(`/books/${bookId}/status`)
        .send({ status: 'available' })
        .expect(200);

      // Step 8: Verify book is back in available books
      const availableAgainResponse = await request(app.getHttpServer())
        .get('/books/available')
        .expect(200);

      expect(availableAgainResponse.body.find(book => book.id === bookId)).toBeDefined();

      // Step 9: Search books by title
      const searchResponse = await request(app.getHttpServer())
        .get('/books?title=Harry Potter')
        .expect(200);

      expect(searchResponse.body).toHaveLength(1);
      expect(searchResponse.body[0].id).toBe(bookId);

      // Step 10: Get all books
      const allBooksResponse = await request(app.getHttpServer())
        .get('/books')
        .expect(200);

      expect(allBooksResponse.body).toHaveLength(1);
      expect(allBooksResponse.body[0].id).toBe(bookId);

      // Step 11: Delete the book
      await request(app.getHttpServer())
        .delete(`/books/${bookId}`)
        .expect(200);

      // Step 12: Verify book is deleted
      await request(app.getHttpServer())
        .get(`/books/${bookId}`)
        .expect(404);
    });
  });

  describe('Author-Book Relationship Workflow', () => {
    it('should handle complex author-book relationships and constraints', async () => {
      // Step 1: Create an author
      const authorResponse = await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Isaac',
          lastName: 'Asimov',
          bio: 'Science fiction author',
        })
        .expect(201);

      const authorId = authorResponse.body.id;

      // Step 2: Create multiple books for the author
      const book1Response = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Foundation',
          isbn: '978-0553293357',
          authorId: authorId,
          status: 'available',
        })
        .expect(201);

      const book2Response = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'I, Robot',
          isbn: '978-0553294385',
          authorId: authorId,
          status: 'borrowed',
        })
        .expect(201);

      const book3Response = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'The Caves of Steel',
          isbn: '978-0553293395',
          authorId: authorId,
          status: 'reserved',
        })
        .expect(201);

      // Step 3: Get author with books
      const authorWithBooksResponse = await request(app.getHttpServer())
        .get(`/authors/${authorId}`)
        .expect(200);

      expect(authorWithBooksResponse.body.books).toHaveLength(3);
      expect(authorWithBooksResponse.body.books).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Foundation', status: 'available' }),
          expect.objectContaining({ title: 'I, Robot', status: 'borrowed' }),
          expect.objectContaining({ title: 'The Caves of Steel', status: 'reserved' }),
        ])
      );

      // Step 4: Get author statistics
      const statsResponse = await request(app.getHttpServer())
        .get(`/authors/${authorId}/stats`)
        .expect(200);

      expect(statsResponse.body).toMatchObject({
        totalBooks: 3,
        availableBooks: 1,
        borrowedBooks: 1,
        reservedBooks: 1,
      });

      // Step 5: Search books by author
      const booksByAuthorResponse = await request(app.getHttpServer())
        .get(`/books?authorId=${authorId}`)
        .expect(200);

      expect(booksByAuthorResponse.body).toHaveLength(3);
      expect(booksByAuthorResponse.body.every(book => book.authorId === authorId)).toBe(true);

      // Step 6: Try to delete author with books (should fail)
      const deleteAttemptResponse = await request(app.getHttpServer())
        .delete(`/authors/${authorId}`)
        .expect(409);

      expect(deleteAttemptResponse.body.message).toContain('Cannot delete author');

      // Step 7: Delete all books first
      await request(app.getHttpServer())
        .delete(`/books/${book1Response.body.id}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/books/${book2Response.body.id}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/books/${book3Response.body.id}`)
        .expect(200);

      // Step 8: Now delete author should work
      await request(app.getHttpServer())
        .delete(`/authors/${authorId}`)
        .expect(200);

      // Step 9: Verify author is deleted
      await request(app.getHttpServer())
        .get(`/authors/${authorId}`)
        .expect(404);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle validation errors correctly', async () => {
      // Test missing required fields
      await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Only First Name',
          // Missing lastName
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Book without ISBN',
          // Missing ISBN
        })
        .expect(400);

      // Test invalid data types
      await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 123, // Should be string
          lastName: 'Valid',
        })
        .expect(400);
    });

    it('should handle not found errors correctly', async () => {
      await request(app.getHttpServer())
        .get('/authors/999999')
        .expect(404);

      await request(app.getHttpServer())
        .get('/books/999999')
        .expect(404);

      await request(app.getHttpServer())
        .patch('/authors/999999')
        .send({ bio: 'Updated' })
        .expect(404);

      await request(app.getHttpServer())
        .delete('/books/999999')
        .expect(404);
    });

    it('should handle duplicate ISBN correctly', async () => {
      const isbn = '9781234567897'; // Valid ISBN-13

      // Create first book
      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'First Book',
          isbn: isbn,
        })
        .expect(201);

      // Try to create second book with same ISBN
      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Second Book',
          isbn: isbn, // Same ISBN
        })
        .expect(409);
    });
  });

  describe('Search and Filter Functionality', () => {
    beforeEach(async () => {
      // Set up test data
      const author1Response = await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Agatha',
          lastName: 'Christie',
          bio: 'Detective fiction author',
        });

      const author2Response = await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Arthur',
          lastName: 'Christie',
          bio: 'Another Christie',
        });

      // Create books for testing
      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Murder on the Orient Express',
          isbn: '978-0062693662',
          authorId: author1Response.body.id,
          status: 'available',
        });

      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'The ABC Murders',
          isbn: '978-0062879752',
          authorId: author1Response.body.id,
          status: 'borrowed',
        });
    });

    it('should search authors by various criteria', async () => {
      // Search by first name
      const firstNameResponse = await request(app.getHttpServer())
        .get('/authors?firstName=Agatha')
        .expect(200);

      expect(firstNameResponse.body).toHaveLength(1);
      expect(firstNameResponse.body[0].firstName).toBe('Agatha');

      // Search by last name
      const lastNameResponse = await request(app.getHttpServer())
        .get('/authors?lastName=Christie')
        .expect(200);

      expect(lastNameResponse.body).toHaveLength(2);
      expect(lastNameResponse.body.every(author => author.lastName === 'Christie')).toBe(true);

      // Search by full name
      const fullNameResponse = await request(app.getHttpServer())
        .get('/authors?name=Agatha Christie')
        .expect(200);

      expect(fullNameResponse.body).toHaveLength(1);
      expect(fullNameResponse.body[0].firstName).toBe('Agatha');
    });

    it('should search books by various criteria', async () => {
      // Search by title
      const titleResponse = await request(app.getHttpServer())
        .get('/books?title=Orient')
        .expect(200);

      expect(titleResponse.body).toHaveLength(1);
      expect(titleResponse.body[0].title).toContain('Orient Express');

      // Get available books only
      const availableResponse = await request(app.getHttpServer())
        .get('/books/available')
        .expect(200);

      expect(availableResponse.body.every(book => book.status === 'available')).toBe(true);
    });
  });
});

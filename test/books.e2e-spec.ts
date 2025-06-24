import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from '../src/authors/entities/author.entity';
import { Book } from '../src/books/entities/book.entity';

describe('Books API (e2e)', () => {
  let app: INestApplication;
  let authorRepository: Repository<Author>;
  let bookRepository: Repository<Book>;
  let testAuthorId: number;

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

    // Create a test author for books
    const testAuthor = await request(app.getHttpServer())
      .post('/authors')
      .send({
        firstName: 'Test',
        lastName: 'Author',
        bio: 'Author for testing books',
      });
    testAuthorId = testAuthor.body.id;
  });

  afterAll(async () => {
    // Clean up database and close app
    await bookRepository.clear();
    await authorRepository.clear();
    await app.close();
  });

  describe('POST /books', () => {
    it('should create a new book with all fields', async () => {
      const createBookDto = {
        title: '1984',
        isbn: '978-0451524935',
        description: 'A dystopian social science fiction novel',
        publishedDate: '1949-06-08',
        authorId: testAuthorId,
        status: 'available',
      };

      const response = await request(app.getHttpServer())
        .post('/books')
        .send(createBookDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        title: '1984',
        isbn: '978-0451524935',
        description: 'A dystopian social science fiction novel',
        publishedDate: '1949-06-08',
        authorId: testAuthorId,
        status: 'available',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should create a book with only required fields', async () => {
      const createBookDto = {
        title: 'Simple Book',
        isbn: '978-1234567890',
      };

      const response = await request(app.getHttpServer())
        .post('/books')
        .send(createBookDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        title: 'Simple Book',
        isbn: '978-1234567890',
        status: 'available', // Default status
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 400 for missing required fields', async () => {
      const createBookDto = {
        title: 'Book without ISBN',
      };

      await request(app.getHttpServer())
        .post('/books')
        .send(createBookDto)
        .expect(400);
    });

    it('should return 400 for invalid ISBN format', async () => {
      const createBookDto = {
        title: 'Book with Invalid ISBN',
        isbn: 'invalid-isbn',
      };

      await request(app.getHttpServer())
        .post('/books')
        .send(createBookDto)
        .expect(400);
    });

    it('should return 409 for duplicate ISBN', async () => {
      const createBookDto = {
        title: 'First Book',
        isbn: '978-0123456789',
      };

      // Create first book
      await request(app.getHttpServer())
        .post('/books')
        .send(createBookDto)
        .expect(201);

      // Try to create second book with same ISBN
      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Second Book',
          isbn: '978-0123456789', // Same ISBN
        })
        .expect(409);
    });
  });

  describe('GET /books/:id', () => {
    it('should retrieve a book by id', async () => {
      // First create a book
      const createResponse = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Animal Farm',
          isbn: '978-0451526342',
          description: 'A political allegory',
          authorId: testAuthorId,
        })
        .expect(201);

      const bookId = createResponse.body.id;

      // Then retrieve it
      const response = await request(app.getHttpServer())
        .get(`/books/${bookId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: bookId,
        title: 'Animal Farm',
        isbn: '978-0451526342',
        description: 'A political allegory',
        authorId: testAuthorId,
        status: 'available',
      });
    });

    it('should return 404 for non-existent book', async () => {
      await request(app.getHttpServer())
        .get('/books/999')
        .expect(404);
    });

    it('should return 400 for invalid id format', async () => {
      await request(app.getHttpServer())
        .get('/books/invalid-id')
        .expect(400);
    });
  });

  describe('GET /books/isbn/:isbn', () => {
    it('should retrieve a book by ISBN', async () => {
      const isbn = '978-0061120084';
      
      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'To Kill a Mockingbird',
          isbn: isbn,
          authorId: testAuthorId,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/books/isbn/${isbn}`)
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'To Kill a Mockingbird',
        isbn: isbn,
        authorId: testAuthorId,
      });
    });

    it('should return 404 for non-existent ISBN', async () => {
      await request(app.getHttpServer())
        .get('/books/isbn/978-9999999999')
        .expect(404);
    });
  });

  describe('GET /books', () => {
    beforeEach(async () => {
      // Create multiple test books
      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'The Great Gatsby',
          isbn: '978-0743273565',
          authorId: testAuthorId,
          status: 'available',
        });

      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Pride and Prejudice',
          isbn: '978-0141439518',
          authorId: testAuthorId,
          status: 'borrowed',
        });

      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'The Catcher in the Rye',
          isbn: '978-0316769174',
          authorId: testAuthorId,
          status: 'reserved',
        });
    });

    it('should retrieve all books', async () => {
      const response = await request(app.getHttpServer())
        .get('/books')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('isbn');
      expect(response.body[0]).toHaveProperty('status');
    });

    it('should search books by title', async () => {
      const response = await request(app.getHttpServer())
        .get('/books?title=Gatsby')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('The Great Gatsby');
    });

    it('should search books by author ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books?authorId=${testAuthorId}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body.every(book => book.authorId === testAuthorId)).toBe(true);
    });

    it('should return empty array when no books match search', async () => {
      const response = await request(app.getHttpServer())
        .get('/books?title=Nonexistent')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /books/available', () => {
    beforeEach(async () => {
      // Create books with different statuses
      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Available Book 1',
          isbn: '978-1111111111',
          status: 'available',
        });

      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Available Book 2',
          isbn: '978-2222222222',
          status: 'available',
        });

      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Borrowed Book',
          isbn: '978-3333333333',
          status: 'borrowed',
        });
    });

    it('should return only available books', async () => {
      const response = await request(app.getHttpServer())
        .get('/books/available')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every(book => book.status === 'available')).toBe(true);
    });
  });

  describe('PATCH /books/:id', () => {
    let bookId: number;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Original Title',
          isbn: '978-0123456789',
          description: 'Original description',
          authorId: testAuthorId,
        });
      bookId = createResponse.body.id;
    });

    it('should update a book', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/books/${bookId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: bookId,
        title: 'Updated Title',
        description: 'Updated description',
        isbn: '978-0123456789', // Should remain unchanged
        authorId: testAuthorId,
      });
    });

    it('should update only specified fields', async () => {
      const updateData = {
        description: 'Only description updated',
      };

      const response = await request(app.getHttpServer())
        .patch(`/books/${bookId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.description).toBe('Only description updated');
      expect(response.body.title).toBe('Original Title');
    });

    it('should return 404 for non-existent book', async () => {
      await request(app.getHttpServer())
        .patch('/books/999')
        .send({ title: 'Updated' })
        .expect(404);
    });

    it('should return 409 when updating with duplicate ISBN', async () => {
      // Create another book
      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Another Book',
          isbn: '978-9876543210',
        });

      // Try to update first book with the ISBN of the second book
      await request(app.getHttpServer())
        .patch(`/books/${bookId}`)
        .send({ isbn: '978-9876543210' })
        .expect(409);
    });
  });

  describe('PATCH /books/:id/status', () => {
    let bookId: number;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Status Test Book',
          isbn: '978-0123456789',
          status: 'available',
        });
      bookId = createResponse.body.id;
    });

    it('should update book status to borrowed', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/books/${bookId}/status`)
        .send({ status: 'borrowed' })
        .expect(200);

      expect(response.body.status).toBe('borrowed');
    });

    it('should update book status to reserved', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/books/${bookId}/status`)
        .send({ status: 'reserved' })
        .expect(200);

      expect(response.body.status).toBe('reserved');
    });

    it('should update book status back to available', async () => {
      // First change to borrowed
      await request(app.getHttpServer())
        .patch(`/books/${bookId}/status`)
        .send({ status: 'borrowed' })
        .expect(200);

      // Then back to available
      const response = await request(app.getHttpServer())
        .patch(`/books/${bookId}/status`)
        .send({ status: 'available' })
        .expect(200);

      expect(response.body.status).toBe('available');
    });

    it('should return 404 for non-existent book', async () => {
      await request(app.getHttpServer())
        .patch('/books/999/status')
        .send({ status: 'borrowed' })
        .expect(404);
    });
  });

  describe('DELETE /books/:id', () => {
    it('should delete a book', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Book to Delete',
          isbn: '978-0123456789',
        });
      const bookId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/books/${bookId}`)
        .expect(200);

      // Verify book is deleted
      await request(app.getHttpServer())
        .get(`/books/${bookId}`)
        .expect(404);
    });

    it('should return 404 for non-existent book', async () => {
      await request(app.getHttpServer())
        .delete('/books/999')
        .expect(404);
    });
  });

  describe('Integration: Complete book lifecycle', () => {
    it('should handle complete book management workflow', async () => {
      // Step 1: Create a book
      const createResponse = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Lifecycle Test Book',
          isbn: '978-0123456789',
          description: 'A book for testing the complete lifecycle',
          authorId: testAuthorId,
          status: 'available',
        })
        .expect(201);

      const bookId = createResponse.body.id;

      // Step 2: Retrieve the book
      const getResponse = await request(app.getHttpServer())
        .get(`/books/${bookId}`)
        .expect(200);

      expect(getResponse.body.title).toBe('Lifecycle Test Book');
      expect(getResponse.body.status).toBe('available');

      // Step 3: Update book information
      await request(app.getHttpServer())
        .patch(`/books/${bookId}`)
        .send({
          description: 'Updated description for lifecycle test',
        })
        .expect(200);

      // Step 4: Change status to borrowed
      const borrowResponse = await request(app.getHttpServer())
        .patch(`/books/${bookId}/status`)
        .send({ status: 'borrowed' })
        .expect(200);

      expect(borrowResponse.body.status).toBe('borrowed');

      // Step 5: Verify book is not in available books list
      const availableResponse = await request(app.getHttpServer())
        .get('/books/available')
        .expect(200);

      expect(availableResponse.body.find(book => book.id === bookId)).toBeUndefined();

      // Step 6: Return book (change status back to available)
      const returnResponse = await request(app.getHttpServer())
        .patch(`/books/${bookId}/status`)
        .send({ status: 'available' })
        .expect(200);

      expect(returnResponse.body.status).toBe('available');

      // Step 7: Verify book is back in available books list
      const availableAgainResponse = await request(app.getHttpServer())
        .get('/books/available')
        .expect(200);

      expect(availableAgainResponse.body.find(book => book.id === bookId)).toBeDefined();

      // Step 8: Search for the book by title
      const searchResponse = await request(app.getHttpServer())
        .get('/books?title=Lifecycle')
        .expect(200);

      expect(searchResponse.body).toHaveLength(1);
      expect(searchResponse.body[0].id).toBe(bookId);

      // Step 9: Find book by ISBN
      const isbnResponse = await request(app.getHttpServer())
        .get('/books/isbn/978-0123456789')
        .expect(200);

      expect(isbnResponse.body.id).toBe(bookId);

      // Step 10: Delete the book
      await request(app.getHttpServer())
        .delete(`/books/${bookId}`)
        .expect(200);

      // Step 11: Verify book is deleted
      await request(app.getHttpServer())
        .get(`/books/${bookId}`)
        .expect(404);

      await request(app.getHttpServer())
        .get('/books/isbn/978-0123456789')
        .expect(404);
    });
  });
});

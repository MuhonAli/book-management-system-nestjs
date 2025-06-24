import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from '../src/authors/entities/author.entity';
import { Book } from '../src/books/entities/book.entity';

describe('Authors API (e2e)', () => {
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

  describe('POST /authors', () => {
    it('should create a new author with all fields', async () => {
      const createAuthorDto = {
        firstName: 'Jane',
        lastName: 'Austen',
        bio: 'English novelist known for her wit and social commentary',
        birthDate: '1775-12-16',
      };

      const response = await request(app.getHttpServer())
        .post('/authors')
        .send(createAuthorDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        firstName: 'Jane',
        lastName: 'Austen',
        bio: 'English novelist known for her wit and social commentary',
        birthDate: '1775-12-16',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        books: [],
      });
    });

    it('should create a new author with only required fields', async () => {
      const createAuthorDto = {
        firstName: 'Mark',
        lastName: 'Twain',
      };

      const response = await request(app.getHttpServer())
        .post('/authors')
        .send(createAuthorDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        firstName: 'Mark',
        lastName: 'Twain',
        bio: null,
        birthDate: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        books: [],
      });
    });

    it('should return 400 for missing required fields', async () => {
      const createAuthorDto = {
        firstName: 'Only First Name',
      };

      await request(app.getHttpServer())
        .post('/authors')
        .send(createAuthorDto)
        .expect(400);
    });

    it('should return 400 for invalid data types', async () => {
      const createAuthorDto = {
        firstName: 123, // Should be string
        lastName: 'Valid',
      };

      await request(app.getHttpServer())
        .post('/authors')
        .send(createAuthorDto)
        .expect(400);
    });
  });

  describe('GET /authors/:id', () => {
    it('should retrieve an author by id', async () => {
      // First create an author
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

      // Then retrieve it
      const response = await request(app.getHttpServer())
        .get(`/authors/${authorId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: authorId,
        firstName: 'George',
        lastName: 'Orwell',
        bio: 'English novelist and essayist',
        birthDate: '1903-06-25',
        books: [],
      });
    });

    it('should return 404 for non-existent author', async () => {
      await request(app.getHttpServer())
        .get('/authors/999')
        .expect(404);
    });

    it('should return 400 for invalid id format', async () => {
      await request(app.getHttpServer())
        .get('/authors/invalid-id')
        .expect(400);
    });
  });

  describe('GET /authors', () => {
    beforeEach(async () => {
      // Create test authors
      await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Charles',
          lastName: 'Dickens',
          bio: 'English writer and social critic',
        });

      await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Charlotte',
          lastName: 'Brontë',
          bio: 'English novelist and poet',
        });

      await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Emily',
          lastName: 'Brontë',
          bio: 'English novelist and poet',
        });
    });

    it('should retrieve all authors', async () => {
      const response = await request(app.getHttpServer())
        .get('/authors')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('firstName');
      expect(response.body[0]).toHaveProperty('lastName');
      expect(response.body[0]).toHaveProperty('books');
    });

    it('should search authors by first name', async () => {
      const response = await request(app.getHttpServer())
        .get('/authors?firstName=Charlotte')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].firstName).toBe('Charlotte');
      expect(response.body[0].lastName).toBe('Brontë');
    });

    it('should search authors by last name', async () => {
      const response = await request(app.getHttpServer())
        .get('/authors?lastName=Brontë')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every(author => author.lastName === 'Brontë')).toBe(true);
    });

    it('should search authors by full name', async () => {
      const response = await request(app.getHttpServer())
        .get('/authors?name=Charles Dickens')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].firstName).toBe('Charles');
      expect(response.body[0].lastName).toBe('Dickens');
    });

    it('should return empty array when no authors match search', async () => {
      const response = await request(app.getHttpServer())
        .get('/authors?firstName=Nonexistent')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('PATCH /authors/:id', () => {
    let authorId: number;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'J.K.',
          lastName: 'Rowling',
          bio: 'British author',
          birthDate: '1965-07-31',
        });
      authorId = createResponse.body.id;
    });

    it('should update an author', async () => {
      const updateData = {
        bio: 'British author, best known for the Harry Potter series',
        birthDate: '1965-07-31',
      };

      const response = await request(app.getHttpServer())
        .patch(`/authors/${authorId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: authorId,
        firstName: 'J.K.',
        lastName: 'Rowling',
        bio: 'British author, best known for the Harry Potter series',
        birthDate: '1965-07-31',
      });
    });

    it('should update only specified fields', async () => {
      const updateData = {
        bio: 'Updated bio only',
      };

      const response = await request(app.getHttpServer())
        .patch(`/authors/${authorId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.bio).toBe('Updated bio only');
      expect(response.body.firstName).toBe('J.K.');
      expect(response.body.lastName).toBe('Rowling');
    });

    it('should return 404 for non-existent author', async () => {
      await request(app.getHttpServer())
        .patch('/authors/999')
        .send({ bio: 'Updated bio' })
        .expect(404);
    });
  });

  describe('DELETE /authors/:id', () => {
    it('should delete an author without books', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Test',
          lastName: 'Author',
        });
      const authorId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/authors/${authorId}`)
        .expect(200);

      // Verify author is deleted
      await request(app.getHttpServer())
        .get(`/authors/${authorId}`)
        .expect(404);
    });

    it('should not delete an author with books', async () => {
      // Create author
      const authorResponse = await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Author',
          lastName: 'WithBooks',
        });
      const authorId = authorResponse.body.id;

      // Create a book for this author
      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Test Book',
          isbn: '978-0123456789',
          authorId: authorId,
        });

      // Try to delete author - should fail
      const response = await request(app.getHttpServer())
        .delete(`/authors/${authorId}`)
        .expect(409);

      expect(response.body.message).toContain('Cannot delete author');
    });

    it('should return 404 for non-existent author', async () => {
      await request(app.getHttpServer())
        .delete('/authors/999')
        .expect(404);
    });
  });

  describe('GET /authors/:id/stats', () => {
    let authorId: number;

    beforeEach(async () => {
      const authorResponse = await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Stats',
          lastName: 'Author',
        });
      authorId = authorResponse.body.id;
    });

    it('should return stats for author without books', async () => {
      const response = await request(app.getHttpServer())
        .get(`/authors/${authorId}/stats`)
        .expect(200);

      expect(response.body).toMatchObject({
        author: expect.objectContaining({
          id: authorId,
          firstName: 'Stats',
          lastName: 'Author',
        }),
        totalBooks: 0,
        availableBooks: 0,
        borrowedBooks: 0,
        reservedBooks: 0,
      });
    });

    it('should return correct stats for author with books', async () => {
      // Create books with different statuses
      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Available Book',
          isbn: '978-0123456789',
          authorId: authorId,
          status: 'available',
        });

      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Borrowed Book',
          isbn: '978-0987654321',
          authorId: authorId,
          status: 'borrowed',
        });

      await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Reserved Book',
          isbn: '978-1111111111',
          authorId: authorId,
          status: 'reserved',
        });

      const response = await request(app.getHttpServer())
        .get(`/authors/${authorId}/stats`)
        .expect(200);

      expect(response.body).toMatchObject({
        totalBooks: 3,
        availableBooks: 1,
        borrowedBooks: 1,
        reservedBooks: 1,
      });
    });
  });

  describe('Integration: Author and Books workflow', () => {
    it('should create author, add books, and verify relationships', async () => {
      // Step 1: Create an author
      const authorResponse = await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Integration',
          lastName: 'Test',
          bio: 'Author for integration testing',
        })
        .expect(201);

      const authorId = authorResponse.body.id;

      // Step 2: Create books for this author
      const book1Response = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'First Book',
          isbn: '978-0123456789',
          authorId: authorId,
          description: 'First test book',
        })
        .expect(201);

      const book2Response = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Second Book',
          isbn: '978-0987654321',
          authorId: authorId,
          description: 'Second test book',
          status: 'borrowed',
        })
        .expect(201);

      // Step 3: Retrieve author and verify books are associated
      const authorWithBooksResponse = await request(app.getHttpServer())
        .get(`/authors/${authorId}`)
        .expect(200);

      expect(authorWithBooksResponse.body.books).toHaveLength(2);
      expect(authorWithBooksResponse.body.books).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: book1Response.body.id,
            title: 'First Book',
            authorId: authorId,
          }),
          expect.objectContaining({
            id: book2Response.body.id,
            title: 'Second Book',
            authorId: authorId,
          }),
        ])
      );

      // Step 4: Check author stats
      const statsResponse = await request(app.getHttpServer())
        .get(`/authors/${authorId}/stats`)
        .expect(200);

      expect(statsResponse.body).toMatchObject({
        totalBooks: 2,
        availableBooks: 1,
        borrowedBooks: 1,
        reservedBooks: 0,
      });

      // Step 5: Search books by author ID
      const booksByAuthorResponse = await request(app.getHttpServer())
        .get(`/books?authorId=${authorId}`)
        .expect(200);

      expect(booksByAuthorResponse.body).toHaveLength(2);

      // Step 6: Try to delete author (should fail because of books)
      await request(app.getHttpServer())
        .delete(`/authors/${authorId}`)
        .expect(409);

      // Step 7: Delete books first
      await request(app.getHttpServer())
        .delete(`/books/${book1Response.body.id}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/books/${book2Response.body.id}`)
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
});

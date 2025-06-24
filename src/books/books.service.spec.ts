import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

describe('BooksService', () => {
  let service: BooksService;
  let repository: jest.Mocked<Repository<Book>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Book>>;

  const mockBook: Book = {
    id: 1,
    title: 'Test Book',
    isbn: '978-0123456789',
    description: 'A test book',
    publishedDate: '2023-01-01',
    status: 'available',
    authorId: 1,
    authorName: 'John Doe',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockBooksArray: Book[] = [
    mockBook,
    {
      ...mockBook,
      id: 2,
      title: 'Another Test Book',
      isbn: '978-0987654321',
      status: 'borrowed',
    },
  ];

  beforeEach(async () => {
    // Create mock query builder
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as any;

    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    repository = module.get<Repository<Book>>(
      getRepositoryToken(Book),
    ) as jest.Mocked<Repository<Book>>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new book successfully', async () => {
      const createBookDto: CreateBookDto = {
        title: 'Test Book',
        isbn: '978-0123456789',
        description: 'A test book',
        publishedDate: '2023-01-01',
        authorId: 1,
        authorName: 'John Doe',
      };

      repository.create.mockReturnValue(mockBook);
      repository.save.mockResolvedValue(mockBook);

      const result = await service.create(createBookDto);

      expect(repository.create).toHaveBeenCalledWith(createBookDto);
      expect(repository.save).toHaveBeenCalledWith(mockBook);
      expect(result).toEqual(mockBook);
    });

    it('should throw ConflictException when ISBN already exists', async () => {
      const createBookDto: CreateBookDto = {
        title: 'Test Book',
        isbn: '978-0123456789',
      };

      const error = { code: 'SQLITE_CONSTRAINT_UNIQUE' };
      repository.create.mockReturnValue(mockBook);
      repository.save.mockRejectedValue(error);

      await expect(service.create(createBookDto)).rejects.toThrow(
        new ConflictException('A book with this ISBN already exists'),
      );
    });

    it('should handle other database errors', async () => {
      const createBookDto: CreateBookDto = {
        title: 'Test Book',
        isbn: '978-0123456789',
      };

      const error = new Error('Database connection error');
      repository.create.mockReturnValue(mockBook);
      repository.save.mockRejectedValue(error);

      await expect(service.create(createBookDto)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return all books ordered by creation date', async () => {
      repository.find.mockResolvedValue(mockBooksArray);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockBooksArray);
    });

    it('should return empty array when no books exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a book by id', async () => {
      repository.findOne.mockResolvedValue(mockBook);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockBook);
    });

    it('should throw NotFoundException when book not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Book with ID 999 not found'),
      );
    });
  });

  describe('findByIsbn', () => {
    it('should return a book by ISBN', async () => {
      repository.findOne.mockResolvedValue(mockBook);

      const result = await service.findByIsbn('978-0123456789');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { isbn: '978-0123456789' },
      });
      expect(result).toEqual(mockBook);
    });

    it('should throw NotFoundException when book with ISBN not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findByIsbn('978-9999999999')).rejects.toThrow(
        new NotFoundException('Book with ISBN 978-9999999999 not found'),
      );
    });
  });

  describe('findByAuthor', () => {
    it('should return books by author name', async () => {
      const authorBooks = [mockBook];
      repository.find.mockResolvedValue(authorBooks);

      const result = await service.findByAuthor('John Doe');

      expect(repository.find).toHaveBeenCalledWith({
        where: { authorName: 'John Doe' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(authorBooks);
    });

    it('should return empty array when no books found for author', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findByAuthor('Unknown Author');

      expect(result).toEqual([]);
    });
  });

  describe('findByAuthorId', () => {
    it('should return books by author ID', async () => {
      const authorBooks = [mockBook];
      repository.find.mockResolvedValue(authorBooks);

      const result = await service.findByAuthorId(1);

      expect(repository.find).toHaveBeenCalledWith({
        where: { authorId: 1 },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(authorBooks);
    });

    it('should return empty array when no books found for author ID', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findByAuthorId(999);

      expect(result).toEqual([]);
    });
  });

  describe('searchByTitle', () => {
    it('should search books by title pattern', async () => {
      const searchResults = [mockBook];
      queryBuilder.getMany.mockResolvedValue(searchResults);

      const result = await service.searchByTitle('Test');

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('book');
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'book.title LIKE :title',
        { title: '%Test%' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('book.createdAt', 'DESC');
      expect(result).toEqual(searchResults);
    });

    it('should return empty array when no books match title search', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      const result = await service.searchByTitle('Nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a book successfully', async () => {
      const updateBookDto: UpdateBookDto = {
        title: 'Updated Test Book',
        description: 'Updated description',
      };

      const updatedBook = { ...mockBook, ...updateBookDto };

      repository.findOne.mockResolvedValue(mockBook);
      repository.save.mockResolvedValue(updatedBook);

      const result = await service.update(1, updateBookDto);

      expect(repository.save).toHaveBeenCalledWith({
        ...mockBook,
        ...updateBookDto,
      });
      expect(result).toEqual(updatedBook);
    });

    it('should throw NotFoundException when updating non-existent book', async () => {
      const updateBookDto: UpdateBookDto = { title: 'Updated' };
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateBookDto)).rejects.toThrow(
        new NotFoundException('Book with ID 999 not found'),
      );
    });

    it('should throw ConflictException when updating with duplicate ISBN', async () => {
      const updateBookDto: UpdateBookDto = { isbn: '978-0987654321' };
      const error = { code: 'SQLITE_CONSTRAINT_UNIQUE' };

      repository.findOne.mockResolvedValue(mockBook);
      repository.save.mockRejectedValue(error);

      await expect(service.update(1, updateBookDto)).rejects.toThrow(
        new ConflictException('A book with this ISBN already exists'),
      );
    });

    it('should handle other update errors', async () => {
      const updateBookDto: UpdateBookDto = { title: 'Updated' };
      const error = new Error('Database error');

      repository.findOne.mockResolvedValue(mockBook);
      repository.save.mockRejectedValue(error);

      await expect(service.update(1, updateBookDto)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    it('should remove a book successfully', async () => {
      repository.findOne.mockResolvedValue(mockBook);
      repository.remove.mockResolvedValue(mockBook);

      await service.remove(1);

      expect(repository.remove).toHaveBeenCalledWith(mockBook);
    });

    it('should throw NotFoundException when removing non-existent book', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Book with ID 999 not found'),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update book status successfully', async () => {
      const updatedBook = { ...mockBook, status: 'borrowed' as const };

      repository.findOne.mockResolvedValue(mockBook);
      repository.save.mockResolvedValue(updatedBook);

      const result = await service.updateStatus(1, 'borrowed');

      expect(repository.save).toHaveBeenCalledWith({
        ...mockBook,
        status: 'borrowed',
      });
      expect(result).toEqual(updatedBook);
    });

    it('should throw NotFoundException when updating status of non-existent book', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(999, 'borrowed')).rejects.toThrow(
        new NotFoundException('Book with ID 999 not found'),
      );
    });

    it('should update status to available', async () => {
      const borrowedBook = { ...mockBook, status: 'borrowed' as const };
      const availableBook = { ...mockBook, status: 'available' as const };

      repository.findOne.mockResolvedValue(borrowedBook);
      repository.save.mockResolvedValue(availableBook);

      const result = await service.updateStatus(1, 'available');

      expect(result.status).toBe('available');
    });

    it('should update status to reserved', async () => {
      const reservedBook = { ...mockBook, status: 'reserved' as const };

      repository.findOne.mockResolvedValue(mockBook);
      repository.save.mockResolvedValue(reservedBook);

      const result = await service.updateStatus(1, 'reserved');

      expect(result.status).toBe('reserved');
    });
  });

  describe('getAvailableBooks', () => {
    it('should return only available books', async () => {
      const availableBooks = [
        { ...mockBook, status: 'available' as const },
        { ...mockBook, id: 2, status: 'available' as const },
      ];

      repository.find.mockResolvedValue(availableBooks);

      const result = await service.getAvailableBooks();

      expect(repository.find).toHaveBeenCalledWith({
        where: { status: 'available' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(availableBooks);
      expect(result.every(book => book.status === 'available')).toBe(true);
    });

    it('should return empty array when no available books exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.getAvailableBooks();

      expect(result).toEqual([]);
    });
  });
});

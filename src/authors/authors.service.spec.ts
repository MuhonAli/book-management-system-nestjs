import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { Author } from './entities/author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

describe('AuthorsService', () => {
  let service: AuthorsService;
  let repository: jest.Mocked<Repository<Author>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Author>>;

  // Helper function to create Author instances with proper getter
  const createMockAuthor = (overrides: Partial<Author> = {}): Author => {
    const author = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      bio: 'A great author',
      birthDate: '1980-01-15',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      books: [],
      ...overrides,
    };
    
    // Add fullName getter
    Object.defineProperty(author, 'fullName', {
      get: function() {
        return `${this.firstName} ${this.lastName}`;
      },
      enumerable: true,
      configurable: true
    });
    
    return author as Author;
  };

  const mockAuthor = createMockAuthor();

  const mockAuthorWithBooks = createMockAuthor({
    books: [
      {
        id: 1,
        title: 'Test Book',
        isbn: '978-0123456789',
        status: 'available' as const,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        title: 'Another Book',
        isbn: '978-0987654321',
        status: 'borrowed' as const,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  beforeEach(async () => {
    // Create mock query builder
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
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
        AuthorsService,
        {
          provide: getRepositoryToken(Author),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    repository = module.get<Repository<Author>>(
      getRepositoryToken(Author),
    ) as jest.Mocked<Repository<Author>>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new author successfully', async () => {
      const createAuthorDto: CreateAuthorDto = {
        firstName: 'John',
        lastName: 'Doe',
        bio: 'A great author',
        birthDate: '1980-01-15',
      };

      repository.create.mockReturnValue(mockAuthor);
      repository.save.mockResolvedValue(mockAuthor);

      const result = await service.create(createAuthorDto);

      expect(repository.create).toHaveBeenCalledWith(createAuthorDto);
      expect(repository.save).toHaveBeenCalledWith(mockAuthor);
      expect(result).toEqual(mockAuthor);
    });

    it('should handle creation errors', async () => {
      const createAuthorDto: CreateAuthorDto = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const error = new Error('Database error');
      repository.create.mockReturnValue(mockAuthor);
      repository.save.mockRejectedValue(error);

      await expect(service.create(createAuthorDto)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return all authors with books ordered by creation date', async () => {
      const authors = [mockAuthor, createMockAuthor({ id: 2 })];
      repository.find.mockResolvedValue(authors);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['books'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(authors);
    });

    it('should return empty array when no authors exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an author by id', async () => {
      repository.findOne.mockResolvedValue(mockAuthor);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['books'],
      });
      expect(result).toEqual(mockAuthor);
    });

    it('should throw NotFoundException when author not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Author with ID 999 not found'),
      );
    });
  });

  describe('findByName', () => {
    it('should find authors by first name', async () => {
      const authors = [mockAuthor];
      queryBuilder.getMany.mockResolvedValue(authors);

      const result = await service.findByName('John');

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('author');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('author.books', 'books');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('author.createdAt', 'DESC');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'author.firstName LIKE :firstName',
        { firstName: '%John%' },
      );
      expect(result).toEqual(authors);
    });

    it('should find authors by last name', async () => {
      const authors = [mockAuthor];
      queryBuilder.getMany.mockResolvedValue(authors);

      const result = await service.findByName(undefined, 'Doe');

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'author.lastName LIKE :lastName',
        { lastName: '%Doe%' },
      );
      expect(result).toEqual(authors);
    });

    it('should find authors by both first and last name', async () => {
      const authors = [mockAuthor];
      queryBuilder.getMany.mockResolvedValue(authors);

      const result = await service.findByName('John', 'Doe');

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'author.firstName LIKE :firstName',
        { firstName: '%John%' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'author.lastName LIKE :lastName',
        { lastName: '%Doe%' },
      );
      expect(result).toEqual(authors);
    });

    it('should return all authors when no name filters provided', async () => {
      const authors = [mockAuthor];
      queryBuilder.getMany.mockResolvedValue(authors);

      const result = await service.findByName();

      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual(authors);
    });
  });

  describe('searchByFullName', () => {
    it('should search authors by full name pattern', async () => {
      const authors = [mockAuthor];
      queryBuilder.getMany.mockResolvedValue(authors);

      const result = await service.searchByFullName('John Doe');

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('author');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('author.books', 'books');
      expect(queryBuilder.where).toHaveBeenCalledWith(
        "CONCAT(author.firstName, ' ', author.lastName) LIKE :name",
        { name: '%John Doe%' },
      );
      expect(queryBuilder.orWhere).toHaveBeenCalledWith(
        'author.firstName LIKE :name',
        { name: '%John Doe%' },
      );
      expect(queryBuilder.orWhere).toHaveBeenCalledWith(
        'author.lastName LIKE :name',
        { name: '%John Doe%' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('author.createdAt', 'DESC');
      expect(result).toEqual(authors);
    });
  });

  describe('update', () => {
    it('should update an author successfully', async () => {
      const updateAuthorDto: UpdateAuthorDto = {
        firstName: 'Jane',
        bio: 'Updated bio',
      };

      const updatedAuthor = createMockAuthor({ ...mockAuthor, ...updateAuthorDto });

      repository.findOne.mockResolvedValue(mockAuthor);
      repository.save.mockResolvedValue(updatedAuthor);

      const result = await service.update(1, updateAuthorDto);

      expect(repository.save).toHaveBeenCalledWith({
        ...mockAuthor,
        ...updateAuthorDto,
      });
      expect(result).toEqual(updatedAuthor);
    });

    it('should throw NotFoundException when updating non-existent author', async () => {
      const updateAuthorDto: UpdateAuthorDto = { firstName: 'Jane' };
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateAuthorDto)).rejects.toThrow(
        new NotFoundException('Author with ID 999 not found'),
      );
    });

    it('should handle update errors', async () => {
      const updateAuthorDto: UpdateAuthorDto = { firstName: 'Jane' };
      const error = new Error('Database error');

      repository.findOne.mockResolvedValue(mockAuthor);
      repository.save.mockRejectedValue(error);

      await expect(service.update(1, updateAuthorDto)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    it('should remove an author without books', async () => {
      repository.findOne.mockResolvedValue(mockAuthor);
      repository.remove.mockResolvedValue(mockAuthor);

      await service.remove(1);

      expect(repository.remove).toHaveBeenCalledWith(mockAuthor);
    });

    it('should throw ConflictException when removing author with books', async () => {
      repository.findOne.mockResolvedValue(mockAuthorWithBooks);

      await expect(service.remove(1)).rejects.toThrow(
        new ConflictException('Cannot delete author. Author has 2 book(s) associated.'),
      );

      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when removing non-existent author', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Author with ID 999 not found'),
      );
    });
  });

  describe('getAuthorsWithBooks', () => {
    it('should return authors with books', async () => {
      const authorsWithBooks = [mockAuthorWithBooks];
      repository.find.mockResolvedValue(authorsWithBooks);

      const result = await service.getAuthorsWithBooks();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['books'],
        where: {
          books: {
            id: undefined,
          },
        },
      });
      expect(result).toEqual(authorsWithBooks);
    });
  });

  describe('getAuthorStats', () => {
    it('should return author statistics', async () => {
      const authorWithMixedBooks = createMockAuthor({
        books: [
          {
            id: 1,
            title: 'Available Book',
            isbn: '978-0123456789',
            status: 'available' as const,
            authorId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            title: 'Borrowed Book',
            isbn: '978-0987654321',
            status: 'borrowed' as const,
            authorId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 3,
            title: 'Reserved Book',
            isbn: '978-1111111111',
            status: 'reserved' as const,
            authorId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      repository.findOne.mockResolvedValue(authorWithMixedBooks);

      const result = await service.getAuthorStats(1);

      expect(result).toEqual({
        author: authorWithMixedBooks,
        totalBooks: 3,
        availableBooks: 1,
        borrowedBooks: 1,
        reservedBooks: 1,
      });
    });

    it('should return zero stats for author without books', async () => {
      repository.findOne.mockResolvedValue(mockAuthor);

      const result = await service.getAuthorStats(1);

      expect(result).toEqual({
        author: mockAuthor,
        totalBooks: 0,
        availableBooks: 0,
        borrowedBooks: 0,
        reservedBooks: 0,
      });
    });

    it('should throw NotFoundException for non-existent author', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.getAuthorStats(999)).rejects.toThrow(
        new NotFoundException('Author with ID 999 not found'),
      );
    });
  });
});

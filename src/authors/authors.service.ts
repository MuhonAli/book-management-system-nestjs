import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from './entities/author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private authorsRepository: Repository<Author>,
  ) {}

  async create(createAuthorDto: CreateAuthorDto): Promise<Author> {
    try {
      const author = this.authorsRepository.create(createAuthorDto);
      return await this.authorsRepository.save(author);
    } catch (error) {
      throw error;
    }
  }

  async findAll(): Promise<Author[]> {
    return await this.authorsRepository.find({
      relations: ['books'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Author> {
    const author = await this.authorsRepository.findOne({ 
      where: { id },
      relations: ['books']
    });
    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }
    return author;
  }

  async findByName(firstName?: string, lastName?: string): Promise<Author[]> {
    const query = this.authorsRepository.createQueryBuilder('author')
      .leftJoinAndSelect('author.books', 'books')
      .orderBy('author.createdAt', 'DESC');

    if (firstName) {
      query.andWhere('author.firstName LIKE :firstName', { firstName: `%${firstName}%` });
    }

    if (lastName) {
      query.andWhere('author.lastName LIKE :lastName', { lastName: `%${lastName}%` });
    }

    return await query.getMany();
  }

  async searchByFullName(name: string): Promise<Author[]> {
    return await this.authorsRepository
      .createQueryBuilder('author')
      .leftJoinAndSelect('author.books', 'books')
      .where('CONCAT(author.firstName, \' \', author.lastName) LIKE :name', { name: `%${name}%` })
      .orWhere('author.firstName LIKE :name', { name: `%${name}%` })
      .orWhere('author.lastName LIKE :name', { name: `%${name}%` })
      .orderBy('author.createdAt', 'DESC')
      .getMany();
  }

  async update(id: number, updateAuthorDto: UpdateAuthorDto): Promise<Author> {
    const author = await this.findOne(id);
    
    try {
      Object.assign(author, updateAuthorDto);
      return await this.authorsRepository.save(author);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const author = await this.findOne(id);
    
    // Check if author has books
    if (author.books && author.books.length > 0) {
      throw new ConflictException(`Cannot delete author. Author has ${author.books.length} book(s) associated.`);
    }
    
    await this.authorsRepository.remove(author);
  }

  async getAuthorsWithBooks(): Promise<Author[]> {
    return await this.authorsRepository.find({
      relations: ['books'],
      where: {
        books: {
          id: undefined // This will filter authors that have at least one book
        }
      }
    });
  }

  async getAuthorStats(id: number): Promise<{
    author: Author;
    totalBooks: number;
    availableBooks: number;
    borrowedBooks: number;
    reservedBooks: number;
  }> {
    const author = await this.findOne(id);
    
    const totalBooks = author.books.length;
    const availableBooks = author.books.filter(book => book.status === 'available').length;
    const borrowedBooks = author.books.filter(book => book.status === 'borrowed').length;
    const reservedBooks = author.books.filter(book => book.status === 'reserved').length;

    return {
      author,
      totalBooks,
      availableBooks,
      borrowedBooks,
      reservedBooks,
    };
  }
}

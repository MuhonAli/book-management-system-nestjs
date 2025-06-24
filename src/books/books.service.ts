import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    try {
      const book = this.booksRepository.create(createBookDto);
      return await this.booksRepository.save(book);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ConflictException('A book with this ISBN already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Book[]> {
    return await this.booksRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.booksRepository.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  async findByIsbn(isbn: string): Promise<Book> {
    const book = await this.booksRepository.findOne({ where: { isbn } });
    if (!book) {
      throw new NotFoundException(`Book with ISBN ${isbn} not found`);
    }
    return book;
  }

  async findByAuthor(author: string): Promise<Book[]> {
    return await this.booksRepository.find({
      where: { authorName: author },
      order: { createdAt: 'DESC' },
    });
  }

  async findByAuthorId(authorId: number): Promise<Book[]> {
    return await this.booksRepository.find({
      where: { authorId },
      order: { createdAt: 'DESC' },
    });
  }

  async searchByTitle(title: string): Promise<Book[]> {
    return await this.booksRepository
      .createQueryBuilder('book')
      .where('book.title LIKE :title', { title: `%${title}%` })
      .orderBy('book.createdAt', 'DESC')
      .getMany();
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    
    try {
      Object.assign(book, updateBookDto);
      return await this.booksRepository.save(book);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ConflictException('A book with this ISBN already exists');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const book = await this.findOne(id);
    await this.booksRepository.remove(book);
  }

  async updateStatus(id: number, status: 'available' | 'borrowed' | 'reserved'): Promise<Book> {
    const book = await this.findOne(id);
    book.status = status;
    return await this.booksRepository.save(book);
  }

  async getAvailableBooks(): Promise<Book[]> {
    return await this.booksRepository.find({
      where: { status: 'available' },
      order: { createdAt: 'DESC' },
    });
  }
}

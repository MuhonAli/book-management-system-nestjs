import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  create(@Body(ValidationPipe) createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  findAll(
    @Query('author') author?: string,
    @Query('authorId') authorId?: string,
    @Query('title') title?: string
  ) {
    if (author) {
      return this.booksService.findByAuthor(author);
    }
    if (authorId) {
      return this.booksService.findByAuthorId(parseInt(authorId));
    }
    if (title) {
      return this.booksService.searchByTitle(title);
    }
    return this.booksService.findAll();
  }

  @Get('available')
  findAvailable() {
    return this.booksService.getAvailableBooks();
  }

  @Get('isbn/:isbn')
  findByIsbn(@Param('isbn') isbn: string) {
    return this.booksService.findByIsbn(isbn);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateBookDto: UpdateBookDto,
  ) {
    return this.booksService.update(id, updateBookDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'available' | 'borrowed' | 'reserved',
  ) {
    return this.booksService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.remove(id);
  }
}

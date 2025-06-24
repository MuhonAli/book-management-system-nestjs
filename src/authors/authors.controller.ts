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
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  create(@Body(ValidationPipe) createAuthorDto: CreateAuthorDto) {
    return this.authorsService.create(createAuthorDto);
  }

  @Get()
  findAll(
    @Query('firstName') firstName?: string,
    @Query('lastName') lastName?: string,
    @Query('name') name?: string
  ) {
    if (name) {
      return this.authorsService.searchByFullName(name);
    }
    if (firstName || lastName) {
      return this.authorsService.findByName(firstName, lastName);
    }
    return this.authorsService.findAll();
  }

  @Get('with-books')
  findAuthorsWithBooks() {
    return this.authorsService.getAuthorsWithBooks();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.authorsService.findOne(id);
  }

  @Get(':id/stats')
  getAuthorStats(@Param('id', ParseIntPipe) id: number) {
    return this.authorsService.getAuthorStats(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateAuthorDto: UpdateAuthorDto,
  ) {
    return this.authorsService.update(id, updateAuthorDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.authorsService.remove(id);
  }
}

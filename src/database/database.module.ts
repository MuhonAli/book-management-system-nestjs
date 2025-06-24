import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/entities/book.entity';
import { Author } from '../authors/entities/author.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'books.db',
      entities: [Book, Author],
      synchronize: true, // Set to false in production
      logging: true,
    }),
  ],
})
export class DatabaseModule {}

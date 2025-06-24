import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsISBN, IsNumber } from 'class-validator';
import { Author } from '../../authors/entities/author.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsNumber()
  authorId?: number;

  @ManyToOne(() => Author, author => author.books, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author?: Author;

  // Keep legacy author field for backward compatibility
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  authorName?: string;

  @Column({ unique: true })
  @IsISBN()
  isbn: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @Column({ default: 'available' })
  @IsOptional()
  @IsString()
  status: 'available' | 'borrowed' | 'reserved';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

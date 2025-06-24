import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { Book } from '../../books/entities/book.entity';

@Entity('authors')
export class Author {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Book, book => book.author)
  books: Book[];

  // Virtual property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

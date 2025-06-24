import { IsString, IsNotEmpty, IsOptional, IsDateString, IsISBN, IsIn, IsNumber } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsNumber()
  authorId?: number;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsISBN()
  isbn: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @IsOptional()
  @IsIn(['available', 'borrowed', 'reserved'])
  status?: 'available' | 'borrowed' | 'reserved';
}

import { DataSource } from 'typeorm';
import { Book } from '../books/entities/book.entity';
import { Author } from '../authors/entities/author.entity';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'books.db',
  entities: [Book, Author],
  synchronize: true,
});

const sampleAuthors = [
  {
    firstName: "Harper",
    lastName: "Lee",
    bio: "American novelist best known for To Kill a Mockingbird",
    birthDate: "1926-04-28"
  },
  {
    firstName: "George",
    lastName: "Orwell",
    bio: "English novelist and essayist, journalist and critic",
    birthDate: "1903-06-25"
  },
  {
    firstName: "F. Scott",
    lastName: "Fitzgerald",
    bio: "American novelist and short story writer",
    birthDate: "1896-09-24"
  },
  {
    firstName: "Jane",
    lastName: "Austen",
    bio: "English novelist known for her wit and social commentary",
    birthDate: "1775-12-16"
  },
  {
    firstName: "J.D.",
    lastName: "Salinger",
    bio: "American writer known for his novel The Catcher in the Rye",
    birthDate: "1919-01-01"
  }
];

const sampleBooks = [
  {
    title: "To Kill a Mockingbird",
    isbn: "978-0-06-112008-4",
    description: "A classic novel about racial injustice and childhood innocence",
    publishedDate: "1960-07-11",
    status: "available" as const,
    authorIndex: 0
  },
  {
    title: "1984",
    isbn: "978-0-452-28423-4",
    description: "A dystopian social science fiction novel",
    publishedDate: "1949-06-08",
    status: "available" as const,
    authorIndex: 1
  },
  {
    title: "Animal Farm",
    isbn: "978-0-452-28424-1",
    description: "A political allegory about farm animals",
    publishedDate: "1945-08-17",
    status: "available" as const,
    authorIndex: 1
  },
  {
    title: "The Great Gatsby",
    isbn: "978-0-7432-7356-5",
    description: "A classic American novel about the Jazz Age",
    publishedDate: "1925-04-10",
    status: "borrowed" as const,
    authorIndex: 2
  },
  {
    title: "Pride and Prejudice",
    isbn: "978-0-14-143951-8",
    description: "A romantic novel about manners and marriage",
    publishedDate: "1813-01-28",
    status: "available" as const,
    authorIndex: 3
  },
  {
    title: "Sense and Sensibility",
    isbn: "978-0-14-143977-8",
    description: "Jane Austen's first published novel",
    publishedDate: "1811-10-30",
    status: "available" as const,
    authorIndex: 3
  },
  {
    title: "The Catcher in the Rye",
    isbn: "978-0-316-76948-0",
    description: "A controversial novel about teenage rebellion",
    publishedDate: "1951-07-16",
    status: "reserved" as const,
    authorIndex: 4
  }
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const authorRepository = AppDataSource.getRepository(Author);
    const bookRepository = AppDataSource.getRepository(Book);

    // Clear existing data
    await bookRepository.clear();
    await authorRepository.clear();
    console.log('Cleared existing data');

    // Insert sample authors
    const savedAuthors: Author[] = [];
    for (const authorData of sampleAuthors) {
      const author = authorRepository.create(authorData);
      const savedAuthor = await authorRepository.save(author);
      savedAuthors.push(savedAuthor);
      console.log(`Added author: ${savedAuthor.fullName}`);
    }

    // Insert sample books with author relationships
    for (const bookData of sampleBooks) {
      const { authorIndex, ...bookInfo } = bookData;
      const book = bookRepository.create({
        ...bookInfo,
        authorId: savedAuthors[authorIndex].id,
        authorName: savedAuthors[authorIndex].fullName // For backward compatibility
      });
      await bookRepository.save(book);
      console.log(`Added book: ${book.title} by ${savedAuthors[authorIndex].fullName}`);
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();

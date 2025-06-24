const http = require('http');

const baseUrl = 'http://localhost:3000';

// Test data
const testAuthor = {
  firstName: "Stephen",
  lastName: "King",
  bio: "American author of horror, supernatural fiction, suspense, crime, science-fiction, and fantasy novels",
  birthDate: "1947-09-21"
};

const testBook = {
  title: "The Shining",
  isbn: "978-0-385-12167-5",
  description: "A horror novel about a family isolated in a haunted hotel",
  publishedDate: "1977-01-28",
  status: "available"
};

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : null;
          resolve({ statusCode: res.statusCode, data: result });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing Complete Book Management System API...\n');
  let createdAuthorId = null;

  try {
    // 1. Test Authors API
    console.log('📝 === TESTING AUTHORS API ===');
    
    // Create an author
    console.log('1. Creating an author...');
    const createAuthorResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/authors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, testAuthor);
    
    console.log(`Status: ${createAuthorResponse.statusCode}`);
    console.log('Response:', createAuthorResponse.data);
    
    if (createAuthorResponse.data && createAuthorResponse.data.id) {
      createdAuthorId = createAuthorResponse.data.id;
    }
    console.log('');

    // Get all authors
    console.log('2. Getting all authors...');
    const getAllAuthorsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/authors',
      method: 'GET',
    });
    
    console.log(`Status: ${getAllAuthorsResponse.statusCode}`);
    console.log(`Found ${getAllAuthorsResponse.data.length} authors`);
    console.log('');

    // Search authors by name
    console.log('3. Searching authors by name...');
    const searchAuthorsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/authors?name=George',
      method: 'GET',
    });
    
    console.log(`Status: ${searchAuthorsResponse.statusCode}`);
    console.log(`Found ${searchAuthorsResponse.data.length} authors matching "George"`);
    console.log('');

    // Get author by ID
    if (createdAuthorId) {
      console.log('4. Getting author by ID...');
      const getAuthorResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/authors/${createdAuthorId}`,
        method: 'GET',
      });
      
      console.log(`Status: ${getAuthorResponse.statusCode}`);
      console.log('Author:', getAuthorResponse.data);
      console.log('');
    }

    // 2. Test Books API
    console.log('📚 === TESTING BOOKS API ===');

    // Create a book with author relationship
    if (createdAuthorId) {
      console.log('5. Creating a book with author relationship...');
      const bookWithAuthor = { ...testBook, authorId: createdAuthorId };
      const createBookResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/books',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }, bookWithAuthor);
      
      console.log(`Status: ${createBookResponse.statusCode}`);
      console.log('Response:', createBookResponse.data);
      console.log('');
    }

    // Get all books
    console.log('6. Getting all books...');
    const getAllBooksResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/books',
      method: 'GET',
    });
    
    console.log(`Status: ${getAllBooksResponse.statusCode}`);
    console.log(`Found ${getAllBooksResponse.data.length} books`);
    console.log('');

    // Get books by author ID
    if (createdAuthorId) {
      console.log('7. Getting books by author ID...');
      const getBooksByAuthorResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/books?authorId=${createdAuthorId}`,
        method: 'GET',
      });
      
      console.log(`Status: ${getBooksByAuthorResponse.statusCode}`);
      console.log(`Found ${getBooksByAuthorResponse.data.length} books by author ${createdAuthorId}`);
      console.log('');
    }

    // Get available books
    console.log('8. Getting available books...');
    const getAvailableBooksResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/books/available',
      method: 'GET',
    });
    
    console.log(`Status: ${getAvailableBooksResponse.statusCode}`);
    console.log(`Found ${getAvailableBooksResponse.data.length} available books`);
    console.log('');

    // Get author stats
    if (createdAuthorId) {
      console.log('9. Getting author statistics...');
      const getAuthorStatsResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/authors/${createdAuthorId}/stats`,
        method: 'GET',
      });
      
      console.log(`Status: ${getAuthorStatsResponse.statusCode}`);
      console.log('Author Stats:', getAuthorStatsResponse.data);
      console.log('');
    }

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('Make sure the server is running with: npm run start:dev');
  }
}

testAPI();

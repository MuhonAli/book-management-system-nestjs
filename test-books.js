const https = require('http');

const baseUrl = 'http://localhost:3000';

// Test data
const testBook = {
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  isbn: "978-0-7432-7356-5",
  description: "A classic American novel",
  publishedDate: "1925-04-10",
  status: "available"
};

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
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
  console.log('Testing Book Management System API...\n');

  try {
    // 1. Create a book
    console.log('1. Creating a book...');
    const createResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/books',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, testBook);
    
    console.log(`Status: ${createResponse.statusCode}`);
    console.log('Response:', createResponse.data);
    console.log('');

    // 2. Get all books
    console.log('2. Getting all books...');
    const getAllResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/books',
      method: 'GET',
    });
    
    console.log(`Status: ${getAllResponse.statusCode}`);
    console.log('Response:', getAllResponse.data);
    console.log('');

    // 3. Get available books
    console.log('3. Getting available books...');
    const getAvailableResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/books/available',
      method: 'GET',
    });
    
    console.log(`Status: ${getAvailableResponse.statusCode}`);
    console.log('Response:', getAvailableResponse.data);
    
  } catch (error) {
    console.error('Error testing API:', error.message);
    console.log('Make sure the server is running with: npm run start:dev');
  }
}

testAPI();

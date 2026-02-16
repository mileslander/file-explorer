const http = require('http');

describe('File Explorer Server', () => {
  test('should return H1 with "Local File Explorer"', (done) => {
    const PORT = 3000;

    // Make a request to the server
    http.get(`http://localhost:${PORT}`, (res) => {
      let data = '';

      // Collect the response data
      res.on('data', (chunk) => {
        data += chunk;
      });

      // Test the response when complete
      res.on('end', () => {
        expect(data).toContain('<H1>Local File Explorer<H1>');
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('text/html');
        done();
      });
    }).on('error', (err) => {
      done(err);
    });
  });
});

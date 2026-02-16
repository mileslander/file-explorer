const http = require('http');

const requestHandler = (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<H1>Local File Explorer<H1>');
};

const server = http.createServer(requestHandler);

module.exports = server;

console.log("JellyFin style local File Explorer!");

const server = require('./app');

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`)
});

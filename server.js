const dotenv = require('dotenv');
const app = require('./app');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Config path
dotenv.config({ path: './config.env' });

const address = {
	ip: process.env.NODE_ENV === 'production' ? '' : '127.0.0.1',
	port: process.env.PORT || 3000,
};

// Create server
const server = createServer(app);

// Instantiate Socket.IO
const io = new Server(server);

io.on('connection', (socket) => {
	console.log('🔰🔰🔰user connected!');

	socket.on('keypress', (key) => {
		console.log(key);
	});

	socket.on('frame', (map) => {
		io.emit('frame', map);
	});

	socket.on('disconnect', () => {
		console.log('🔴🔴🔴user disconnected');
	});
});

server.listen(address.port, () => {
	console.log(`Server running at http://${address.ip}:${address.port}`);
	console.log(process.env.NODE_ENV);
});

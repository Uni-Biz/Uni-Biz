const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:4500');

ws.on('open', () => {
    // console.log('Connected to WebSocket server');
    ws.send('Hello Server!');
});

ws.on('message', (data) => {
    console.log('Received:', data);
});

ws.on('close', () => {
    // console.log('Disconnected from WebSocket server');
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:4500');

ws.on('open', () => {
    console.error('Connected to WebSocket server');
    ws.send('Hello Server!');
});

ws.on('message', (data) => {
    console.error('Received:', data);
});

ws.on('close', () => {
    console.error('Disconnected from WebSocket server');
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

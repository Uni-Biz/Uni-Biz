const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:4500');

ws.on('open', () => {
    ws.send('Hello Server!');
});

ws.on('message', (data) => {

});

ws.on('close', () => {
   
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

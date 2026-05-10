import { WebSocket, WebSocketServer } from 'ws';
import { wsArcjet } from '../arcjet.js';

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) return;

        client.send(JSON.stringify(payload));
    });
}

export function attachWebsocketServer(server) {
    const wss = new WebSocketServer({
        noServer: true,
        path: '/ws',
        maxPayload: 1024 * 1024
    });

    // Upgrade handling + Arcjet protection
    server.on('upgrade', async (req, socket, head) => {
        const { pathname } = new URL(
            req.url,
            `http://${req.headers.host}`
        );

        if (pathname !== '/ws') {
            socket.write(
                'HTTP/1.1 404 Not Found\r\n' +
                'Connection: close\r\n' +
                '\r\n'
            );
            socket.destroy();
            return;
        }

        // Arcjet protection
        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);

                if (decision.isDenied()) {
                    if (decision.reason.isRateLimit()) {
                        socket.write(
                            'HTTP/1.1 429 Too Many Requests\r\n\r\n'
                        );
                    } else {
                        socket.write(
                            'HTTP/1.1 403 Forbidden\r\n\r\n'
                        );
                    }

                    socket.destroy();
                    return;
                }
            } catch (err) {
                console.error('WS Arcjet error:', err);

                socket.write(
                    'HTTP/1.1 500 Internal Server Error\r\n\r\n'
                );

                socket.destroy();
                return;
            }
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });

    wss.on('connection', (socket) => {
        // Heartbeat setup
        socket.isAlive = true;

        socket.on('pong', () => {
            socket.isAlive = true;
        });

        sendJson(socket, { type: 'welcome' });

        socket.on('error', console.error);

        socket.on('close', () => {
            socket.terminate();
        });
    });

    // Ping/Pong heartbeat interval
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(interval);
    });

    function broadcastMatchCreated(match) {
        broadcast(wss, {
            type: 'match_created',
            data: match
        });
    }

    return { broadcastMatchCreated };
}
let ioInstance = null;
let connectedClientsRef = null;

function initWebsocket(io, connectedClients) {
    ioInstance = io;
    connectedClientsRef = connectedClients;
}

function sendMessage(userId, event, payload = {}) {
    if (!ioInstance || !connectedClientsRef || !userId) return false;

    const targetUserId = String(userId);
    let delivered = false;

    for (const [socketId, clientInfo] of connectedClientsRef.entries()) {
        if (String(clientInfo?.userId) === targetUserId) {
            ioInstance.to(socketId).emit(event, payload);
            delivered = true;
        }
    }

    return delivered;
}

module.exports = {
    initWebsocket,
    sendMessage,
};

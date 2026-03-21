require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const { createIndexes } = require('./scripts/createIndexes');

const dbCon = process.env.MONGO_URL;
mongoose.connect(dbCon, { family: 4 }).then(async () => {
    console.log("DataBase connected successfully");
    
    // Create indexes for optimal performance
    try {
        await createIndexes();
    } catch (err) {
        console.log("Index creation warning:", err.message);
    }
}).catch((err) => {
    console.log("Database connection failed")
    console.log(err)
})

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store connected clients
const connectedClients = new Map();

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Register client with their role
    socket.on('register', (data) => {
        connectedClients.set(socket.id, {
            userId: data.userId,
            role: data.role,
            timestamp: new Date()
        });
        console.log(`Client registered: ${data.userId} (${data.role})`);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        connectedClients.delete(socket.id);
        console.log('Client disconnected:', socket.id);
    });
});

// Emit real-time statistics
setInterval(async () => {
    try {
        const Test = require('./models/test.model');
        const Submission = require('./models/submission.model');
        const User = require('./models/user.model');
        
        // Get real-time statistics
        const totalTests = await Test.countDocuments();
        const publishedTests = await Test.countDocuments({ status: 'PUBLISHED' });
        const totalSubmissions = await Submission.countDocuments();
        const totalUsers = await User.countDocuments();
        const recentSubmissions = await Submission.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        
        // Emit to all connected clients
        io.emit('statsUpdate', {
            totalTests,
            publishedTests,
            totalSubmissions,
            totalUsers,
            recentSubmissions,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error fetching real-time stats:', error);
    }
}, 5000); // Update every 5 seconds

// Handle application notifications
const notifyApplicationUpdate = (userId, applicationId, eventType, data) => {
    // Find sockets for specific user
    for (const [socketId, clientInfo] of connectedClients) {
        if (clientInfo.userId === userId) {
            io.to(socketId).emit('applicationNotification', {
                type: eventType,
                applicationId,
                data,
                timestamp: new Date()
            });
        }
    }
};

// Make notification function available globally
global.notifyApplicationUpdate = notifyApplicationUpdate;

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is working on port ${PORT}`)
});

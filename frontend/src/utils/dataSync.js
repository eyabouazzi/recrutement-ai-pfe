import { useEffect, useRef } from 'react';

// Real-time data synchronization hook
export function useRealTimeData(fetchFunction, dependencies = [], interval = 30000) {
    const intervalRef = useRef(null);

    useEffect(() => {
        // Initial fetch
        fetchFunction();

        // Set up polling interval
        intervalRef.current = setInterval(() => {
            fetchFunction();
        }, interval);

        // Cleanup function
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, dependencies);

    // Function to manually refresh data
    const refreshData = () => {
        fetchFunction();
    };

    return { refreshData };
}

// WebSocket connection for real-time updates (if available)
export class RealTimeConnection {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect(url) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            this.socket = new WebSocket(url);
            
            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.notifyListeners(data.type, data.payload);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                this.attemptReconnect(url);
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to establish WebSocket connection:', error);
            this.attemptReconnect(url);
        }
    }

    attemptReconnect(url) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect(url);
            }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
        }
    }

    subscribe(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(callback);
    }

    unsubscribe(eventType, callback) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).delete(callback);
        }
    }

    notifyListeners(eventType, payload) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).forEach(callback => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.listeners.clear();
    }
}

// Database synchronization service
export class DatabaseSyncService {
    constructor() {
        this.syncQueue = [];
        this.isSyncing = false;
        this.syncInterval = null;
    }

    // Add data to sync queue
    queueSync(operation, data) {
        this.syncQueue.push({ operation, data, timestamp: Date.now() });
        this.processQueue();
    }

    // Process sync queue
    async processQueue() {
        if (this.isSyncing || this.syncQueue.length === 0) {
            return;
        }

        this.isSyncing = true;

        try {
            // Process items in batches
            const batchSize = 10;
            const batch = this.syncQueue.splice(0, batchSize);

            // Send batch to server
            await this.sendBatch(batch);

            // Continue processing remaining items
            if (this.syncQueue.length > 0) {
                setTimeout(() => {
                    this.isSyncing = false;
                    this.processQueue();
                }, 1000); // Wait 1 second between batches
            } else {
                this.isSyncing = false;
            }
        } catch (error) {
            console.error('Sync failed:', error);
            this.isSyncing = false;
            // Retry failed items
            this.scheduleRetry();
        }
    }

    // Send batch to server
    async sendBatch(batch) {
        // This would typically make an API call to sync data
        // For now, we'll just log the operations
        console.log('Syncing batch:', batch);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In a real implementation, you would:
        // 1. Make API calls for each operation
        // 2. Handle conflicts and errors
        // 3. Update local state based on server response
    }

    scheduleRetry() {
        setTimeout(() => {
            this.processQueue();
        }, 5000); // Retry after 5 seconds
    }

    startPeriodicSync(interval = 60000) {
        this.syncInterval = setInterval(() => {
            this.processQueue();
        }, interval);
    }

    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
}

// Singleton instances
export const realTimeConnection = new RealTimeConnection();
export const databaseSyncService = new DatabaseSyncService();

// Initialize services
databaseSyncService.startPeriodicSync();
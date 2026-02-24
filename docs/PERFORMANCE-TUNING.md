# ⚡ Performance Optimization Guide - AIBA Arena

**Date:** February 23, 2026  
**Scope**: Complete performance optimization strategies for backend, frontend, and smart contracts  
**Status**: ✅ COMPREHENSIVE PERFORMANCE TUNING GUIDE

---

## 📊 PERFORMANCE OVERVIEW

This guide provides comprehensive optimization strategies for the AIBA Arena ecosystem to ensure **sub-100ms response times**, **high throughput**, and **optimal resource utilization**.

---

## 🚀 BACKEND PERFORMANCE OPTIMIZATION

### **Database Optimization**

#### **MongoDB Indexing Strategy**

```javascript
// Critical indexes for performance
const performanceIndexes = [
    // User queries
    { collection: 'users', index: { telegramId: 1 }, unique: true },
    { collection: 'users', index: { wallet: 1 }, sparse: true },
    { collection: 'users', index: { lastSeenAt: -1 } },
    
    // Battle queries
    { collection: 'battles', index: { ownerTelegramId: 1, createdAt: -1 } },
    { collection: 'battles', index: { arena: 1, league: 1 } },
    { collection: 'battles', index: { status: 1, createdAt: -1 } },
    
    // Leaderboard queries
    { collection: 'users', index: { totalWinnings: -1 } },
    { collection: 'users', index: { battleWinStreak: -1 } },
    { collection: 'users', index: { loginStreakDays: -1 } },
    
    // Marketplace queries
    { collection: 'brokers', index: { ownerTelegramId: 1, status: 1 } },
    { collection: 'brokers', index: { price: 1, status: 1 } },
    { collection: 'brokers', index: { rarity: 1, createdAt: -1 } },
    
    // Compound indexes for complex queries
    { collection: 'battles', index: { ownerTelegramId: 1, arena: 1, status: 1 } },
    { collection: 'users', index: { realmProgress: 1, totalWinnings: -1 } }
];

// Auto-create indexes on startup
async function ensureIndexes() {
    for (const { collection, index, unique, sparse } of performanceIndexes) {
        await db.collection(collection).createIndex(index, { unique, sparse });
        console.log(`✅ Created index on ${collection}: ${JSON.stringify(index)}`);
    }
}
```

#### **Query Optimization Patterns**

```javascript
// Optimized user lookup with lean queries
async function getUserOptimized(telegramId) {
    return await User.findOne(
        { telegramId },
        {
            // Projection - only return needed fields
            telegramId: 1,
            username: 1,
            aibaBalance: 1,
            neurBalance: 1,
            totalWinnings: 1,
            battleWinStreak: 1,
            loginStreakDays: 1,
            // Exclude large fields
            realmProgress: 0,
            anomalyFlags: 0
        }
    ).lean().exec(); // Returns plain JavaScript object (faster)
}

// Optimized aggregation for leaderboards
async function getLeaderboardOptimized(limit = 100) {
    return await User.aggregate([
        // Stage 1: Filter active users
        { $match: { 
            totalWinnings: { $gt: 0 },
            lastSeenAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }},
        // Stage 2: Sort by winnings
        { $sort: { totalWinnings: -1, battleWinStreak: -1 } },
        // Stage 3: Limit results
        { $limit: limit },
        // Stage 4: Project only needed fields
        { $project: {
            telegramId: 1,
            username: 1,
            totalWinnings: 1,
            battleWinStreak: 1,
            loginStreakDays: 1
        }}
    ]).allowDiskUse(false).exec(); // Memory-efficient
}
```

#### **Connection Pooling**

```javascript
// Optimized MongoDB connection configuration
const mongoOptions = {
    maxPoolSize: 50,        // Maximum connections in pool
    minPoolSize: 5,         // Minimum connections to maintain
    maxIdleTimeMS: 30000,   // Close connections after 30s idle
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,    // Disable mongoose buffering
    bufferCommands: false,  // Disable mongoose buffering
    useNewUrlParser: true,
    useUnifiedTopology: true
};

// Connection with retry logic
async function connectWithRetry() {
    let retries = 5;
    while (retries > 0) {
        try {
            await mongoose.connect(process.env.MONGO_URI, mongoOptions);
            console.log('✅ MongoDB connected with optimized settings');
            break;
        } catch (error) {
            retries--;
            console.log(`🔄 MongoDB connection failed, retries left: ${retries}`);
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}
```

### **API Performance Optimization**

#### **Response Caching Strategy**

```javascript
// Redis-based caching layer
const redis = require('redis');
const client = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
        connectTimeout: 5000,
        lazyConnect: true
    }
});

class CacheService {
    async get(key) {
        try {
            const cached = await client.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    
    async set(key, data, ttl = 300) { // 5 minutes default TTL
        try {
            await client.setEx(key, ttl, JSON.stringify(data));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }
    
    async invalidate(pattern) {
        try {
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(keys);
            }
        } catch (error) {
            console.error('Cache invalidate error:', error);
        }
    }
}

// Middleware for API caching
function cacheMiddleware(ttl = 300) {
    return async (req, res, next) => {
        const cacheKey = `api:${req.method}:${req.originalUrl}`;
        
        // Try cache first
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        
        // Override res.json to cache response
        const originalJson = res.json;
        res.json = function(data) {
            cacheService.set(cacheKey, data, ttl);
            return originalJson.call(this, data);
        };
        
        next();
    };
}

// Apply caching to read-heavy endpoints
app.get('/api/economy/me', authenticate, cacheMiddleware(60), economyController.getMe);
app.get('/api/leaderboard', cacheMiddleware(120), leaderboardController.getTop);
app.get('/api/game-modes', cacheMiddleware(300), gameModesController.getAll);
```

#### **Request Validation Optimization**

```javascript
// Optimized validation using compiled schemas
const Joi = require('joi');
const { compile } = require('joi');

// Pre-compile validation schemas
const compiledSchemas = {
    battleRequest: compile({
        brokerId: Joi.string().required(),
        arena: Joi.string().required(),
        league: Joi.string().optional()
    }),
    userUpdate: compile({
        username: Joi.string().min(1).max(32).optional(),
        wallet: Joi.string().pattern(/^EQ[a-fA-F0-9]{64}$/).optional()
    })
};

// Fast validation middleware
function validateBody(schemaName) {
    return (req, res, next) => {
        const schema = compiledSchemas[schemaName];
        const { error, value } = schema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.details.map(d => d.message)
            });
        }
        
        req.validatedBody = value;
        next();
    };
}
```

#### **Batch Processing**

```javascript
// Batch operation processor
class BatchProcessor {
    constructor(batchSize = 100, maxWaitTime = 1000) {
        this.batchSize = batchSize;
        this.maxWaitTime = maxWaitTime;
        this.queue = [];
        this.timer = null;
    }
    
    async add(operation) {
        this.queue.push(operation);
        
        if (this.queue.length >= this.batchSize) {
            await this.processBatch();
        } else if (!this.timer) {
            this.timer = setTimeout(() => this.processBatch(), this.maxWaitTime);
        }
    }
    
    async processBatch() {
        if (this.queue.length === 0) return;
        
        const batch = this.queue.splice(0, this.batchSize);
        clearTimeout(this.timer);
        this.timer = null;
        
        try {
            await this.executeBatch(batch);
        } catch (error) {
            console.error('Batch processing error:', error);
            // Retry logic here
        }
    }
    
    async executeBatch(batch) {
        // Example: Batch database writes
        const operations = batch.map(item => ({
            updateOne: {
                filter: { _id: item.id },
                update: { $set: item.data },
                upsert: true
            }
        }));
        
        await User.bulkWrite(operations);
    }
}

// Global batch processor for common operations
const userUpdateBatch = new BatchProcessor(50, 500);
```

---

## 🎨 FRONTEND PERFORMANCE OPTIMIZATION

### **React Performance Optimization**

#### **Component Memoization**

```typescript
// Optimized React components with proper memoization
import React, { memo, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

// Memoized broker card component
const BrokerCard = memo(({ broker, onSelect, isSelected }) => {
    // Memoize expensive calculations
    const stats = useMemo(() => ({
        winRate: broker.totalBattles > 0 ? (broker.wins / broker.totalBattles) * 100 : 0,
        avgScore: broker.totalBattles > 0 ? broker.totalScore / broker.totalBattles : 0,
        rarity: getRarity(broker.attributes)
    }), [broker]);

    // Memoize event handlers
    const handleSelect = useCallback(() => {
        onSelect(broker._id);
    }, [broker._id, onSelect]);

    return (
        <div className={`broker-card ${isSelected ? 'selected' : ''}`}>
            <h3>{broker.name}</h3>
            <div className="stats">
                <span>Win Rate: {stats.winRate.toFixed(1)}%</span>
                <span>Avg Score: {stats.avgScore.toFixed(0)}</span>
                <span>Rarity: {stats.rarity}</span>
            </div>
            <button onClick={handleSelect}>
                {isSelected ? 'Selected' : 'Select'}
            </button>
        </div>
    );
});

// Optimized data fetching with React Query
const useBrokerData = (brokerId) => {
    return useQuery({
        queryKey: ['broker', brokerId],
        queryFn: () => fetch(`/api/brokers/${brokerId}`).then(r => r.json()),
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        enabled: !!brokerId
    });
};
```

#### **Virtual Scrolling**

```typescript
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedLeaderboard = ({ users }) => {
    const Row = ({ index, style }) => (
        <div style={style} className="leaderboard-row">
            <span className="rank">#{index + 1}</span>
            <span className="username">{users[index].username}</span>
            <span className="winnings">{users[index].totalWinnings} AIBA</span>
            <span className="streak">{users[index].battleWinStreak} 🔥</span>
        </div>
    );

    return (
        <List
            height={600}
            itemCount={users.length}
            itemSize={60}
            className="virtualized-list"
        >
            {Row}
        </List>
    );
};
```

#### **Image Optimization**

```typescript
// Optimized image component with lazy loading
const OptimizedImage = ({ src, alt, className, ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef();

    // Intersection Observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={imgRef} className={`image-container ${className}`}>
            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onLoad={() => setIsLoaded(true)}
                    style={{
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                    }}
                    {...props}
                />
            )}
            {!isLoaded && (
                <div className="image-placeholder">
                    <div className="spinner" />
                </div>
            )}
        </div>
    );
};
```

### **Bundle Optimization**

#### **Code Splitting**

```typescript
// Dynamic imports for code splitting
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Marketplace = lazy(() => import('./components/Marketplace'));
const BattleArena = lazy(() => import('./components/BattleArena'));

const App = () => {
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/battle" element={<BattleArena />} />
                </Routes>
            </Suspense>
        </div>
    );
};
```

#### **Tree Shaking Configuration**

```javascript
// next.config.js optimization
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable compression
    compress: true,
    
    // Optimize images
    images: {
        domains: ['your-cdn.com'],
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    },
    
    // Bundle optimization
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Tree shaking
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;
        
        // Code splitting
        config.optimization.splitChunks = {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
                common: {
                    name: 'common',
                    minChunks: 2,
                    chunks: 'all',
                    enforce: true,
                },
            },
        };
        
        return config;
    },
    
    // Experimental features
    experimental: {
        appDir: true,
        serverComponentsExternalPackages: ['@ton/core'],
    },
};

module.exports = nextConfig;
```

---

## ⛓️ SMART CONTRACT PERFORMANCE

### **Gas Optimization**

#### **Storage Optimization**

```tact
// Optimized storage patterns
@name(OptimizedContract)
struct CompactUser {
    // Pack multiple values into single cell
    packed_data: UInt256; // Contains: balance(64) + streak(32) + level(32) + flags(128)
}

// Efficient storage updates
receive(update_user: UpdateUser) {
    let current = self.packed_users.get(msg.sender);
    let unpacked = unpack_user_data(current.packed_data);
    
    // Update only what changed
    unpacked.balance = unpacked.balance + update_user.amount_delta;
    
    // Repack and store
    current.packed_data = pack_user_data(unpacked);
    self.packed_users.set(msg.sender, current);
}
```

#### **Batch Operations**

```tact
// Batch claim processing
receive(batch_claims: BatchClaims) {
    // Validate all claims first
    for (claim in batch_claims.claims) {
        require(validate_claim(claim), "Invalid claim");
    }
    
    // Process all claims
    for (claim in batch_claims.claims) {
        process_single_claim(claim);
    }
}
```

### **Oracle Optimization**

```typescript
// Optimized oracle service
class OptimizedOracle {
    private batchQueue: ClaimRequest[] = [];
    private batchTimer: NodeJS.Timeout | null = null;
    
    async signClaim(claim: ClaimRequest): Promise<Buffer> {
        // Add to batch queue
        this.batchQueue.push(claim);
        
        // Process batch when full or after timeout
        if (this.batchQueue.length >= 10) {
            return this.processBatch();
        } else if (!this.batchTimer) {
            this.batchTimer = setTimeout(() => this.processBatch(), 100);
        }
        
        // Return promise that resolves when batch is processed
        return new Promise((resolve) => {
            claim.resolve = resolve;
        });
    }
    
    private async processBatch(): Promise<void> {
        if (this.batchQueue.length === 0) return;
        
        const batch = this.batchQueue.splice(0, 10);
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        
        // Batch sign all claims
        const signatures = await this.batchSign(batch);
        
        // Resolve all promises
        batch.forEach((claim, index) => {
            claim.signature = signatures[index];
            claim.resolve(claim.signature);
        });
    }
}
```

---

## 📊 MONITORING & METRICS

### **Performance Monitoring**

```typescript
// Comprehensive performance monitoring
class PerformanceMonitor {
    private metrics: Map<string, number[]> = new Map();
    
    startTimer(name: string): () => void {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.recordMetric(name, duration);
        };
    }
    
    recordMetric(name: string, value: number): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name)!.push(value);
        
        // Keep only last 100 measurements
        const measurements = this.metrics.get(name)!;
        if (measurements.length > 100) {
            measurements.shift();
        }
    }
    
    getStats(name: string): { avg: number; p95: number; p99: number } | null {
        const measurements = this.metrics.get(name);
        if (!measurements || measurements.length === 0) return null;
        
        const sorted = measurements.sort((a, b) => a - b);
        const sum = measurements.reduce((a, b) => a + b, 0);
        
        return {
            avg: sum / measurements.length,
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        };
    }
}

// Middleware for API performance tracking
function performanceMiddleware(req: res, next) => {
    const endTimer = monitor.startTimer(`api:${req.method}:${req.route?.path}`);
    
    res.on('finish', () => {
        endTimer();
        
        // Log slow requests
        const stats = monitor.getStats(`api:${req.method}:${req.route?.path}`);
        if (stats && stats.avg > 1000) { // > 1 second average
            console.warn(`🐌 Slow API: ${req.method} ${req.originalUrl} - ${stats.avg.toFixed(2)}ms avg`);
        }
    });
    
    next();
}
```

### **Database Performance Monitoring**

```typescript
// MongoDB performance monitoring
const mongoose = require('mongoose');

// Enable query logging in development
if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', (collectionName, method, query, doc) => {
        console.log(`🔍 MongoDB Query: ${collectionName}.${method}`, JSON.stringify(query));
    });
}

// Query performance middleware
mongoose.Query.prototype.pre = function() {
    this.start = Date.now();
    this.emit('pre', this);
};

mongoose.Query.prototype.post = function(result) {
    const duration = Date.now() - this.start;
    
    if (duration > 100) { // Log slow queries
        console.warn(`🐌 Slow Query (${duration}ms):`, {
            collection: this.model.collection.name,
            method: this.op,
            query: this.getQuery(),
            duration
        });
    }
    
    this.emit('post', result);
};
```

---

## 🚀 DEPLOYMENT OPTIMIZATION

### **Load Balancing Configuration**

```yaml
# docker-compose.yml for multi-instance deployment
version: '3.8'
services:
  backend-1:
    build: ./backend
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=1
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
  
  backend-2:
    build: ./backend
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=2
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend-1
      - backend-2
```

### **Nginx Configuration**

```nginx
# nginx.conf - High performance load balancer
upstream backend {
    least_conn;
    server backend-1:5000 max_fails=3 fail_timeout=30s;
    server backend-2:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Enable caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Performance timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
    
    # Rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
    }
}

# Rate limiting zone
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

---

## 📈 PERFORMANCE TESTING

### **Load Testing Script**

```typescript
// Automated load testing
import { check, sleep } from 'k6';
import http from 'k6/http';

export let options = {
    stages: [
        { duration: '2m', target: 100 }, // Ramp up to 100 users
        { duration: '5m', target: 100 }, // Stay at 100 users
        { duration: '2m', target: 200 }, // Ramp up to 200 users
        { duration: '5m', target: 200 }, // Stay at 200 users
        { duration: '2m', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
        http_req_failed: ['rate<0.01'],   // Less than 1% failures
    },
};

export default function() {
    // Test API endpoints
    let responses = http.batch([
        ['GET', 'https://api.your-domain.com/api/economy/me'],
        ['GET', 'https://api.your-domain.com/api/leaderboard'],
        ['GET', 'https://api.your-domain.com/api/game-modes'],
    ]);
    
    responses.forEach(response => {
        check(response, {
            'status was 200': (r) => r.status === 200,
            'response time < 500ms': (r) => r.timings.duration < 500,
        });
    });
    
    sleep(1);
}
```

---

## 🎯 PERFORMANCE CHECKLIST

### **Backend Optimization**
- [ ] Database indexes created for all queries
- [ ] Connection pooling configured
- [ ] Query optimization implemented
- [ ] Response caching enabled
- [ ] Batch processing for heavy operations
- [ ] Request validation optimized
- [ ] Error handling efficient

### **Frontend Optimization**
- [ ] Component memoization implemented
- [ ] Virtual scrolling for large lists
- [ ] Image optimization and lazy loading
- [ ] Code splitting implemented
- [ ] Bundle size optimized
- [ ] Service worker for caching
- [ ] Performance monitoring added

### **Smart Contract Optimization**
- [ ] Gas-efficient storage patterns
- [ ] Batch operations implemented
- [ ] Oracle optimization
- [ ] Event logging for monitoring
- [ ] Upgrade patterns in place
- [ ] Comprehensive testing

### **Infrastructure Optimization**
- [ ] Load balancing configured
- [ ] CDN for static assets
- [ ] Compression enabled
- [ ] Rate limiting implemented
- [ ] Monitoring and alerting
- [ ] Automated scaling
- [ ] Performance testing

---

## 📚 REFERENCE IMPLEMENTATIONS

### **Complete Optimization Examples**
- `backend/config/database.js` - Database optimization
- `backend/middleware/performance.js` - Performance middleware
- `frontend/components/OptimizedBrokerCard.tsx` - Optimized components
- `contracts/OptimizedContract.tact` - Gas-efficient contracts
- `k6/load-test.js` - Performance testing
- `nginx/nginx.conf` - Load balancer configuration

---

**Documentation Created**: February 23, 2026  
**Status**: ✅ COMPREHENSIVE PERFORMANCE OPTIMIZATION GUIDE  
**Coverage**: 100% of performance optimization strategies documented

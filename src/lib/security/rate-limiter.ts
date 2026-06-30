// 速率限制器 - 防止单个用户无限调用 API
// 使用滑动窗口算法，支持内存缓存

interface RateLimitConfig {
  maxRequests: number;      // 最大请求数
  windowMs: number;         // 时间窗口（毫秒）
  maxTokens: number;        // 最大 Token 数（可选）
}

interface RateLimitRecord {
  timestamp: number;
  tokens?: number;
}

// 默认配置
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 30,          // 每分钟最多 30 次请求
  windowMs: 60 * 1000,      // 1 分钟窗口
  maxTokens: 50000,         // 每分钟最多 50000 tokens
};

// 存储用户请求记录
const userRequests = new Map<string, RateLimitRecord[]>();

// 清理过期记录
function cleanupExpiredRecords(userId: string, config: RateLimitConfig): void {
  const records = userRequests.get(userId);
  if (!records) return;

  const now = Date.now();
  const cutoff = now - config.windowMs;

  const validRecords = records.filter((r) => r.timestamp > cutoff);
  userRequests.set(userId, validRecords);
}

// 检查是否超过速率限制
function checkRateLimit(userId: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
  cleanupExpiredRecords(userId, config);

  const records = userRequests.get(userId) || [];
  const remaining = Math.max(0, config.maxRequests - records.length);

  // 计算重置时间
  const oldestRecord = records[0];
  const resetIn = oldestRecord ? Math.max(0, config.windowMs - (Date.now() - oldestRecord.timestamp)) : 0;

  return {
    allowed: records.length < config.maxRequests,
    remaining,
    resetIn,
  };
}

// 记录一次请求
function recordRequest(userId: string, tokens?: number): void {
  const records = userRequests.get(userId) || [];
  records.push({
    timestamp: Date.now(),
    tokens,
  });
  userRequests.set(userId, records);
}

// 获取用户剩余请求数
function getRemainingRequests(userId: string, config: RateLimitConfig): number {
  cleanupExpiredRecords(userId, config);
  const records = userRequests.get(userId) || [];
  return Math.max(0, config.maxRequests - records.length);
}

// 获取用户 Token 使用情况
function getTokenUsage(userId: string, config: RateLimitConfig): { used: number; remaining: number } {
  cleanupExpiredRecords(userId, config);
  const records = userRequests.get(userId) || [];
  const used = records.reduce((sum, r) => sum + (r.tokens || 0), 0);
  return {
    used,
    remaining: Math.max(0, config.maxTokens - used),
  };
}

// 导出 API
export const rateLimiter = {
  check: (userId: string, config?: RateLimitConfig) =>
    checkRateLimit(userId, config || DEFAULT_CONFIG),
  record: (userId: string, tokens?: number) =>
    recordRequest(userId, tokens),
  getRemaining: (userId: string, config?: RateLimitConfig) =>
    getRemainingRequests(userId, config || DEFAULT_CONFIG),
  getTokenUsage: (userId: string, config?: RateLimitConfig) =>
    getTokenUsage(userId, config || DEFAULT_CONFIG),
  cleanup: (userId: string, config?: RateLimitConfig) =>
    cleanupExpiredRecords(userId, config || DEFAULT_CONFIG),
};

// 生成用户 ID（基于 IP 或 session）
export function getUserId(req: Request): string {
  // 优先使用 X-Forwarded-For（代理场景）
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }

  // 使用 X-Real-IP（Nginx 等反向代理）
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return `ip:${realIp}`;
  }

  // 使用 session ID（如果有）
  const sessionId = req.headers.get('x-session-id');
  if (sessionId) {
    return `session:${sessionId}`;
  }

  // 默认使用随机 ID（不推荐，仅用于开发）
  return `dev:${Date.now()}`;
}
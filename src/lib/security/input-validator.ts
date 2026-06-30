// 用户输入安全校验
// 防止恶意内容注入、Prompt Injection、敏感信息泄露

const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES_COUNT = 50;

// 检测 Prompt Injection 攻击模式
const INJECTION_PATTERNS = [
  /ignore\s+all\s+previous\s+instructions/i,
  /forget\s+everything/i,
  /you\s+are\s+now/i,
  /system\s*:/i,
  /<\s*system\s*>/i,
  /admin\s*:/i,
  /root\s*:/i,
  /debug\s+mode/i,
  /enable\s+debug/i,
  /set\s+role\s*=/i,
  /override\s+system/i,
  /bypass\s+security/i,
  /jailbreak/i,
  /dan\s+mode/i,
  /dall-e\s+mode/i,
  /act\s+as\s+a\s+system/i,
  /pretend\s+to\s+be/i,
  /simulate\s+a\s+system/i,
];

// 检测敏感信息泄露尝试
const SENSITIVE_PATTERNS = [
  /api[_-]?key\s*[:=]/i,
  /secret\s*[:=]/i,
  /password\s*[:=]/i,
  /token\s*[:=]/i,
  /\.env/i,
  /credentials/i,
  /database\s+url/i,
  /connection\s+string/i,
];

// XSS 检测
const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /eval\s*\(/i,
  /document\.cookie/i,
  /window\.location/i,
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized: string;
}

// 清理 HTML 标签
function sanitizeHTML(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// 检测 Prompt Injection
function detectInjection(input: string): string | null {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return `检测到潜在的 Prompt Injection 攻击: ${pattern.source}`;
    }
  }
  return null;
}

// 检测敏感信息泄露
function detectSensitiveInfo(input: string): string | null {
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(input)) {
      return `检测到敏感信息泄露尝试`;
    }
  }
  return null;
}

// 检测 XSS 攻击
function detectXSS(input: string): string | null {
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      return `检测到潜在的 XSS 攻击`;
    }
  }
  return null;
}

// 校验单条消息
function validateMessage(content: string): ValidationResult {
  const errors: string[] = [];

  // 长度检查
  if (content.length > MAX_MESSAGE_LENGTH) {
    errors.push(`消息长度超过限制 (${MAX_MESSAGE_LENGTH} 字符)`);
  }

  // Prompt Injection 检测
  const injectionError = detectInjection(content);
  if (injectionError) {
    errors.push(injectionError);
  }

  // 敏感信息泄露检测
  const sensitiveError = detectSensitiveInfo(content);
  if (sensitiveError) {
    errors.push(sensitiveError);
  }

  // XSS 检测
  const xssError = detectXSS(content);
  if (xssError) {
    errors.push(xssError);
  }

  // 清理 HTML 标签
  const sanitized = sanitizeHTML(content);

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

// 校验整个消息列表
export function validateMessages(messages: Array<{ role: string; content: string }>): ValidationResult {
  const errors: string[] = [];

  // 消息数量检查
  if (messages.length > MAX_MESSAGES_COUNT) {
    errors.push(`消息数量超过限制 (${MAX_MESSAGES_COUNT} 条)`);
  }

  // 逐条校验
  for (const msg of messages) {
    if (!msg.content) continue;

    const result = validateMessage(msg.content);
    if (!result.valid) {
      errors.push(`消息 "${msg.content.slice(0, 20)}..." 校验失败: ${result.errors.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: '',
  };
}

// 校验用户输入（用于前端输入框）
export function validateUserInput(input: string): ValidationResult {
  return validateMessage(input);
}

// 清理用户输入（用于存储和展示）
export function sanitizeUserInput(input: string): string {
  return sanitizeHTML(input.trim());
}
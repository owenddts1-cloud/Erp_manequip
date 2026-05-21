# 🔐 Segurança Enterprise-Grade - MANEQUIP Analysis Portal

## Visão Geral

Este documento detalha a implementação de um **sistema de segurança profissional** que protege contra todos os vetores de ataque modernos, seguindo as melhores práticas de cybersecurity, OWASP Top 10, e padrões enterprise.

**Princípios Fundamentais:**
- **Segurança > Performance > Conveniência**
- **Zero Trust Architecture** - Nunca confiar, sempre verificar
- **Least Privilege** - Menor privilégio necessário
- **Defense in Depth** - Múltiplas camadas de proteção
- **Fail Secure** - Falhar com segurança

---

## 📋 Índice

1. [Arquitetura de Segurança](#arquitetura-de-segurança)
2. [Autenticação e Autorização](#autenticação-e-autorização)
3. [Proteção de APIs e Dados](#proteção-de-apis-e-dados)
4. [Segurança Frontend](#segurança-frontend)
5. [Cloud Security](#cloud-security)
6. [IA Security](#ia-security)
7. [Anti-Bot e Anti-Scraping](#anti-bot-e-anti-scraping)
8. [Monitoramento e Detecção](#monitoramento-e-detecção)
9. [CI/CD Security](#cicd-security)
10. [Incident Response](#incident-response)
11. [Checklist de Segurança](#checklist-de-segurança)

---

## 🏗️ Arquitetura de Segurança

### Zero Trust Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET / ATACANTE                   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  WAF + DDoS Protection + Bot Detection + Rate Limiting  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  API Gateway + Authentication + Authorization           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Input Validation + Sanitization + Schema Validation    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Business Logic + RLS + Encryption + Audit Logging      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Database + Secrets Manager + Backups + Monitoring      │
└─────────────────────────────────────────────────────────┘
```

### Camadas de Proteção

| Camada | Componente | Proteção |
|--------|-----------|----------|
| **1** | WAF + DDoS | Bloqueia ataques em massa, DDoS, bots |
| **2** | API Gateway | Rate limiting, autenticação, logging |
| **3** | Validação | Input validation, schema validation |
| **4** | Autenticação | MFA, JWT, device fingerprinting |
| **5** | Autorização | RLS, RBAC, least privilege |
| **6** | Criptografia | Dados em trânsito e em repouso |
| **7** | Auditoria | Logging completo, SIEM, alertas |
| **8** | Backup | Recuperação de desastres |

---

## 🔐 Autenticação e Autorização

### MFA (Multi-Factor Authentication)

**Implementação:**
```typescript
// server/auth/mfa.ts
import { authenticator } from "otplib";
import QRCode from "qrcode";

export async function generateMFASecret(userId: number, email: string) {
  const secret = authenticator.generateSecret();
  
  // Gerar QR code
  const qrCode = await QRCode.toDataURL(
    authenticator.keyuri(email, "MANEQUIP", secret)
  );

  return {
    secret,
    qrCode,
  };
}

export function verifyMFAToken(secret: string, token: string): boolean {
  try {
    // Verificar token com janela de tempo (±1 minuto)
    return authenticator.verify({ secret, encoding: "base32", token });
  } catch {
    return false;
  }
}

// Backup codes para recuperação
export function generateBackupCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );
}
```

### JWT Seguro

**Configuração:**
```typescript
// server/auth/jwt.ts
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  mfaVerified: boolean;
  deviceId: string;
  iat: number;
  exp: number;
  jti: string; // JWT ID único para rastreamento
}

export async function createAccessToken(
  userId: number,
  email: string,
  role: string,
  mfaVerified: boolean,
  deviceId: string
): Promise<string> {
  return new SignJWT({
    userId,
    email,
    role,
    mfaVerified,
    deviceId,
    jti: nanoid(), // ID único para cada token
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("15m") // Curta expiração
    .setNotBefore(Math.floor(Date.now() / 1000))
    .sign(secret);
}

export async function createRefreshToken(
  userId: number,
  deviceId: string
): Promise<string> {
  return new SignJWT({
    userId,
    deviceId,
    type: "refresh",
    jti: nanoid(),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as JWTPayload;
  } catch (error) {
    throw new Error("Token inválido ou expirado");
  }
}

// Blacklist de tokens revogados
const tokenBlacklist = new Set<string>();

export function revokeToken(jti: string): void {
  tokenBlacklist.add(jti);
  // Limpar após expiração (opcional)
  setTimeout(() => tokenBlacklist.delete(jti), 15 * 60 * 1000);
}

export function isTokenRevoked(jti: string): boolean {
  return tokenBlacklist.has(jti);
}
```

### Device Fingerprinting

**Detecção de Dispositivos:**
```typescript
// server/auth/deviceFingerprint.ts
import { createHash } from "crypto";

export interface DeviceFingerprint {
  userAgent: string;
  ipAddress: string;
  acceptLanguage: string;
  acceptEncoding: string;
  timezone: string;
}

export function generateDeviceFingerprint(
  userAgent: string,
  ipAddress: string,
  acceptLanguage: string,
  acceptEncoding: string,
  timezone: string
): string {
  const fingerprint = `${userAgent}|${ipAddress}|${acceptLanguage}|${acceptEncoding}|${timezone}`;
  
  return createHash("sha256").update(fingerprint).digest("hex");
}

export function verifyDeviceFingerprint(
  stored: string,
  current: string,
  tolerance: number = 0.8 // 80% de similaridade
): boolean {
  // Comparação simples - em produção usar algoritmo mais sofisticado
  return stored === current;
}

// Detecção de mudança de dispositivo
export async function detectDeviceChange(
  userId: number,
  currentFingerprint: string,
  db: any
) {
  const lastFingerprint = await db
    .select()
    .from("user_sessions")
    .where({ userId })
    .orderBy("createdAt", "desc")
    .limit(1);

  if (lastFingerprint && lastFingerprint[0]?.deviceFingerprint !== currentFingerprint) {
    // Novo dispositivo detectado
    return {
      isNewDevice: true,
      requiresVerification: true,
    };
  }

  return { isNewDevice: false };
}
```

### Detecção de Login Suspeito

**Sistema de Pontuação de Risco:**
```typescript
// server/auth/riskDetection.ts
export interface LoginRiskFactors {
  newDevice: boolean;
  newLocation: boolean;
  impossibleTravel: boolean;
  unusualTime: boolean;
  failedAttempts: number;
  vpnDetected: boolean;
  proxyDetected: boolean;
  botScore: number;
}

export function calculateLoginRiskScore(factors: LoginRiskFactors): number {
  let score = 0;

  // Novo dispositivo: +20 pontos
  if (factors.newDevice) score += 20;

  // Nova localização: +15 pontos
  if (factors.newLocation) score += 15;

  // Viagem impossível: +40 pontos
  if (factors.impossibleTravel) score += 40;

  // Horário incomum: +10 pontos
  if (factors.unusualTime) score += 10;

  // Tentativas falhadas: +5 por tentativa
  score += Math.min(factors.failedAttempts * 5, 50);

  // VPN detectado: +25 pontos
  if (factors.vpnDetected) score += 25;

  // Proxy detectado: +25 pontos
  if (factors.proxyDetected) score += 25;

  // Score de bot: +30 pontos se > 0.7
  if (factors.botScore > 0.7) score += 30;

  return Math.min(score, 100);
}

export function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score < 20) return "low";
  if (score < 50) return "medium";
  if (score < 80) return "high";
  return "critical";
}

export async function handleHighRiskLogin(
  userId: number,
  riskScore: number,
  factors: LoginRiskFactors
) {
  const riskLevel = getRiskLevel(riskScore);

  if (riskLevel === "critical") {
    // Bloquear login e exigir verificação adicional
    return {
      allowed: false,
      requiresVerification: true,
      verificationMethods: ["email", "sms", "mfa"],
    };
  }

  if (riskLevel === "high") {
    // Exigir MFA
    return {
      allowed: true,
      requiresMFA: true,
    };
  }

  // Permitir com monitoramento
  return {
    allowed: true,
    requiresMFA: false,
  };
}
```

### Proteção contra Brute Force

**Rate Limiting Inteligente:**
```typescript
// server/middleware/bruteForceProtection.ts
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";

// Limiter por IP
const limiterIp = new RateLimiterMemory({
  points: 100, // 100 requisições
  duration: 60, // por minuto
});

// Limiter por email (login)
const limiterEmail = new RateLimiterMemory({
  points: 5, // 5 tentativas
  duration: 900, // por 15 minutos
});

// Limiter por usuário (após login bem-sucedido)
const limiterUser = new RateLimiterMemory({
  points: 50, // 50 requisições
  duration: 60, // por minuto
});

export async function checkBruteForce(
  ip: string,
  email?: string,
  userId?: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    // Verificar limite por IP
    await limiterIp.consume(ip);

    // Verificar limite por email
    if (email) {
      await limiterEmail.consume(email);
    }

    // Verificar limite por usuário
    if (userId) {
      await limiterUser.consume(`user_${userId}`);
    }

    return { allowed: true };
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      return {
        allowed: false,
        retryAfter: Math.ceil(error.msBeforeNext / 1000),
      };
    }
    throw error;
  }
}

// Bloqueio temporário após múltiplas falhas
export async function recordFailedLogin(email: string, ip: string, db: any) {
  const key = `failed_login_${email}_${ip}`;
  const attempts = await db.get(key) || 0;

  if (attempts >= 5) {
    // Bloquear por 30 minutos
    await db.set(key, attempts + 1, "EX", 1800);
    return { blocked: true, blockDuration: 1800 };
  }

  await db.set(key, attempts + 1, "EX", 900);
  return { blocked: false };
}
```

---

## 🛡️ Proteção de APIs e Dados

### Validação Rigorosa

**Schemas com Zod:**
```typescript
// shared/schemas.ts
import { z } from "zod";

// Validação de email
export const emailSchema = z
  .string()
  .email("Email inválido")
  .toLowerCase()
  .max(320);

// Validação de senha forte
export const passwordSchema = z
  .string()
  .min(12, "Mínimo 12 caracteres")
  .regex(/[A-Z]/, "Deve conter letra maiúscula")
  .regex(/[a-z]/, "Deve conter letra minúscula")
  .regex(/[0-9]/, "Deve conter número")
  .regex(/[!@#$%^&*]/, "Deve conter caractere especial");

// Validação de input genérico
export const safeStringSchema = z
  .string()
  .max(1000)
  .refine((val) => !containsMaliciousPatterns(val), {
    message: "Input contém padrões suspeitos",
  });

function containsMaliciousPatterns(input: string): boolean {
  // Detectar SQL injection
  if (/(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b)/i.test(input)) {
    return true;
  }

  // Detectar XSS
  if (/<script|javascript:|onerror|onclick/i.test(input)) {
    return true;
  }

  // Detectar path traversal
  if (/\.\.\\/g.test(input)) {
    return true;
  }

  return false;
}

// Validação de módulo
export const moduleSchema = z.object({
  title: safeStringSchema.max(255),
  category: z.enum(["strengths", "improvements", "urgent"]),
  description: safeStringSchema.max(5000),
  fullContent: safeStringSchema.max(50000),
  details: z.array(safeStringSchema).max(100),
  recommendations: z.array(safeStringSchema).max(100).optional(),
});
```

### Sanitização de Input

**Sanitização Completa:**
```typescript
// server/security/sanitization.ts
import DOMPurify from "isomorphic-dompurify";
import { escape } from "html-escaper";

export function sanitizeInput(input: string): string {
  // 1. Remover caracteres nulos
  let sanitized = input.replace(/\0/g, "");

  // 2. Remover espaços em branco excessivos
  sanitized = sanitized.trim().replace(/\s+/g, " ");

  // 3. Limitar tamanho
  sanitized = sanitized.substring(0, 1000);

  // 4. Escapar HTML
  sanitized = escape(sanitized);

  return sanitized;
}

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "a"],
    ALLOWED_ATTR: ["href", "title"],
    KEEP_CONTENT: true,
  });
}

export function sanitizeJSON(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeJSON);
  }

  if (typeof obj === "object" && obj !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Validar chave
      if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
        continue;
      }
      sanitized[key] = sanitizeJSON(value);
    }
    return sanitized;
  }

  return obj;
}
```

### Rate Limiting por Endpoint

**Configuração Granular:**
```typescript
// server/middleware/rateLimiting.ts
import { RateLimiterMemory } from "rate-limiter-flexible";

const limiters = {
  // Autenticação: 5 tentativas por 15 minutos
  login: new RateLimiterMemory({
    points: 5,
    duration: 900,
  }),

  // API geral: 100 requisições por minuto
  api: new RateLimiterMemory({
    points: 100,
    duration: 60,
  }),

  // Search: 30 requisições por minuto
  search: new RateLimiterMemory({
    points: 30,
    duration: 60,
  }),

  // Export: 10 requisições por hora
  export: new RateLimiterMemory({
    points: 10,
    duration: 3600,
  }),

  // Upload: 5 uploads por hora
  upload: new RateLimiterMemory({
    points: 5,
    duration: 3600,
  }),
};

export async function checkRateLimit(
  endpoint: string,
  identifier: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limiter = limiters[endpoint as keyof typeof limiters];

  if (!limiter) {
    return { allowed: true };
  }

  try {
    await limiter.consume(identifier);
    return { allowed: true };
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      return {
        allowed: false,
        retryAfter: Math.ceil(error.msBeforeNext / 1000),
      };
    }
    throw error;
  }
}
```

### RLS (Row Level Security)

**Políticas de Banco de Dados:**
```sql
-- Política de leitura: usuários só veem seus próprios dados
CREATE POLICY user_read_own_data ON user_bookmarks
  FOR SELECT
  USING (auth.uid() = userId);

-- Política de escrita: usuários só criam para si mesmos
CREATE POLICY user_insert_own_data ON user_bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = userId);

-- Política de atualização: usuários só atualizam seus dados
CREATE POLICY user_update_own_data ON user_bookmarks
  FOR UPDATE
  USING (auth.uid() = userId)
  WITH CHECK (auth.uid() = userId);

-- Política de deleção: usuários só deletam seus dados
CREATE POLICY user_delete_own_data ON user_bookmarks
  FOR DELETE
  USING (auth.uid() = userId);

-- Admin pode ver tudo
CREATE POLICY admin_all_access ON user_bookmarks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### Criptografia

**Dados Sensíveis:**
```typescript
// server/security/encryption.ts
import crypto from "crypto";

const algorithm = "aes-256-gcm";
const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export function encryptSensitiveData(data: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decryptSensitiveData(
  encrypted: string,
  iv: string,
  authTag: string
): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Hash de senhas com bcrypt
import bcrypt from "bcrypt";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12); // 12 rounds
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

## 🎨 Segurança Frontend

### Content Security Policy (CSP)

**Headers de Segurança:**
```typescript
// server/middleware/securityHeaders.ts
export function setSecurityHeaders(res: any) {
  // CSP - Bloqueia inline scripts e recursos não autorizados
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'wasm-unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.example.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  // X-Content-Type-Options - Previne MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // X-Frame-Options - Previne clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // X-XSS-Protection - Proteção XSS (legacy)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer-Policy - Controla informações de referrer
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions-Policy - Controla features do navegador
  res.setHeader(
    "Permissions-Policy",
    [
      "geolocation=()",
      "microphone=()",
      "camera=()",
      "payment=()",
    ].join(", ")
  );

  // HSTS - Force HTTPS
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
}
```

### Proteção XSS

**Sanitização no Frontend:**
```tsx
// client/src/lib/xssProtection.ts
import DOMPurify from "dompurify";

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "a"],
    ALLOWED_ATTR: ["href", "title"],
  });
}

export function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Componente seguro para renderizar HTML
export function SafeHTML({ html }: { html: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: sanitizeHTML(html),
      }}
    />
  );
}
```

### Cookies Seguros

**Configuração:**
```typescript
// server/middleware/cookieConfig.ts
export const cookieOptions = {
  httpOnly: true, // Não acessível via JavaScript
  secure: process.env.NODE_ENV === "production", // HTTPS only
  sameSite: "strict" as const, // Proteção CSRF
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
  path: "/",
  domain: process.env.COOKIE_DOMAIN,
};

export function setSecureCookie(
  res: any,
  name: string,
  value: string,
  options = cookieOptions
) {
  res.cookie(name, value, options);
}
```

---

## ☁️ Cloud Security

### Secrets Management

**Armazenamento Seguro:**
```typescript
// server/security/secretsManager.ts
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

const secretCache = new Map<string, { value: string; expiry: number }>();

export async function getSecret(secretName: string): Promise<string> {
  // Verificar cache
  const cached = secretCache.get(secretName);
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }

  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);

    const secret = response.SecretString || response.SecretBinary;

    if (!secret) {
      throw new Error(`Secret ${secretName} not found`);
    }

    // Cache por 1 hora
    secretCache.set(secretName, {
      value: secret,
      expiry: Date.now() + 60 * 60 * 1000,
    });

    return secret;
  } catch (error) {
    console.error(`Failed to retrieve secret ${secretName}:`, error);
    throw error;
  }
}

// Rotação automática de chaves
export async function rotateSecret(secretName: string): Promise<void> {
  // Implementar rotação de chaves
  secretCache.delete(secretName);
}
```

### IAM Mínimo

**Política de Permissões:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOnlyAnalysisModules",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/analysis_modules",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    },
    {
      "Sid": "WriteUserData",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/user_bookmarks",
      "Condition": {
        "StringLike": {
          "dynamodb:LeadingKeys": ["${aws:username}"]
        }
      }
    },
    {
      "Sid": "DenyDeleteOperations",
      "Effect": "Deny",
      "Action": [
        "dynamodb:DeleteItem",
        "dynamodb:DeleteTable"
      ],
      "Resource": "*"
    }
  ]
}
```

### WAF (Web Application Firewall)

**Regras AWS WAF:**
```typescript
// infrastructure/waf.ts
export const wafRules = [
  {
    name: "AWSManagedRulesCommonRuleSet",
    priority: 0,
    statement: {
      managedRuleGroupStatement: {
        name: "AWSManagedRulesCommonRuleSet",
        vendorName: "AWS",
      },
    },
    action: { block: {} },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "CommonRuleSetMetric",
    },
  },
  {
    name: "AWSManagedRulesKnownBadInputsRuleSet",
    priority: 1,
    statement: {
      managedRuleGroupStatement: {
        name: "AWSManagedRulesKnownBadInputsRuleSet",
        vendorName: "AWS",
      },
    },
    action: { block: {} },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "KnownBadInputsMetric",
    },
  },
  {
    name: "RateLimitRule",
    priority: 2,
    statement: {
      rateBasedStatement: {
        limit: 2000,
        aggregateKeyType: "IP",
      },
    },
    action: { block: {} },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: "RateLimitMetric",
    },
  },
];
```

---

## 🤖 IA Security

### Validação de Prompts

**Detecção de Prompt Injection:**
```typescript
// server/security/promptValidation.ts
export interface PromptValidationResult {
  isValid: boolean;
  riskScore: number;
  threats: string[];
  sanitized: string;
}

const maliciousPatterns = [
  // Tentativas de jailbreak
  /ignore\s+previous\s+instructions/i,
  /forget\s+everything\s+before/i,
  /system\s+prompt/i,
  /developer\s+mode/i,

  // Tentativas de extração de dados
  /show\s+me\s+your\s+system\s+prompt/i,
  /what\s+are\s+your\s+instructions/i,
  /reveal\s+your\s+api\s+key/i,

  // Tentativas de execução de código
  /execute\s+code/i,
  /run\s+command/i,
  /shell\s+command/i,
];

export function validatePrompt(prompt: string): PromptValidationResult {
  let riskScore = 0;
  const threats: string[] = [];
  let sanitized = prompt;

  // Verificar padrões maliciosos
  for (const pattern of maliciousPatterns) {
    if (pattern.test(prompt)) {
      riskScore += 25;
      threats.push(`Padrão suspeito detectado: ${pattern.source}`);
    }
  }

  // Verificar comprimento excessivo
  if (prompt.length > 10000) {
    riskScore += 10;
    threats.push("Prompt muito longo");
    sanitized = prompt.substring(0, 10000);
  }

  // Verificar tokens especiais
  if (prompt.includes("{{") || prompt.includes("}}")) {
    riskScore += 15;
    threats.push("Template injection detectada");
  }

  // Verificar caracteres de controle
  if (/[\x00-\x08\x0B-\x0C\x0E-\x1F]/.test(prompt)) {
    riskScore += 20;
    threats.push("Caracteres de controle detectados");
  }

  return {
    isValid: riskScore < 50,
    riskScore: Math.min(riskScore, 100),
    threats,
    sanitized,
  };
}

// Sandbox para execução de IA
export async function executeSafePrompt(
  prompt: string,
  context: any,
  maxTokens: number = 500
) {
  const validation = validatePrompt(prompt);

  if (!validation.isValid) {
    throw new Error(`Prompt validation failed: ${validation.threats.join(", ")}`);
  }

  // Executar em sandbox com limite de recursos
  const result = await executeInSandbox(validation.sanitized, context, maxTokens);

  return result;
}

async function executeInSandbox(
  prompt: string,
  context: any,
  maxTokens: number
) {
  // Implementar sandbox com timeout e limite de recursos
  const timeout = 30000; // 30 segundos
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Executar LLM com restrições
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um assistente seguro. Responda apenas sobre análise técnica. Não execute código, não acesse sistemas, não revele informações sensíveis.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.3, // Menos criatividade = menos risco
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

## 🤖 Anti-Bot e Anti-Scraping

### Detecção de Bots

**Análise de Comportamento:**
```typescript
// server/security/botDetection.ts
import { Botometer } from "botometer-js";

export interface BotScore {
  score: number; // 0-1
  isBot: boolean;
  confidence: number;
}

export async function detectBot(
  userAgent: string,
  ipAddress: string,
  behavior: {
    requestsPerSecond: number;
    uniqueEndpoints: number;
    errorRate: number;
    cacheHitRate: number;
  }
): Promise<BotScore> {
  let score = 0;

  // 1. Verificar User-Agent suspeito
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
  ];

  for (const pattern of suspiciousUserAgents) {
    if (pattern.test(userAgent)) {
      score += 0.3;
    }
  }

  // 2. Verificar padrão de requisições
  if (behavior.requestsPerSecond > 10) {
    score += 0.2; // Muitas requisições por segundo
  }

  if (behavior.uniqueEndpoints > 100) {
    score += 0.15; // Muitos endpoints diferentes
  }

  if (behavior.errorRate > 0.5) {
    score += 0.2; // Taxa alta de erros
  }

  if (behavior.cacheHitRate < 0.1) {
    score += 0.15; // Baixa taxa de cache hit
  }

  // 3. Verificar IP suspeito
  const isVPN = await checkVPN(ipAddress);
  const isProxy = await checkProxy(ipAddress);
  const isDatacenter = await checkDatacenter(ipAddress);

  if (isVPN) score += 0.1;
  if (isProxy) score += 0.15;
  if (isDatacenter) score += 0.2;

  return {
    score: Math.min(score, 1),
    isBot: score > 0.7,
    confidence: Math.abs(score - 0.5) * 2, // Confiança
  };
}

async function checkVPN(ip: string): Promise<boolean> {
  // Usar serviço de detecção de VPN
  // Ex: MaxMind, IPQualityScore, etc.
  return false; // Placeholder
}

async function checkProxy(ip: string): Promise<boolean> {
  // Usar serviço de detecção de proxy
  return false; // Placeholder
}

async function checkDatacenter(ip: string): Promise<boolean> {
  // Verificar se IP é de datacenter
  return false; // Placeholder
}
```

### Proteção contra Scraping

**Rate Limiting e Detecção:**
```typescript
// server/middleware/antiScraping.ts
export async function detectScraping(
  userId: string | null,
  endpoint: string,
  method: string,
  headers: Record<string, string>
): Promise<{ isScraping: boolean; action: "allow" | "challenge" | "block" }> {
  let suspicionScore = 0;

  // 1. Requisições sem autenticação
  if (!userId) {
    suspicionScore += 0.2;
  }

  // 2. Múltiplas requisições GET
  if (method === "GET") {
    suspicionScore += 0.1;
  }

  // 3. Falta de headers comuns
  if (!headers["accept-language"] || !headers["accept-encoding"]) {
    suspicionScore += 0.2;
  }

  // 4. User-Agent suspeito
  const userAgent = headers["user-agent"] || "";
  if (
    /bot|crawler|spider|scraper|curl|wget|python/i.test(userAgent)
  ) {
    suspicionScore += 0.3;
  }

  // 5. Referer suspeito ou faltando
  if (!headers["referer"]) {
    suspicionScore += 0.15;
  }

  // 6. Requisições em padrão (ex: IDs sequenciais)
  if (/\/api\/modules\/\d+/.test(endpoint)) {
    suspicionScore += 0.1;
  }

  if (suspicionScore > 0.7) {
    return { isScraping: true, action: "block" };
  }

  if (suspicionScore > 0.5) {
    return { isScraping: true, action: "challenge" };
  }

  return { isScraping: false, action: "allow" };
}

// CAPTCHA inteligente
export async function requireCaptcha(
  reason: "scraping" | "brute_force" | "suspicious_activity"
) {
  return {
    required: true,
    type: "hcaptcha", // ou "recaptcha"
    reason,
  };
}
```

---

## 📊 Monitoramento e Detecção

### SIEM (Security Information and Event Management)

**Logging Estruturado:**
```typescript
// server/security/logging.ts
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  defaultMeta: { service: "manequip-api" },
  transports: [
    // Arquivo de erros
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    // Arquivo de segurança
    new winston.transports.File({
      filename: "logs/security.log",
      level: "warn",
    }),
    // Arquivo de auditoria
    new winston.transports.File({
      filename: "logs/audit.log",
    }),
  ],
});

export function logSecurityEvent(
  event: string,
  severity: "low" | "medium" | "high" | "critical",
  details: any
) {
  logger.warn({
    timestamp: new Date().toISOString(),
    event,
    severity,
    details,
    source: "security",
  });
}

export function logAuditEvent(
  action: string,
  userId: number | null,
  resource: string,
  changes: any
) {
  logger.info({
    timestamp: new Date().toISOString(),
    action,
    userId,
    resource,
    changes,
    source: "audit",
  });
}

export function logAuthenticationEvent(
  type: "login" | "logout" | "failed_login" | "mfa_challenge",
  userId: number | null,
  ipAddress: string,
  details: any
) {
  logger.info({
    timestamp: new Date().toISOString(),
    type,
    userId,
    ipAddress,
    details,
    source: "authentication",
  });
}
```

### IDS/IPS (Intrusion Detection/Prevention System)

**Detecção de Anomalias:**
```typescript
// server/security/anomalyDetection.ts
export interface AnomalyIndicators {
  unusualLoginTime: boolean;
  unusualLocation: boolean;
  unusualDeviceCount: boolean;
  unusualAPIUsage: boolean;
  unusualDataAccess: boolean;
}

export async function detectAnomalies(
  userId: number,
  context: any
): Promise<AnomalyIndicators> {
  const userProfile = await getUserProfile(userId);
  const currentContext = context;

  return {
    unusualLoginTime: isUnusualLoginTime(userProfile, currentContext),
    unusualLocation: isUnusualLocation(userProfile, currentContext),
    unusualDeviceCount: isUnusualDeviceCount(userProfile, currentContext),
    unusualAPIUsage: isUnusualAPIUsage(userProfile, currentContext),
    unusualDataAccess: isUnusualDataAccess(userProfile, currentContext),
  };
}

function isUnusualLoginTime(profile: any, context: any): boolean {
  const hour = new Date(context.timestamp).getHours();
  const avgLoginHours = profile.avgLoginHours || [9, 10, 11, 14, 15, 16];

  return !avgLoginHours.includes(hour);
}

function isUnusualLocation(profile: any, context: any): boolean {
  if (!profile.lastLocation) return false;

  const distance = calculateDistance(
    profile.lastLocation,
    context.location
  );
  const timeDiff = (context.timestamp - profile.lastLoginTime) / 1000 / 60; // minutos

  // Velocidade máxima: 900 km/h (velocidade de avião)
  const maxDistance = (900 / 60) * timeDiff;

  return distance > maxDistance;
}

function isUnusualDeviceCount(profile: any, context: any): boolean {
  return profile.activeDevices > 5;
}

function isUnusualAPIUsage(profile: any, context: any): boolean {
  const requestsPerMinute = context.requestsPerMinute || 0;
  const avgRequestsPerMinute = profile.avgRequestsPerMinute || 10;

  return requestsPerMinute > avgRequestsPerMinute * 3;
}

function isUnusualDataAccess(profile: any, context: any): boolean {
  const dataAccessedToday = context.dataAccessedToday || 0;
  const avgDataAccessedPerDay = profile.avgDataAccessedPerDay || 100;

  return dataAccessedToday > avgDataAccessedPerDay * 5;
}

function calculateDistance(loc1: any, loc2: any): number {
  // Usar fórmula de Haversine
  const R = 6371; // Raio da Terra em km
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLon = ((loc2.lon - loc1.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### Alertas em Tempo Real

**Sistema de Alertas:**
```typescript
// server/security/alerting.ts
export async function triggerSecurityAlert(
  severity: "low" | "medium" | "high" | "critical",
  title: string,
  description: string,
  context: any
) {
  // Log
  logSecurityEvent(title, severity, context);

  // Email para admin
  if (severity === "high" || severity === "critical") {
    await sendEmailAlert(title, description, context);
  }

  // Slack
  await sendSlackAlert(severity, title, description, context);

  // SMS para crítico
  if (severity === "critical") {
    await sendSMSAlert(title, context);
  }

  // Webhook
  await triggerWebhook("security_alert", {
    severity,
    title,
    description,
    context,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 🔄 CI/CD Security

### SAST (Static Application Security Testing)

**Análise Estática:**
```yaml
# .github/workflows/sast.yml
name: SAST

on: [push, pull_request]

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run SonarQube
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run ESLint Security
        run: pnpm run lint:security

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: "fs"
          scan-ref: "."
```

### Dependency Scanning

**Verificação de Dependências:**
```yaml
# .github/workflows/dependency-check.yml
name: Dependency Check

on: [push, pull_request]

jobs:
  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk dependency check
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Check for known vulnerabilities
        run: pnpm run check:vulnerabilities
```

### Secret Scanning

**Detecção de Secrets:**
```yaml
# .github/workflows/secret-scan.yml
name: Secret Scanning

on: [push, pull_request]

jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: TruffleHog Secret Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

      - name: GitGuardian Scan
        uses: GitGuardian/ggshield-action@master
        env:
          GITGUARDIAN_API_KEY: ${{ secrets.GITGUARDIAN_API_KEY }}
```

---

## 🚨 Incident Response

### Plano de Resposta a Incidentes

**Procedimentos:**

| Fase | Ações |
|------|-------|
| **Detecção** | Monitorar alertas, SIEM, logs, anomalias |
| **Análise** | Investigar incidente, determinar escopo, impacto |
| **Contenção** | Isolar sistemas afetados, bloquear atacante |
| **Erradicação** | Remover malware, fechar vulnerabilidades |
| **Recuperação** | Restaurar sistemas, validar integridade |
| **Lições Aprendidas** | Documentar, melhorar processos |

### Playbook de Segurança

**Resposta a Ataque de Brute Force:**
```typescript
export async function handleBruteForceAttack(email: string, ipAddress: string) {
  // 1. Bloquear IP
  await blockIP(ipAddress, 3600); // 1 hora

  // 2. Invalidar sessões ativas
  await invalidateUserSessions(email);

  // 3. Forçar redefinição de senha
  await requirePasswordReset(email);

  // 4. Enviar notificação
  await notifyUser(email, {
    subject: "Atividade suspeita detectada",
    message: "Detectamos múltiplas tentativas de login falhadas em sua conta.",
  });

  // 5. Alertar admin
  await triggerSecurityAlert("high", "Brute Force Attack", {
    email,
    ipAddress,
    attemptCount: 10,
  });

  // 6. Registrar incidente
  await logIncident({
    type: "brute_force_attack",
    email,
    ipAddress,
    timestamp: new Date(),
  });
}
```

---

## ✅ Checklist de Segurança

### Autenticação
- [ ] MFA obrigatório para todos os usuários
- [ ] JWT com expiração curta (15 minutos)
- [ ] Refresh tokens com expiração longa (7 dias)
- [ ] Rotação de tokens implementada
- [ ] Device fingerprinting ativo
- [ ] Detecção de login suspeito
- [ ] Proteção contra brute force
- [ ] Backup codes para MFA

### APIs
- [ ] Validação rigorosa de input
- [ ] Rate limiting por endpoint
- [ ] Sanitização de dados
- [ ] Autenticação obrigatória
- [ ] Autorização verificada
- [ ] Logging de auditoria
- [ ] Assinatura de requests
- [ ] CORS configurado corretamente

### Banco de Dados
- [ ] RLS policies implementadas
- [ ] Queries parametrizadas
- [ ] Criptografia em repouso
- [ ] Backups automáticos
- [ ] Segregação de permissões
- [ ] Deny by default
- [ ] Least privilege

### Frontend
- [ ] CSP headers configurados
- [ ] Proteção XSS ativa
- [ ] Cookies HttpOnly e Secure
- [ ] SameSite=Strict
- [ ] Sanitização DOM
- [ ] Proteção contra clickjacking

### Cloud
- [ ] Secrets Manager configurado
- [ ] IAM mínimo necessário
- [ ] Buckets privados
- [ ] WAF ativo
- [ ] Firewall configurado
- [ ] VPN para admin
- [ ] Logs centralizados

### IA
- [ ] Validação de prompts
- [ ] Sandbox para agentes
- [ ] Limite de tokens
- [ ] Bloqueio de prompt injection
- [ ] Monitoramento de comportamento

### Monitoramento
- [ ] SIEM configurado
- [ ] IDS/IPS ativo
- [ ] Logs estruturados
- [ ] Auditoria completa
- [ ] Alertas em tempo real
- [ ] Detecção de anomalias

### CI/CD
- [ ] SAST habilitado
- [ ] DAST habilitado
- [ ] Dependency scanning
- [ ] Secret scanning
- [ ] Assinatura de builds
- [ ] Bloqueio de deploy vulnerável

---

## 📚 Referências

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework
- **CIS Controls**: https://www.cisecurity.org/cis-controls/
- **Zero Trust Architecture**: https://www.nist.gov/publications/zero-trust-architecture
- **AWS Security Best Practices**: https://aws.amazon.com/security/best-practices/
- **SANS Top 25**: https://www.sans.org/top25-software-errors/

---

**Última atualização:** 20 de maio de 2026  
**Versão:** 1.0.0  
**Classificação:** Enterprise-Grade Security

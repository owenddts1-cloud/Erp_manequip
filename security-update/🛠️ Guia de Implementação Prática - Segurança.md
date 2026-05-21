# 🛠️ Guia de Implementação Prática - Segurança

## Introdução

Este documento fornece exemplos práticos e passo a passo para implementar cada camada de segurança no MANEQUIP Analysis Portal.

---

## 1. Implementar MFA (Multi-Factor Authentication)

### Passo 1: Instalar dependências

```bash
pnpm add otplib qrcode speakeasy
pnpm add -D @types/speakeasy
```

### Passo 2: Criar serviço de MFA

```typescript
// server/services/mfaService.ts
import { authenticator } from "otplib";
import QRCode from "qrcode";

export class MFAService {
  /**
   * Gera um novo secret para MFA
   */
  static async generateSecret(email: string) {
    const secret = authenticator.generateSecret({
      name: `MANEQUIP (${email})`,
      issuer: "MANEQUIP",
    });

    const qrCode = await QRCode.toDataURL(secret);

    return { secret, qrCode };
  }

  /**
   * Verifica um token MFA
   */
  static verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.check(token, secret);
    } catch {
      return false;
    }
  }

  /**
   * Gera códigos de backup
   */
  static generateBackupCodes(count: number = 10): string[] {
    return Array.from({ length: count }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
  }
}
```

### Passo 3: Adicionar MFA ao fluxo de login

```typescript
// server/routers/auth.ts
export const authRouter = router({
  setupMFA: protectedProcedure.mutation(async ({ ctx }) => {
    const { secret, qrCode } = await MFAService.generateSecret(ctx.user.email);
    const backupCodes = MFAService.generateBackupCodes();

    // Salvar temporariamente (não ativar ainda)
    await db.savePendingMFA(ctx.user.id, secret, backupCodes);

    return { qrCode, backupCodes };
  }),

  verifyMFA: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pending = await db.getPendingMFA(ctx.user.id);

      if (!MFAService.verifyToken(pending.secret, input.token)) {
        throw new Error("Token MFA inválido");
      }

      // Ativar MFA
      await db.activateMFA(ctx.user.id, pending.secret, pending.backupCodes);

      return { success: true };
    }),

  loginWithMFA: publicProcedure
    .input(z.object({ email: z.string().email(), token: z.string() }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);

      if (!user?.mfaEnabled) {
        throw new Error("MFA não está ativado");
      }

      const secret = await db.getMFASecret(user.id);

      if (!MFAService.verifyToken(secret, input.token)) {
        throw new Error("Token MFA inválido");
      }

      // Gerar JWT
      const token = await createAccessToken(user.id, user.email, user.role);

      return { token, success: true };
    }),
});
```

---

## 2. Implementar Rate Limiting

### Passo 1: Instalar dependências

```bash
pnpm add rate-limiter-flexible redis
```

### Passo 2: Criar middleware de rate limiting

```typescript
// server/middleware/rateLimiter.ts
import { RateLimiterRedis } from "rate-limiter-flexible";
import redis from "redis";

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

const rateLimiters = {
  login: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl_login",
    points: 5,
    duration: 900, // 15 minutos
  }),

  api: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl_api",
    points: 100,
    duration: 60,
  }),

  search: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl_search",
    points: 30,
    duration: 60,
  }),
};

export async function checkRateLimit(
  limiterKey: keyof typeof rateLimiters,
  identifier: string
) {
  const limiter = rateLimiters[limiterKey];

  try {
    await limiter.consume(identifier);
    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      retryAfter: Math.ceil(error.msBeforeNext / 1000),
    };
  }
}
```

### Passo 3: Usar no router

```typescript
export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar rate limit
      const { allowed, retryAfter } = await checkRateLimit(
        "login",
        input.email
      );

      if (!allowed) {
        throw new Error(`Muitas tentativas. Tente novamente em ${retryAfter}s`);
      }

      // ... resto do login
    }),
});
```

---

## 3. Implementar Validação de Input

### Passo 1: Criar schemas reutilizáveis

```typescript
// shared/schemas.ts
import { z } from "zod";

export const emailSchema = z
  .string()
  .email("Email inválido")
  .toLowerCase()
  .max(320);

export const passwordSchema = z
  .string()
  .min(12, "Mínimo 12 caracteres")
  .regex(/[A-Z]/, "Deve conter maiúscula")
  .regex(/[a-z]/, "Deve conter minúscula")
  .regex(/[0-9]/, "Deve conter número")
  .regex(/[!@#$%^&*]/, "Deve conter caractere especial");

export const safeStringSchema = z
  .string()
  .max(1000)
  .refine((val) => !hasMaliciousPatterns(val), "Input contém padrões suspeitos");

function hasMaliciousPatterns(input: string): boolean {
  // SQL Injection
  if (/(\bUNION\b|\bSELECT\b|\bDROP\b)/i.test(input)) return true;

  // XSS
  if (/<script|javascript:|onerror/i.test(input)) return true;

  // Path Traversal
  if (/\.\.\//g.test(input)) return true;

  return false;
}

export const moduleSchema = z.object({
  title: safeStringSchema.max(255),
  category: z.enum(["strengths", "improvements", "urgent"]),
  description: safeStringSchema.max(5000),
});
```

### Passo 2: Usar em routers

```typescript
export const modulesRouter = router({
  create: adminProcedure
    .input(moduleSchema)
    .mutation(async ({ input, ctx }) => {
      // Input já foi validado pelo Zod
      const module = await db.createModule(input);

      // Log auditoria
      await logAudit(ctx.user.id, "CREATE_MODULE", "modules", module.id);

      return module;
    }),
});
```

---

## 4. Implementar CSP Headers

### Passo 1: Configurar headers de segurança

```typescript
// server/middleware/securityHeaders.ts
export function setSecurityHeaders(res: any) {
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

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
}
```

### Passo 2: Aplicar middleware

```typescript
// server/index.ts
app.use((req, res, next) => {
  setSecurityHeaders(res);
  next();
});
```

---

## 5. Implementar Sanitização XSS

### Passo 1: Instalar DOMPurify

```bash
pnpm add isomorphic-dompurify
```

### Passo 2: Criar função de sanitização

```typescript
// server/security/sanitization.ts
import DOMPurify from "isomorphic-dompurify";

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "a"],
    ALLOWED_ATTR: ["href", "title"],
  });
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/\0/g, "") // Remover null bytes
    .trim()
    .substring(0, 1000); // Limitar tamanho
}
```

### Passo 3: Usar em componentes React

```tsx
// client/src/components/SafeHTML.tsx
import DOMPurify from "dompurify";

export function SafeHTML({ html }: { html: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(html),
      }}
    />
  );
}
```

---

## 6. Implementar Logging de Auditoria

### Passo 1: Criar serviço de logging

```typescript
// server/services/auditService.ts
import winston from "winston";

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "logs/audit.log" }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

export async function logAudit(
  userId: number | null,
  action: string,
  resource: string,
  resourceId?: number,
  changes?: any
) {
  logger.info({
    timestamp: new Date().toISOString(),
    userId,
    action,
    resource,
    resourceId,
    changes,
  });

  // Também salvar no banco de dados
  await db.insert("audit_logs").values({
    userId,
    action,
    resource,
    resourceId,
    changes: JSON.stringify(changes),
    createdAt: new Date(),
  });
}
```

### Passo 2: Usar em routers

```typescript
export const modulesRouter = router({
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const module = await db.getModuleById(input.id);

      await db.deleteModule(input.id);

      // Log auditoria
      await logAudit(ctx.user.id, "DELETE_MODULE", "modules", input.id, {
        title: module.title,
      });

      return { success: true };
    }),
});
```

---

## 7. Implementar Detecção de Bots

### Passo 1: Criar middleware de detecção

```typescript
// server/middleware/botDetection.ts
export async function detectBot(
  userAgent: string,
  ipAddress: string
): Promise<{ isBot: boolean; score: number }> {
  let score = 0;

  // Verificar User-Agent suspeito
  const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i];
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) score += 0.3;
  }

  // Verificar IP de datacenter
  const isDatacenter = await checkDatacenter(ipAddress);
  if (isDatacenter) score += 0.2;

  return {
    isBot: score > 0.7,
    score,
  };
}

async function checkDatacenter(ip: string): Promise<boolean> {
  // Usar serviço de IP geolocation
  // Exemplo: MaxMind, IPQualityScore
  return false; // Placeholder
}
```

### Passo 2: Usar em middleware

```typescript
app.use(async (req, res, next) => {
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || "";

  const { isBot, score } = await detectBot(userAgent, ipAddress);

  if (isBot && score > 0.9) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (isBot && score > 0.7) {
    // Exigir CAPTCHA
    res.locals.requireCaptcha = true;
  }

  next();
});
```

---

## 8. Implementar Secrets Management

### Passo 1: Usar variáveis de ambiente

```bash
# .env.local
DATABASE_URL=mysql://user:password@localhost:3306/manequip
JWT_SECRET=seu-secret-super-seguro-aqui
ENCRYPTION_KEY=sua-chave-de-criptografia-aqui
```

### Passo 2: Carregar secrets com segurança

```typescript
// server/_core/env.ts
export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY!,
  NODE_ENV: process.env.NODE_ENV || "development",
};

// Validar que todos os secrets estão presentes
Object.entries(ENV).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});
```

### Passo 3: Nunca expor secrets

```typescript
// ❌ ERRADO
console.log(process.env.JWT_SECRET);
return { secret: process.env.JWT_SECRET };

// ✅ CORRETO
const token = createToken(userId);
return { token };
```

---

## 9. Implementar Backup Automático

### Passo 1: Criar script de backup

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Criar diretório se não existir
mkdir -p "$BACKUP_DIR"

# Fazer backup do banco de dados
mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"

# Comprimir
gzip "$BACKUP_FILE"

# Enviar para S3
aws s3 cp "$BACKUP_FILE.gz" "s3://backups-bucket/manequip/"

# Manter apenas últimos 30 dias
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete
```

### Passo 2: Agendar com cron

```bash
# Executar backup diariamente às 2 AM
0 2 * * * /home/ubuntu/manequip-analysis-portal/scripts/backup.sh
```

---

## 10. Implementar Monitoramento

### Passo 1: Configurar alertas

```typescript
// server/services/alertService.ts
export async function sendSecurityAlert(
  severity: "low" | "medium" | "high" | "critical",
  title: string,
  description: string
) {
  // Email
  if (severity === "high" || severity === "critical") {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `[${severity.toUpperCase()}] ${title}`,
      body: description,
    });
  }

  // Slack
  await sendSlack({
    channel: "#security-alerts",
    text: `*${severity.toUpperCase()}*: ${title}\n${description}`,
  });

  // Log
  logger.warn({ severity, title, description });
}
```

### Passo 2: Usar em eventos de segurança

```typescript
// Detectar brute force
if (failedAttempts > 5) {
  await sendSecurityAlert(
    "high",
    "Brute Force Attack Detected",
    `Email: ${email}, IP: ${ipAddress}, Attempts: ${failedAttempts}`
  );
}
```

---

## Checklist de Implementação

- [ ] MFA implementado
- [ ] Rate limiting ativo
- [ ] Validação de input com Zod
- [ ] CSP headers configurados
- [ ] Sanitização XSS implementada
- [ ] Logging de auditoria
- [ ] Detecção de bots
- [ ] Secrets management
- [ ] Backup automático
- [ ] Monitoramento e alertas
- [ ] Testes de segurança
- [ ] Documentação atualizada

---

**Próximos Passos:**
1. Implementar cada camada seguindo este guia
2. Testar cada funcionalidade
3. Realizar pentest
4. Documentar configurações
5. Treinar equipe

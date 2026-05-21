# ✅ Checklist Completo de Segurança Enterprise

## 🔐 AUTENTICAÇÃO E ACESSO

### MFA (Multi-Factor Authentication)

- [ ] TOTP (Time-based One-Time Password) implementado

- [ ] Backup codes gerados e armazenados com segurança

- [ ] SMS 2FA como opção secundária

- [ ] Email verification como fallback

- [ ] MFA obrigatório para admins

- [ ] MFA opcional para usuários regulares

- [ ] Recuperação de conta sem MFA documentada

- [ ] Testes de MFA bypass realizados

### Gerenciamento de Sessão

- [ ] Sessões com expiração curta (15-30 minutos)

- [ ] Refresh tokens com expiração longa (7 dias)

- [ ] Invalidação de sessão ao logout

- [ ] Revogação de tokens implementada

- [ ] Detecção de múltiplas sessões simultâneas

- [ ] Logout automático por inatividade

- [ ] Sessões vinculadas a dispositivo

- [ ] Histórico de sessões disponível para usuário

### JWT (JSON Web Tokens)

- [ ] Algoritmo seguro (HS256 ou RS256)

- [ ] Chave secreta com mínimo 256 bits

- [ ] Payload sem dados sensíveis

- [ ] Expiração configurada

- [ ] Assinatura verificada em cada requisição

- [ ] Blacklist de tokens revogados

- [ ] Rotação de chaves implementada

- [ ] Testes de JWT manipulation realizados

### Proteção contra Brute Force

- [ ] Rate limiting por email (5 tentativas / 15 min)

- [ ] Rate limiting por IP (100 requisições / min)

- [ ] Bloqueio temporário após falhas

- [ ] CAPTCHA após 3 tentativas falhadas

- [ ] Notificação ao usuário de tentativas

- [ ] IP bloqueado por período configurável

- [ ] Whitelist de IPs confiáveis

- [ ] Testes de brute force realizados

### Device Fingerprinting

- [ ] Fingerprint baseado em User-Agent

- [ ] Fingerprint baseado em IP

- [ ] Fingerprint baseado em timezone

- [ ] Detecção de novo dispositivo

- [ ] Alerta ao usuário de novo dispositivo

- [ ] Verificação adicional para novo dispositivo

- [ ] Histórico de dispositivos mantido

- [ ] Opção de revogar dispositivos

### Detecção de Anomalias

- [ ] Detecção de login em hora incomum

- [ ] Detecção de login em localização incomum

- [ ] Detecção de viagem impossível

- [ ] Detecção de múltiplos logins simultâneos

- [ ] Detecção de padrão de acesso anômalo

- [ ] Scoring de risco implementado

- [ ] Ação baseada em nível de risco

- [ ] Alertas em tempo real para anomalias

---

## 🛡️ PROTEÇÃO DE DADOS

### Validação de Input

- [ ] Validação de tipo de dados

- [ ] Validação de comprimento

- [ ] Validação de formato (email, URL, etc)

- [ ] Validação de range (min/max)

- [ ] Validação de enum (valores permitidos)

- [ ] Rejeição de caracteres especiais perigosos

- [ ] Rejeição de padrões de SQL injection

- [ ] Rejeição de padrões de XSS

- [ ] Rejeição de padrões de path traversal

- [ ] Mensagens de erro genéricas

### Sanitização de Output

- [ ] HTML escaping em texto

- [ ] URL encoding em URLs

- [ ] JavaScript escaping em JS

- [ ] SQL escaping em queries

- [ ] JSON escaping em JSON

- [ ] Remoção de scripts inline

- [ ] Remoção de event handlers

- [ ] Sanitização de atributos perigosos

### Banco de Dados

- [ ] Queries parametrizadas (prepared statements)

- [ ] ORM seguro (Drizzle, Prisma)

- [ ] RLS (Row Level Security) implementado

- [ ] Deny by default em permissões

- [ ] Least privilege para usuários DB

- [ ] Criptografia de dados sensíveis

- [ ] Hashing de senhas com bcrypt (12+ rounds)

- [ ] Backups automáticos diários

- [ ] Testes de restauração de backup

- [ ] Retenção de backups (30+ dias)

- [ ] Backups criptografados

- [ ] Backups em múltiplas regiões

### Criptografia

- [ ] Dados em trânsito: TLS 1.3+

- [ ] Dados em repouso: AES-256-GCM

- [ ] Chaves de criptografia em Secrets Manager

- [ ] Rotação de chaves implementada

- [ ] IV (Initialization Vector) aleatório

- [ ] Authentication tag para integridade

- [ ] Certificados SSL/TLS válidos

- [ ] HSTS headers configurados

---

## 🌐 PROTEÇÃO DE APIS

### Autenticação de API

- [ ] Todas as rotas requerem autenticação

- [ ] Token JWT em Authorization header

- [ ] Validação de token em cada requisição

- [ ] Refresh token flow implementado

- [ ] API keys para integração externa

- [ ] Rotação de API keys

- [ ] Rate limiting por API key

- [ ] Revogação de API keys

### Rate Limiting

- [ ] Rate limiting global (100 req/min)

- [ ] Rate limiting por usuário (50 req/min)

- [ ] Rate limiting por IP (1000 req/min)

- [ ] Rate limiting por endpoint

- [ ] Rate limiting por API key

- [ ] Limite de upload (10MB/arquivo)

- [ ] Limite de requisições simultâneas

- [ ] Resposta 429 com Retry-After header

### Validação de Requisição

- [ ] Content-Type validado

- [ ] Content-Length verificado

- [ ] Headers obrigatórios presentes

- [ ] Método HTTP verificado

- [ ] CORS configurado corretamente

- [ ] Origin header validado

- [ ] Preflight requests tratadas

- [ ] Credenciais apenas com CORS permitido

### Logging de API

- [ ] Todas as requisições logadas

- [ ] Timestamp incluído

- [ ] Usuário identificado

- [ ] Endpoint e método registrado

- [ ] Status code registrado

- [ ] Tempo de resposta medido

- [ ] Erros logados com stack trace

- [ ] Dados sensíveis não logados

---

## 🎨 SEGURANÇA FRONTEND

### Content Security Policy (CSP)

- [ ] CSP header configurado

- [ ] default-src 'self'

- [ ] script-src restritivo

- [ ] style-src restritivo

- [ ] img-src restritivo

- [ ] font-src restritivo

- [ ] connect-src restritivo

- [ ] frame-ancestors 'none'

- [ ] base-uri 'self'

- [ ] form-action 'self'

- [ ] Teste de CSP violation reporting

### Proteção XSS

- [ ] DOMPurify configurado

- [ ] Sanitização de HTML

- [ ] Escape de caracteres especiais

- [ ] Remoção de scripts inline

- [ ] Remoção de event handlers

- [ ] Validação de URLs

- [ ] Proteção de dangerouslySetInnerHTML

- [ ] Testes de XSS payload

### Cookies Seguros

- [ ] HttpOnly flag ativado

- [ ] Secure flag ativado (HTTPS)

- [ ] SameSite=Strict configurado

- [ ] Path restritivo

- [ ] Domain correto

- [ ] Max-Age apropriado

- [ ] Sem dados sensíveis em cookies

- [ ] Testes de cookie theft

### Headers de Segurança

- [ ] X-Content-Type-Options: nosniff

- [ ] X-Frame-Options: DENY

- [ ] X-XSS-Protection: 1; mode=block

- [ ] Referrer-Policy: strict-origin-when-cross-origin

- [ ] Permissions-Policy restritivo

- [ ] Strict-Transport-Security (HSTS)

- [ ] Public-Key-Pins (HPKP) opcional

- [ ] Testes de headers

### CSRF Protection

- [ ] CSRF tokens gerados

- [ ] CSRF tokens validados

- [ ] SameSite cookies configurados

- [ ] Double-submit cookies

- [ ] Origin header verificado

- [ ] Referer header verificado

- [ ] Testes de CSRF

---

## ☁️ CLOUD SECURITY

### Secrets Management

- [ ] AWS Secrets Manager ou similar

- [ ] Secrets não em código

- [ ] Secrets não em .env commitado

- [ ] Rotação automática de secrets

- [ ] Auditoria de acesso a secrets

- [ ] Permissões mínimas para secrets

- [ ] Backup de secrets

- [ ] Recuperação de desastres testada

### IAM (Identity and Access Management)

- [ ] Princípio de least privilege

- [ ] Roles específicas por função

- [ ] Policies restritivas

- [ ] Deny policies explícitas

- [ ] Resource-based policies

- [ ] Condition-based access

- [ ] Auditoria de permissões

- [ ] Revisão trimestral de permissões

### Storage (S3/Buckets)

- [ ] Buckets privados por padrão

- [ ] Acesso público bloqueado

- [ ] Versionamento ativado

- [ ] MFA Delete ativado

- [ ] Criptografia em repouso

- [ ] Criptografia em trânsito

- [ ] Access logs ativados

- [ ] Lifecycle policies configuradas

### WAF (Web Application Firewall)

- [ ] AWS WAF ou Cloudflare WAF

- [ ] Proteção contra SQL injection

- [ ] Proteção contra XSS

- [ ] Proteção contra DDoS

- [ ] Proteção contra bot

- [ ] Rate limiting

- [ ] Geo-blocking se necessário

- [ ] Logs de WAF

### DDoS Protection

- [ ] DDoS mitigation ativado

- [ ] Rate limiting global

- [ ] IP reputation checking

- [ ] Behavioral analysis

- [ ] Automatic scaling

- [ ] Failover automático

- [ ] Teste de DDoS simulado

---

## 🤖 IA SECURITY

### Validação de Prompts

- [ ] Detecção de prompt injection

- [ ] Bloqueio de jailbreak patterns

- [ ] Limite de comprimento de prompt

- [ ] Validação de caracteres

- [ ] Sanitização de prompt

- [ ] Logging de prompts suspeitos

- [ ] Alertas de prompt injection

- [ ] Testes de prompt injection

### Sandbox para Agentes IA

- [ ] Execução em ambiente isolado

- [ ] Limite de tempo (timeout)

- [ ] Limite de memória

- [ ] Limite de CPU

- [ ] Limite de I/O

- [ ] Sem acesso a sistema de arquivos

- [ ] Sem acesso a rede

- [ ] Sem acesso a variáveis de ambiente

### Controle de Ferramentas IA

- [ ] Whitelist de ferramentas permitidas

- [ ] Permissões granulares por ferramenta

- [ ] Validação de parâmetros

- [ ] Logging de execução

- [ ] Auditoria de uso

- [ ] Limite de chamadas por usuário

- [ ] Bloqueio de ferramentas perigosas

---

## 🤖 ANTI-BOT E ANTI-SCRAPING

### Detecção de Bot

- [ ] User-Agent analysis

- [ ] Comportamento de requisição

- [ ] IP reputation checking

- [ ] VPN/Proxy detection

- [ ] Datacenter IP detection

- [ ] Botometer score

- [ ] Fingerprinting

- [ ] Padrão de cliques

### CAPTCHA

- [ ] hCaptcha ou reCAPTCHA

- [ ] Ativado para suspeitos

- [ ] Ativado após tentativas falhadas

- [ ] Validação no backend

- [ ] Score-based (não apenas pass/fail)

- [ ] Acessibilidade considerada

- [ ] Fallback para deficientes visuais

### Rate Limiting Anti-Scraping

- [ ] Limite por IP

- [ ] Limite por User-Agent

- [ ] Limite por padrão de requisição

- [ ] Detecção de sequential IDs

- [ ] Detecção de bulk downloads

- [ ] Detecção de padrão de acesso

- [ ] Bloqueio temporário

- [ ] Escalação para IP permanente

### Proteção de Dados

- [ ] Robots.txt configurado

- [ ] Sitemap.xml restritivo

- [ ] Obfuscação de IDs

- [ ] Sem exposição de estrutura

- [ ] Sem exposição de dados em URLs

- [ ] Sem caching de dados sensíveis

- [ ] Sem indexação de páginas privadas

---

## 📊 MONITORAMENTO E DETECÇÃO

### Logging Centralizado

- [ ] Todos os eventos logados

- [ ] Timestamp preciso

- [ ] Usuário identificado

- [ ] Ação registrada

- [ ] Resultado registrado

- [ ] Dados sensíveis não logados

- [ ] Logs imutáveis

- [ ] Retenção de logs (90+ dias)

### SIEM (Security Information and Event Management)

- [ ] Agregação de logs

- [ ] Correlação de eventos

- [ ] Detecção de padrões

- [ ] Alertas automáticos

- [ ] Dashboard de segurança

- [ ] Relatórios de segurança

- [ ] Investigação de incidentes

- [ ] Resposta automática

### IDS/IPS (Intrusion Detection/Prevention)

- [ ] Detecção de assinatura

- [ ] Detecção de anomalia

- [ ] Bloqueio automático

- [ ] Alertas em tempo real

- [ ] Logging de tentativas

- [ ] Whitelist de IPs confiáveis

- [ ] Blacklist de IPs maliciosos

- [ ] Atualização de regras

### Alertas em Tempo Real

- [ ] Email para admin

- [ ] Slack notification

- [ ] SMS para crítico

- [ ] PagerDuty integration

- [ ] Webhook customizado

- [ ] Escalação de severidade

- [ ] Resposta automática

- [ ] Teste de alertas

---

## 🔄 CI/CD SECURITY

### SAST (Static Application Security Testing)

- [ ] SonarQube ou similar

- [ ] Análise de código

- [ ] Detecção de vulnerabilidades

- [ ] Detecção de code smells

- [ ] Cobertura de testes

- [ ] Bloqueio de deploy se crítico

- [ ] Relatório de segurança

- [ ] Integração com GitHub

### DAST (Dynamic Application Security Testing)

- [ ] Testes de penetração automatizados

- [ ] Testes de API

- [ ] Testes de autenticação

- [ ] Testes de autorização

- [ ] Testes de input validation

- [ ] Testes de XSS

- [ ] Testes de SQL injection

- [ ] Relatório de vulnerabilidades

### Dependency Scanning

- [ ] npm audit

- [ ] Snyk scanning

- [ ] Detecção de dependências vulneráveis

- [ ] Atualização automática

- [ ] Bloqueio de dependências críticas

- [ ] Whitelist de dependências

- [ ] Licença checking

- [ ] Supply chain security

### Secret Scanning

- [ ] TruffleHog scanning

- [ ] GitGuardian scanning

- [ ] Detecção de API keys

- [ ] Detecção de tokens

- [ ] Detecção de passwords

- [ ] Bloqueio de commit

- [ ] Notificação ao desenvolvedor

- [ ] Rotação de secrets expostos

### Build Security

- [ ] Assinatura de builds

- [ ] Verificação de integridade

- [ ] Bloqueio de build vulnerável

- [ ] Bloqueio de build não assinado

- [ ] Bloqueio de build com falha de teste

- [ ] Bloqueio de build com falha de SAST

- [ ] Bloqueio de build com dependência vulnerável

- [ ] Auditoria de build

---

## 🚨 INCIDENT RESPONSE

### Plano de Resposta

- [ ] Plano documentado

- [ ] Equipe designada

- [ ] Contatos de emergência

- [ ] Procedimentos de escalação

- [ ] Comunicação com stakeholders

- [ ] Comunicação com clientes

- [ ] Comunicação com reguladores

- [ ] Teste do plano

### Investigação de Incidente

- [ ] Coleta de evidências

- [ ] Preservação de logs

- [ ] Timeline de eventos

- [ ] Identificação de causa raiz

- [ ] Identificação de impacto

- [ ] Identificação de dados afetados

- [ ] Notificação de usuários

- [ ] Relatório final

### Remediação

- [ ] Isolamento de sistema afetado

- [ ] Bloqueio de atacante

- [ ] Remoção de malware

- [ ] Patch de vulnerabilidade

- [ ] Restauração de backup

- [ ] Validação de integridade

- [ ] Teste de remediação

- [ ] Monitoramento pós-incidente

---

## 📋 COMPLIANCE E DOCUMENTAÇÃO

### Documentação

- [ ] Política de segurança

- [ ] Procedimentos de segurança

- [ ] Guia de desenvolvimento seguro

- [ ] Guia de deployment

- [ ] Guia de incident response

- [ ] Guia de backup e recuperação

- [ ] Guia de auditoria

- [ ] Guia de conformidade

### Treinamento

- [ ] Treinamento de segurança para devs

- [ ] Treinamento de segurança para ops

- [ ] Treinamento de segurança para admins

- [ ] Treinamento de phishing

- [ ] Treinamento de social engineering

- [ ] Treinamento de OWASP Top 10

- [ ] Certificação de segurança

- [ ] Testes de conhecimento

### Auditoria

- [ ] Auditoria de segurança anual

- [ ] Pentest anual

- [ ] Pentest de código

- [ ] Pentest de infraestrutura

- [ ] Pentest de social engineering

- [ ] Auditoria de conformidade

- [ ] Auditoria de logs

- [ ] Auditoria de permissões

### Conformidade

- [ ] GDPR compliance

- [ ] CCPA compliance

- [ ] HIPAA compliance (se aplicável)

- [ ] PCI DSS compliance (se aplicável)

- [ ] SOC 2 compliance

- [ ] ISO 27001 compliance

- [ ] Política de privacidade

- [ ] Termos de serviço

---

## 🎯 MÉTRICAS DE SEGURANÇA

| Métrica | Alvo | Status |
| --- | --- | --- |
| MTTR (Mean Time To Respond) | < 1 hora | ⏳ |
| MTTF (Mean Time To Fix) | < 4 horas | ⏳ |
| Vulnerabilidades críticas | 0 | ⏳ |
| Cobertura de testes de segurança | > 80% | ⏳ |
| Incidentes de segurança | < 1 por trimestre | ⏳ |
| Uptime de segurança | > 99.9% | ⏳ |
| Taxa de detecção de ataques | > 95% | ⏳ |
| Taxa de falso positivo | < 5% | ⏳ |

---

**Última atualização:** 20 de maio de 2026**Versão:** 1.0.0**Responsável:** Equipe de Segurança


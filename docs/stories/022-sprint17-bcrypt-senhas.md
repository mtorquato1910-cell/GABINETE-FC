# Story 022 — Sprint 17: Segurança de Senhas com bcrypt

**Status:** Concluído — 2026-04-16
**Sprint:** 17
**Agente:** @dev
**Prioridade:** Alta (segurança crítica)

## Objetivo

Substituir o armazenamento de senhas em texto plano por hashing seguro com bcrypt. Atualmente as senhas são armazenadas sem hash — isso é uma vulnerabilidade crítica de segurança.

## Acceptance Criteria

- [x] Senha hasheada com `bcryptjs` no cadastro de usuário
- [x] Comparação correta de senha no login via `bcrypt.compare`
- [x] Todas as senhas existentes no banco precisam ser re-hasheadas (script de migração)
- [x] Nenhuma senha em texto plano no banco de dados

## Dependências

```
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

## Variáveis de Ambiente Necessárias

Nenhuma — bcrypt é puro código.

## Tasks

- [x] Instalar `bcryptjs` e `@types/bcryptjs`
- [x] Atualizar `src/lib/actions/auth.ts` — substituir `// TODO: bcrypt.hash` por implementação real
- [x] Atualizar `src/lib/auth.ts` — substituir `// TODO: bcrypt.compare` por implementação real
- [x] Criar script de migração para re-hashear senhas existentes (se houver usuários)

## Arquivos a Modificar

- `src/lib/actions/auth.ts` (linha ~24: hash no registro)
- `src/lib/auth.ts` (linha ~38: compare no login)

## Código de Referência

```typescript
// Em auth.ts (registro):
import bcrypt from 'bcryptjs'
const hashedPassword = await bcrypt.hash(password, 12)

// Em auth.ts (login/compare):
const isValid = await bcrypt.compare(password, user.password)
```

## File List

- `src/lib/actions/auth.ts` (modificar)
- `src/lib/auth.ts` (modificar)
- `package.json` (adicionar bcryptjs)

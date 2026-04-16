# EPIC-05 Complementar: Operações de Produto e Pós-Venda

**Versão:** 1.0
**Data:** 2026-04-16
**Autor:** @pm — Synkra AIOS
**Status:** Draft para Revisão
**Contexto:** Documento complementar cobrindo operações de gestão de produto (importação JIN) e pós-venda (trocas e devoluções). Estes módulos introduzem novos campos na tabela `products` e uma nova tabela `return_requests`.

---

## Índice de Sub-EPICs

| Sub-EPIC | Título | Fase | Prioridade |
|---|---|---|---|
| EPIC-S | Gestão de Produtos JIN (Importação Manual) | MVP | Alta |
| EPIC-T | Trocas e Devoluções (Return Requests) | Fase 2 | Alta |
| EPIC-U | Schema SQL Complementar v5 | MVP | Crítica |

---

## Mapa de Dependências

```
EPIC-01 (schema base) → EPIC-U (schema v5) → EPIC-S (produto JIN) → EPIC-T (trocas)
```

---

---

# EPIC-S: Gestão de Produtos — Integração com Fornecedor JIN

**Descrição:** O fornecedor JIN (Tailândia) não possui API de integração — o processo é manual via Yupoo (catálogo online). Este EPIC cobre o fluxo completo de cadastro de produto no admin, incluindo campos privados de custo e código do fornecedor para controle de margem.

**Fase:** MVP
**Prioridade:** Alta — sem produtos cadastrados, a loja não funciona
**Dependências:** EPIC-01 (admin base), EPIC-U (campos cost_price e supplier_code)

---

### US-S.1 — Cadastro de Produto com Dados do Fornecedor JIN

**Como** administrador,
**Quero** cadastrar um produto com todos os campos necessários incluindo dados privados do fornecedor,
**Para** ter controle de margem e referência interna para pedidos à JIN, sem expor essas informações no site.

**Prioridade:** MVP
**Dependências:** US-U.1 (campos cost_price, supplier_code em products)

**Critérios de Aceitação:**
- [ ] Formulário de novo produto em `/admin/produtos/novo` com todos os campos
- [ ] **Campos públicos** (aparecem no site): nome, slug (auto-gerado), time/seleção, tipo (titular/reserva/terceiro/goleiro), categoria, descrição, preço de venda, tamanhos disponíveis, imagens, meta_title, meta_description
- [ ] **Campos privados** (visíveis apenas no admin, nunca na API pública): `cost_price` (preço de custo em R$), `supplier_code` (código JIN, ex: "JIN-BRA-24-T")
- [ ] Campo `cost_price` com label "Preço de Custo (JIN)" — exibe margem calculada automaticamente ao lado: `(preço_venda - custo) / preço_venda × 100`%
- [ ] Campo `supplier_code` com label "Código do Fornecedor (JIN)" — campo de texto livre
- [ ] Upload de múltiplas imagens (até 8) via Supabase Storage
- [ ] Preview das imagens antes de salvar
- [ ] Reordenação de imagens via drag-and-drop (ordem = ordem de exibição no PDP)
- [ ] Checkbox "Produto Ativo" — quando desmarcado, produto não aparece na loja
- [ ] Checkbox "Destaque" — quando marcado, aparece na seção de destaques da home
- [ ] Após salvar, redirect para `/admin/produtos/[id]` com mensagem de sucesso
- [ ] Validação: preço de venda obrigatório, nome obrigatório, ao menos 1 imagem

**Notas Técnicas:**
- `cost_price` e `supplier_code` devem ser excluídos de qualquer query pública (RLS ou query explícita)
- A RLS da tabela `products` para usuários anônimos deve selecionar apenas colunas públicas
- Criar Server Action `createProduct(formData)` que valida com Zod antes de inserir
- Slug gerado automaticamente a partir do nome: `"Camisa Brasil 2024 Titular"` → `"camisa-brasil-2024-titular"`
- Se slug já existe, adicionar sufixo: `"camisa-brasil-2024-titular-2"`
- Imagens: upload para `supabase/storage/products/{product_id}/{uuid}.jpg`

---

### US-S.2 — Dashboard de Margem por Produto no Admin

**Como** administrador,
**Quero** visualizar a margem de lucro de cada produto diretamente na listagem do admin,
**Para** tomar decisões rápidas de precificação sem precisar calcular manualmente.

**Prioridade:** Alta (Fase 2)
**Dependências:** US-S.1

**Critérios de Aceitação:**
- [ ] Tabela `/admin/produtos` exibe coluna "Margem" visível apenas para admins
- [ ] Margem calculada: `((preço_venda - custo) / preço_venda) × 100` arredondada para 1 casa decimal
- [ ] Margem exibida com cor semafórica: verde ≥40%, amarelo 20–39%, vermelho <20%
- [ ] Filtro rápido: "Baixa Margem (<20%)" para identificar produtos a reprospecificar
- [ ] Coluna "Cód. JIN" exibida na tabela para referência rápida
- [ ] Exportação CSV da tabela com todos os campos (incluindo cost_price e supplier_code)

**Notas Técnicas:**
- Margem calculada no servidor (Server Component) — nunca exposta no cliente via API
- A query de listagem no admin usa `supabase/admin.ts` (service role) que tem acesso a todos os campos

---

### US-S.3 — Fluxo Operacional de Pedido ao Fornecedor JIN

**Como** administrador,
**Quero** ter uma referência clara dos códigos JIN quando precisar fazer um pedido ao fornecedor,
**Para** não errar o produto na hora de comprar da JIN.

**Prioridade:** Média (Fase 2)

**Critérios de Aceitação:**
- [ ] Em `/admin/pedidos/[id]`, cada item do pedido exibe o `supplier_code` do produto ao lado do nome (somente visível no admin)
- [ ] Botão "Exportar para Pedido JIN" no pedido → gera TXT/CSV com: código JIN, nome do produto, tamanho, quantidade
- [ ] Seção "Pedidos pendentes ao fornecedor" em `/admin/fornecedor` listando todos os itens de pedidos em status `confirmed` que precisam ser comprados da JIN
- [ ] Admin pode marcar item como "Comprado na JIN" — adiciona `jinsourced_at` ao item

**Notas Técnicas:**
- Nova coluna `jin_sourced_at timestamptz nullable` na tabela `order_items`
- View SQL `v_pending_jin_orders` agrupando itens por produto para facilitar a compra em lote

---

---

# EPIC-T: Trocas e Devoluções

**Descrição:** Fluxo completo de gestão de trocas e devoluções conforme política de 7 dias (Lei do Consumidor, Art. 49 CDC). Inclui tabela `return_requests`, fluxo de status, aprovação no admin, emails automáticos e integração com Stripe Refund.

**Fase:** Fase 2
**Prioridade:** Alta — compliance com CDC e proteção de reputação da loja
**Dependências:** EPIC-U (tabela return_requests), EPIC-04 (webhook Stripe), EPIC-05 (email templates)

---

### US-T.1 — Solicitação de Troca/Devolução pelo Cliente

**Como** cliente,
**Quero** solicitar uma troca ou devolução de forma simples até 7 dias após receber o produto,
**Para** exercer meu direito do consumidor sem burocracia.

**Prioridade:** Fase 2
**Dependências:** US-U.2 (tabela return_requests)

**Critérios de Aceitação:**
- [ ] Botão "Solicitar Troca/Devolução" visível em `/minha-conta/pedidos/[id]` apenas para pedidos com status `delivered` e dentro do prazo de 7 dias desde `delivered_at`
- [ ] Modal com formulário: motivo (select: "Produto com defeito", "Tamanho errado", "Produto diferente do anunciado", "Desisti da compra", "Outro"), tipo (radio: "Troca" ou "Reembolso"), campo de descrição livre (textarea, max 500 chars)
- [ ] Upload opcional de fotos do produto (até 3 imagens) como evidência
- [ ] Ao confirmar: cria `return_request` com status `pending`, envia email de confirmação ao cliente
- [ ] Após envio: exibe mensagem "Solicitação enviada! Nossa equipe analisará em até 2 dias úteis."
- [ ] Solicitação visível em `/minha-conta/trocas` com status atualizado em tempo real

**Notas Técnicas:**
- Prazo de 7 dias calculado a partir de `orders.delivered_at` (não `created_at`)
- Fotos enviadas para `supabase/storage/returns/{return_id}/{uuid}.jpg`
- Server Action `createReturnRequest(formData)` com validações Zod
- Email template "return_confirmation" via Resend

---

### US-T.2 — Gestão de Trocas/Devoluções no Admin

**Como** administrador,
**Quero** visualizar e gerenciar todas as solicitações de troca e devolução em um painel dedicado,
**Para** processar cada caso com agilidade e manter o cliente informado.

**Prioridade:** Fase 2
**Dependências:** US-T.1

**Critérios de Aceitação:**
- [ ] Seção `/admin/pedidos/trocas` listando todas as `return_requests` com filtro por status
- [ ] Cada solicitação exibe: dados do pedido original, produto(s) envolvido(s), motivo, tipo (troca/reembolso), fotos do cliente, dias desde a solicitação
- [ ] Ações disponíveis por status:

| Status atual | Ações disponíveis |
|---|---|
| `pending` | Aprovar / Rejeitar |
| `approved` | Registrar recebimento do produto |
| `received` | Processar reembolso OU confirmar troca |
| `refunded` | — (final) |
| `exchanged` | — (final) |
| `rejected` | — (final) |

- [ ] Ao **Aprovar**: status → `approved`, email automático ao cliente com instruções de envio e endereço para devolução, campo `admin_notes` opcional
- [ ] Ao **Rejeitar**: status → `rejected`, campo de justificativa obrigatório, email ao cliente explicando o motivo
- [ ] Ao **Registrar Recebimento**: status → `received`, campo para avaliar condição do produto (Bom / Com defeito / Danificado pelo cliente)
- [ ] Ao **Processar Reembolso**: Server Action `processRefund(returnId)` chama `stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id })` → status → `refunded`, email de confirmação ao cliente
- [ ] Ao **Confirmar Troca**: admin informa se há estoque físico ou se precisa aguardar JIN (campo: "Envio imediato" ou "Aguardando fornecedor") → status → `exchanged` quando produto enviado ao cliente com novo tracking code

**Notas Técnicas:**
- Server Action `processRefund()` deve verificar se `orders.payment_status = 'paid'` antes de chamar Stripe
- Stripe Refund pode ser parcial (ex: apenas 1 item de um pedido com 2 itens) — implementar lógica de valor a reembolsar
- Histórico de ações em `return_requests.admin_notes` (append, não substituição)
- Todo reembolso gera entrada em `order_history` com action `refund_processed`

---

### US-T.3 — Emails de Troca/Devolução (Templates Resend)

**Como** cliente,
**Quero** receber comunicações claras em cada etapa do processo de troca/devolução,
**Para** saber exatamente o que aconteceu com a minha solicitação.

**Prioridade:** Fase 2
**Dependências:** US-T.1, US-T.2

**Templates de email a criar (React Email + Resend):**

| Template | Gatilho | Conteúdo |
|---|---|---|
| `return_confirmation` | Solicitação criada | "Recebemos sua solicitação #XXX. Responderemos em até 2 dias úteis." |
| `return_approved` | Admin aprova | "Aprovamos sua solicitação! Envie o produto para: [endereço]. Inclua o número #XXX na caixa." |
| `return_rejected` | Admin rejeita | "Não foi possível aprovar sua solicitação. Motivo: [justificativa]. Dúvidas: [contato]" |
| `return_received` | Admin registra recebimento | "Recebemos seu produto! Estamos avaliando e você será notificado em breve." |
| `return_refunded` | Reembolso processado | "Reembolso de R$XXX processado. Previsão de crédito: 5-10 dias úteis (depende do banco)." |
| `return_exchange_shipped` | Troca enviada | "Enviamos o produto substituto! Código de rastreio: [tracking]. Prazo: [X dias]." |

**Critérios de Aceitação:**
- [ ] Todos os 6 templates criados em `emails/` com design consistente com os demais emails da loja
- [ ] Templates testados em Resend preview antes de ir para produção
- [ ] Email de reembolso informa claramente que o prazo de crédito depende do banco emissor (5-10 dias úteis)

---

---

# EPIC-U: Schema SQL Complementar v5

**Descrição:** Migrations SQL adicionando campos privados ao `products` e criando a tabela `return_requests`.

**Fase:** MVP (campos JIN) + Fase 2 (return_requests)
**Prioridade:** Crítica — bloqueia EPIC-S e EPIC-T
**Agente:** `@data-engineer`

---

### US-U.1 — Campos Privados em Products (JIN)

**Critérios de Aceitação:**
- [ ] Migration SQL criada em `supabase/migrations/20260416000005_products_jin_fields.sql`
- [ ] Campo `cost_price NUMERIC(10,2) DEFAULT 0` adicionado à tabela `products`
- [ ] Campo `supplier_code VARCHAR(100)` adicionado à tabela `products`
- [ ] Campo `jin_notes TEXT` adicionado para observações sobre o produto específico do fornecedor
- [ ] Política RLS atualizada: query anônima de `products` **não** pode selecionar `cost_price`, `supplier_code`, `jin_notes`
- [ ] Implementação via `SECURITY DEFINER` function ou `VIEW` pública excluindo esses campos
- [ ] Índice em `supplier_code` para busca rápida no admin: `CREATE INDEX idx_products_supplier_code ON products(supplier_code)`
- [ ] Campo `jin_sourced_at TIMESTAMPTZ` adicionado à tabela `order_items` (nullable)

```sql
-- Migration: 20260416000005_products_jin_fields.sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS jin_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_products_supplier_code
  ON products(supplier_code)
  WHERE supplier_code IS NOT NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS jin_sourced_at TIMESTAMPTZ;

-- View pública (sem campos privados)
CREATE OR REPLACE VIEW public_products AS
  SELECT
    id, name, slug, description, price, images, category, team,
    type, sizes_available, stock_notes, meta_title, meta_description,
    is_active, is_featured, created_at, updated_at
  FROM products
  WHERE is_active = true;

-- RLS: anon só pode ver via view, não tabela direta
-- (configurar no Supabase dashboard ou via policy)
```

---

### US-U.2 — Tabela return_requests

**Critérios de Aceitação:**
- [ ] Migration SQL criada em `supabase/migrations/20260416000006_return_requests.sql`
- [ ] Tabela `return_requests` criada com todos os campos especificados
- [ ] Enum `return_type` criado: `'refund'`, `'exchange'`
- [ ] Enum `return_status` criado: `'pending'`, `'approved'`, `'rejected'`, `'received'`, `'refunded'`, `'exchanged'`
- [ ] Índices criados em `order_id`, `user_id`, `status`
- [ ] Políticas RLS configuradas: usuário vê apenas suas próprias solicitações; admin vê todas
- [ ] Trigger de `updated_at` criado

```sql
-- Migration: 20260416000006_return_requests.sql

CREATE TYPE return_type AS ENUM ('refund', 'exchange');
CREATE TYPE return_status AS ENUM (
  'pending', 'approved', 'rejected', 'received', 'refunded', 'exchanged'
);

CREATE TABLE IF NOT EXISTS return_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason            VARCHAR(100) NOT NULL,
  description       TEXT,
  type              return_type NOT NULL,
  status            return_status NOT NULL DEFAULT 'pending',
  photos_urls       JSONB DEFAULT '[]',      -- URLs das fotos enviadas pelo cliente
  admin_notes       TEXT,                    -- Notas internas (append de cada ação)
  tracking_return   VARCHAR(50),             -- Código de rastreio do produto devolvido
  tracking_exchange VARCHAR(50),             -- Código de rastreio do produto substituto
  stripe_refund_id  VARCHAR(100),            -- ID do refund no Stripe
  refund_amount     NUMERIC(10,2),           -- Valor reembolsado
  processed_by      UUID REFERENCES auth.users(id), -- Admin que processou
  processed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_return_requests_order ON return_requests(order_id);
CREATE INDEX idx_return_requests_user ON return_requests(user_id);
CREATE INDEX idx_return_requests_status ON return_requests(status);

-- Trigger updated_at
CREATE TRIGGER set_return_requests_updated_at
  BEFORE UPDATE ON return_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own return requests"
  ON return_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own return requests"
  ON return_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can do everything"
  ON return_requests FOR ALL
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
```

---

## Fluxo de Status — return_requests

```
                  ┌──────────┐
   Cliente cria → │ pending  │
                  └────┬─────┘
                       │
              ┌────────┴────────┐
              │                 │
         Admin aprova      Admin rejeita
              │                 │
         ┌────▼─────┐     ┌─────▼──────┐
         │ approved │     │  rejected  │ (fim)
         └────┬─────┘     └────────────┘
              │
     Cliente envia produto
     Admin registra recebimento
              │
         ┌────▼─────┐
         │ received │
         └────┬─────┘
              │
     ┌────────┴────────────┐
     │                     │
Admin processa          Admin confirma
reembolso                  troca
     │                     │
┌────▼──────┐        ┌──────▼──────┐
│ refunded  │        │  exchanged  │
└───────────┘        └─────────────┘
   (fim)                  (fim)
```

---

## Resumo de Story Points — EPIC-05 Operações

| Sub-EPIC | SP | Sprint sugerido |
|---|---|---|
| EPIC-U — Schema (campos JIN + return_requests) | 5 | Sprint 7 (junto com Go-Live) |
| EPIC-S — Cadastro produto JIN (US-S.1) | 8 | Sprint 7 |
| EPIC-S — Dashboard de margem (US-S.2) | 5 | Sprint 9 |
| EPIC-S — Fluxo pedido JIN (US-S.3) | 5 | Sprint 9 |
| EPIC-T — Solicitação troca (US-T.1) | 8 | Sprint 8 |
| EPIC-T — Gestão admin (US-T.2) | 8 | Sprint 8 |
| EPIC-T — Templates email (US-T.3) | 5 | Sprint 8 |
| **Total** | **44 SP** | |

---

*Documento gerado por @pm — Synkra AIOS*
*Atualizado em: 2026-04-16*

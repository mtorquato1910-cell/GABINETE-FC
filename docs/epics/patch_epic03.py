import sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r'C:\Users\mathe\OneDrive\Área de Trabalho\GABINETE FC\GABINETE-FC\docs\epics\EPIC-gabinete-fc-v3.0-analytics-marketing.md'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

us_h0 = """### US-H.0 — Conexão OAuth com Meta Business Manager no Admin

**Como** administrador da loja,
**Quero** vincular minha conta do Meta Business Manager diretamente no painel admin via OAuth,
**Para** que o Pixel ID e o Access Token sejam obtidos automaticamente sem precisar copiar e colar nenhum token.

**Prioridade:** MVP — bloqueia US-H.1 e US-H.3
**Dependências:** US-01.1, US-K.1, US-L.1

**Critérios de Aceitação:**

**Fluxo de Conexão:**
- [ ] Página `/admin/configuracoes/meta` exibe cartão com botão "Conectar com Meta Business Manager"
- [ ] Ao clicar, o admin é redirecionado para o dialog OAuth do Meta (Facebook Login for Business) com os scopes: `ads_management`, `ads_read`, `business_management`, `pages_read_engagement`
- [ ] Após autorização, o Meta redireciona para `/admin/configuracoes/meta?code=AUTH_CODE`
- [ ] Server Action troca o `code` por User Access Token via `oauth/access_token`
- [ ] User Access Token é convertido para Long-Lived Token (60 dias) via `grant_type=fb_exchange_token`
- [ ] Long-Lived Token salvo em `store_settings` com chave `meta_user_access_token` (mascarado — exibir apenas últimos 6 chars)
- [ ] Sistema busca lista de Business Accounts via `GET /me/businesses`
- [ ] Se 1 BM account: selecionar automaticamente. Se múltiplos: exibir dropdown para seleção
- [ ] `meta_bm_id` salvo em `store_settings` após seleção

**Seleção de Pixel:**
- [ ] Após selecionar BM: buscar Pixels via `GET /{bm-id}/owned_pixels` e `/{bm-id}/client_pixels`
- [ ] Dropdown com nome e ID de cada Pixel disponível
- [ ] Pixel selecionado salva `meta_pixel_id` em `store_settings`
- [ ] Exibir: Pixel ID, nome do Pixel, Business Account conectado, usuário autenticado

**Obtenção do System User Token para CAPI — Fase 2:**
- [ ] Botão "Gerar Token do Sistema" exibe instruções e link para `business.facebook.com/settings/system-users`
- [ ] Campo manual para colar o System User Access Token gerado pelo admin no Meta BM
- [ ] Token salvo em `store_settings` com chave `meta_access_token` (mascarado)
- [ ] Observação: tokens de sistema têm validade longa e são mais estáveis que User Tokens para CAPI

**Estado de Conexão:**
- [ ] Badge verde "Conectado" com nome do BM, nome do Pixel e data da última sincronização
- [ ] Badge vermelho "Token expirado — reconectar" quando Long-Lived Token estiver vencido
- [ ] Botão "Desconectar" limpa `meta_user_access_token`, `meta_bm_id` e `meta_pixel_id` (não desconecta o app no Meta — apenas remove localmente)
- [ ] Botão "Atualizar lista de Pixels" recarrega sem precisar reconectar
- [ ] Status do Pixel: ativo/inativo e total de eventos nas últimas 24h via `GET /{pixel-id}/stats`

**Segurança:**
- [ ] `code` OAuth processado exclusivamente no Server Action — nunca exposto ao client-side
- [ ] `meta_user_access_token` e `meta_access_token` com RLS restrito a service_role — nunca retornados ao frontend via API pública
- [ ] `META_APP_SECRET` armazenado APENAS em variável de ambiente no servidor — nunca em banco
- [ ] `NEXT_PUBLIC_META_APP_ID` pode ser público (é o identificador do app no Meta)
- [ ] Rate limiting no callback OAuth: máximo 5 tentativas/minuto por IP
- [ ] Cron semanal para renovar Long-Lived Token 7 dias antes da expiração

**Notas Técnicas:**
- Meta App criado em `developers.facebook.com` como app tipo **Business** com produto **Facebook Login for Business**
- Valid OAuth Redirect URI: `https://admin.gabinetefc.com.br/admin/configuracoes/meta`
- Variáveis de ambiente: `META_APP_ID=[A_CONFIGURAR]`, `META_APP_SECRET=[A_CONFIGURAR]`
- Endpoints Graph API:
  - `https://graph.facebook.com/oauth/access_token` — exchange e long-lived token
  - `https://graph.facebook.com/me/businesses` — listar BM accounts
  - `https://graph.facebook.com/{bm_id}/owned_pixels` — listar pixels
  - `https://graph.facebook.com/{pixel_id}/stats` — status e eventos
- Toda comunicação com Graph API via Server Actions — zero chamadas client-side com tokens
- Campo adicional no schema `store_settings`: `meta_bm_id`, `meta_user_access_token`, `meta_bm_name`, `meta_pixel_name`, `meta_token_expires_at`

---

"""

# Insert before US-H.1
target = '### US-H.1 — Meta Pixel Client-side'
if target in content:
    content = content.replace(target, us_h0 + target, 1)
    print('US-H.0 inserido com sucesso')
else:
    print('ERRO: US-H.1 nao encontrado')

# Update EPIC-H description
old_desc = '**Fase:** MVP (H.1, H.2) + Fase 2 (H.3, H.4)'
if old_desc in content:
    content = content.replace(old_desc,
        '**Fase:** MVP (H.0 OAuth, H.1, H.2) + Fase 2 (H.3 CAPI, H.4 Dashboard)\n'
        '**Nota:** O vínculo com o Meta BM é feito via OAuth no admin — não há digitação manual de tokens.',
        1)
    print('Descricao do EPIC-H atualizada')

# Also update H.1 to note that pixel_id comes from OAuth, not manual entry
old_crit = '- [ ] Campo `meta_pixel_id` varchar(50) adicionado a `store_settings` — editável no admin em `/admin/configuracoes`'
new_crit = '- [ ] Campo `meta_pixel_id` salvo automaticamente em `store_settings` via fluxo OAuth da US-H.0 — NÃO é editado manualmente pelo admin'
if old_crit in content:
    content = content.replace(old_crit, new_crit, 1)
    print('Criterio de H.1 corrigido - sem edicao manual do Pixel ID')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Verify
print(f'US-H.0 ocorrencias: {content.count("US-H.0")}')
print(f'OAuth ocorrencias: {content.count("OAuth")}')
print(f'Tamanho: {len(content)} chars')

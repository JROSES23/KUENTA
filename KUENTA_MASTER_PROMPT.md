# KUENTA — Prompt Maestro para Claude Code

> Copia este documento completo y pégalo como primer mensaje en Claude Code.
> Claude Code debe leer TODO antes de escribir una sola línea de código.

---

## PRIMER PASO OBLIGATORIO — LEER LOS ARCHIVOS DE REFERENCIA

Antes de escribir cualquier código, lee estos dos archivos en orden:

```bash
cat DESIGN_SYSTEM.md   # antes de cualquier componente visual
cat SECURITY.md        # antes de cualquier Edge Function, auth o formulario
```

Ambos están en la raíz del proyecto junto a este prompt y son la única fuente de verdad para sus dominios.

**`DESIGN_SYSTEM.md`** — tipografía, colores, tokens, componentes, animaciones, iconografía.
- Tipografía: **Syne** (solo wordmark) + **DM Sans** (toda la UI)
- Wordmark `K U E N T A` → siempre `<Wordmark />`, nunca texto plano
- Cero emojis — solo SVG inline o Lucide React
- Cero hex hardcodeado — solo CSS vars (`var(--text)`, `var(--surface)`, etc.)
- Dos temas: `[data-theme="dark"]` y `[data-theme="light"]`

**`SECURITY.md`** — autenticación, RLS, Edge Functions, validación, CSP, variables de entorno.
- `SERVICE_ROLE_KEY` nunca en `src/`
- Cada Edge Function llama `requireAuth()` como primer paso
- Webhook Khipu verifica HMAC SHA-256 con `timingSafeEqual`
- `users.plan` nunca desde el cliente — trigger + RLS lo bloquean
- Zod en todos los formularios que tocan dinero

---

## TU ROL

Eres el desarrollador principal de KUENTA, una app PWA de pagos sociales para Chile.
Tu objetivo es construir el MVP completo desde cero: base de datos, backend, y frontend.
Construye en orden: primero la base de datos, luego el backend, luego el frontend.
Cuando termines una fase, dime qué hiciste y espera confirmación antes de continuar.
No preguntes cosas que ya están especificadas en este documento.

---

## QUÉ ES KUENTA

App PWA mobile-first equivalente a Venmo/Bizum pero para Chile.
Permite dividir gastos en grupos, enviar/pedir dinero P2P, y liquidar deudas vía Khipu.

- **Mercado:** Chile — español, pesos CLP, bancos chilenos
- **Plataforma:** PWA (React + Vite), instalable desde el navegador sin App Store
- **Fase actual:** MVP Fase 0 — app 100% gratis, arquitectura preparada para freemium futuro
- **Pagos P2P:** Khipu API (link de cobro — no tocamos el dinero, sin licencia CMF)
- **OCR boletas:** Gemini Flash Vision vía Edge Function
- **Revenue futuro:** Freemium $2.500 CLP/mes — la arquitectura lo soporta desde hoy

---

## STACK OBLIGATORIO

No sugerir alternativas. Usar exactamente esto:

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend framework | React | 18 |
| Build tool | Vite | latest |
| Lenguaje | TypeScript | strict mode |
| Estilos | Tailwind CSS | v3 |
| Estado global | Zustand | latest |
| Routing | React Router | v6 con lazy loading |
| PWA | vite-plugin-pwa | latest |
| Backend/DB | Supabase | latest JS SDK |
| Edge Functions | Deno (Supabase Functions) | — |
| Pagos P2P | Khipu API v2 | — |
| OCR | Gemini Flash 2.0 Vision | via Google AI SDK |
| Emails | Resend | latest |
| Suscripciones futuras | Stripe | preparado pero inactivo |
| Testing | Vitest + Testing Library | latest |
| Deploy | Vercel (frontend) + Supabase (backend) | — |

---

## ESTRUCTURA DE CARPETAS

Crear exactamente esta estructura. No agregar ni quitar carpetas:

```
kuenta/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router/
│   │   ├── index.tsx              # todas las rutas con lazy()
│   │   └── guards.tsx             # PrivateRoute, GuestRoute
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx      # input número de teléfono
│   │   │   ├── OTPPage.tsx        # verificar código SMS
│   │   │   └── ProfileSetupPage.tsx
│   │   ├── feed/
│   │   │   └── FeedPage.tsx
│   │   ├── groups/
│   │   │   ├── GroupsPage.tsx
│   │   │   └── GroupDetailPage.tsx
│   │   ├── expenses/
│   │   │   ├── NewExpensePage.tsx
│   │   │   └── ScanReceiptPage.tsx
│   │   ├── debts/
│   │   │   ├── DebtsPage.tsx
│   │   │   └── PaySuccessPage.tsx
│   │   ├── premium/
│   │   │   └── UpgradePage.tsx    # inactivo en Fase 0
│   │   └── profile/
│   │       └── ProfilePage.tsx
│   ├── components/
│   │   ├── ui/                    # design system, cero lógica de negocio
│   │   │   ├── Button.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── TabBar.tsx
│   │   ├── paywall/
│   │   │   ├── PremiumGate.tsx    # inactivo en Fase 0, listo para Fase 1
│   │   │   └── UpgradeBanner.tsx
│   │   ├── feed/
│   │   │   └── FeedCard.tsx
│   │   ├── expenses/
│   │   │   ├── SplitForm.tsx
│   │   │   ├── ParticipantRow.tsx
│   │   │   └── ReceiptItemRow.tsx
│   │   ├── groups/
│   │   │   └── GroupCard.tsx
│   │   └── debts/
│   │       └── DebtRow.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePlan.ts             # plan del usuario + límites
│   │   ├── useFeed.ts             # Supabase Realtime
│   │   ├── useGroups.ts
│   │   ├── useGroupDetail.ts
│   │   ├── useDebts.ts
│   │   ├── useCreateExpense.ts
│   │   ├── useScanReceipt.ts
│   │   └── useKhipuPayment.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── gemini.ts              # solo tipos y helper, NO llamar desde componentes
│   │   └── khipu.ts               # solo tipos y helper, NO llamar desde componentes
│   ├── store/
│   │   ├── authStore.ts
│   │   └── feedStore.ts
│   ├── types/
│   │   ├── database.ts            # generado por supabase gen types
│   │   └── app.ts
│   ├── utils/
│   │   ├── formatCLP.ts
│   │   ├── splitCalc.ts
│   │   └── phoneNormalize.ts
│   └── constants/
│       ├── routes.ts
│       ├── config.ts
│       └── plans.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20240101_init_users.sql
│   │   ├── 20240102_groups_members.sql
│   │   ├── 20240103_expenses_splits.sql
│   │   ├── 20240104_activity_feed.sql
│   │   ├── 20240105_rls_policies.sql
│   │   ├── 20240106_indexes.sql
│   │   ├── 20240107_functions_rpc.sql
│   │   └── 20240108_plan_usage.sql
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── cors.ts
│   │   │   ├── auth.ts
│   │   │   ├── plans.ts
│   │   │   └── errors.ts
│   │   ├── create-khipu-payment/index.ts
│   │   ├── khipu-webhook/index.ts
│   │   ├── scan-receipt/index.ts
│   │   ├── send-notification/index.ts
│   │   ├── create-stripe-checkout/index.ts   # vacío hasta Fase 1
│   │   └── stripe-webhook/index.ts           # vacío hasta Fase 1
│   └── seed/seed.sql
├── public/
│   ├── manifest.json
│   └── icons/                     # icon-192.png, icon-512.png, apple-touch-icon.png
├── .env.local                     # NUNCA al git
├── .env.example
├── .gitignore
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── CLAUDE.md
```

---

## BASE DE DATOS — SQL COMPLETO

### Migration 1: users

```sql
-- 20240101_init_users.sql
CREATE TABLE users (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone               text UNIQUE NOT NULL,
  display_name        text NOT NULL,
  avatar_url          text,
  push_token          text,
  plan                text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  plan_expires_at     timestamptz,
  stripe_customer_id  text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Usuario')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Migration 2: groups y members

```sql
-- 20240102_groups_members.sql
CREATE TABLE groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name        text NOT NULL,
  emoji       text NOT NULL DEFAULT '👥',
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE group_members (
  group_id     uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  phone_guest  text,
  guest_name   text,
  role         text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at    timestamptz NOT NULL DEFAULT now(),
  -- Un miembro es o usuario registrado o guest con teléfono
  CONSTRAINT member_identity CHECK (
    (user_id IS NOT NULL AND phone_guest IS NULL) OR
    (user_id IS NULL AND phone_guest IS NOT NULL AND guest_name IS NOT NULL)
  ),
  PRIMARY KEY (group_id, COALESCE(user_id::text, phone_guest))
);
```

### Migration 3: expenses y splits

```sql
-- 20240103_expenses_splits.sql
CREATE TABLE expenses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by        uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title          text NOT NULL,
  total_amount   integer NOT NULL CHECK (total_amount > 0), -- CLP sin decimales
  split_type     text NOT NULL DEFAULT 'equal'
                   CHECK (split_type IN ('equal', 'percent', 'exact', 'items')),
  receipt_url    text,
  receipt_items  jsonb, -- [{name: string, price: integer, assigned_to: uuid|'all'}]
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE expense_splits (
  expense_id        uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_owed       integer NOT NULL CHECK (amount_owed >= 0), -- CLP
  is_paid           boolean NOT NULL DEFAULT false,
  paid_at           timestamptz,
  khipu_payment_id  text,
  khipu_payment_url text,
  PRIMARY KEY (expense_id, user_id)
);
```

### Migration 4: activity_feed

```sql
-- 20240104_activity_feed.sql
CREATE TABLE activity_feed (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN (
                'expense_created',
                'payment_made',
                'payment_requested',
                'group_created',
                'member_joined'
              )),
  payload     jsonb NOT NULL DEFAULT '{}',
  -- payload ejemplos:
  -- expense_created: {expense_id, group_id, group_name, title, total_amount, split_count}
  -- payment_made:    {expense_id, amount, to_user_id, to_name}
  -- payment_requested: {expense_id, amount, from_user_id, from_name}
  visible_to  uuid[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Índice para queries del feed por usuario
CREATE INDEX activity_feed_visible_to_idx ON activity_feed USING GIN (visible_to);
CREATE INDEX activity_feed_created_at_idx ON activity_feed (created_at DESC);
```

### Migration 5: RLS (Row Level Security)

```sql
-- 20240105_rls_policies.sql

-- USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
-- Nunca permitir UPDATE en columna plan desde el cliente
-- plan solo se actualiza via Edge Function con service key

-- GROUPS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups_select_member" ON groups FOR SELECT USING (
  id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "groups_insert_auth" ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "groups_update_admin" ON groups FOR UPDATE USING (
  id IN (
    SELECT group_id FROM group_members
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- GROUP_MEMBERS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_same_group" ON group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "members_insert_admin" ON group_members FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- EXPENSES
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_select_member" ON expenses FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "expenses_insert_member" ON expenses FOR INSERT
  WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    AND auth.uid() = paid_by
  );
CREATE POLICY "expenses_update_payer" ON expenses FOR UPDATE USING (
  auth.uid() = paid_by
);

-- EXPENSE_SPLITS
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "splits_select_member" ON expense_splits FOR SELECT USING (
  expense_id IN (
    SELECT e.id FROM expenses e
    JOIN group_members gm ON gm.group_id = e.group_id
    WHERE gm.user_id = auth.uid()
  )
);
CREATE POLICY "splits_update_own" ON expense_splits FOR UPDATE USING (
  user_id = auth.uid()
) WITH CHECK (user_id = auth.uid());

-- ACTIVITY_FEED
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_select_visible" ON activity_feed FOR SELECT USING (
  auth.uid() = ANY(visible_to)
);
```

### Migration 6: Índices de performance

```sql
-- 20240106_indexes.sql
CREATE INDEX groups_created_by_idx ON groups (created_by);
CREATE INDEX group_members_user_id_idx ON group_members (user_id);
CREATE INDEX group_members_phone_guest_idx ON group_members (phone_guest)
  WHERE phone_guest IS NOT NULL;
CREATE INDEX expenses_group_id_idx ON expenses (group_id);
CREATE INDEX expenses_paid_by_idx ON expenses (paid_by);
CREATE INDEX expenses_created_at_idx ON expenses (created_at DESC);
CREATE INDEX expense_splits_user_id_idx ON expense_splits (user_id);
CREATE INDEX expense_splits_unpaid_idx ON expense_splits (user_id, is_paid)
  WHERE is_paid = false;
CREATE INDEX users_phone_idx ON users (phone);
```

### Migration 7: Stored procedures

```sql
-- 20240107_functions_rpc.sql

-- Crear gasto + splits en una sola transacción atómica
CREATE OR REPLACE FUNCTION create_expense_with_splits(
  p_group_id    uuid,
  p_paid_by     uuid,
  p_title       text,
  p_total       integer,
  p_split_type  text,
  p_splits      jsonb, -- [{user_id: uuid, amount_owed: integer}]
  p_receipt_url text DEFAULT NULL,
  p_receipt_items jsonb DEFAULT NULL,
  p_notes       text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expense_id uuid;
  v_split      jsonb;
  v_user_ids   uuid[];
BEGIN
  -- Verificar que el pagador es miembro del grupo
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_paid_by
  ) THEN
    RAISE EXCEPTION 'El pagador no es miembro del grupo';
  END IF;

  -- Verificar que el total coincide con la suma de splits
  IF (SELECT SUM((s->>'amount_owed')::integer) FROM jsonb_array_elements(p_splits) s)
     != p_total THEN
    RAISE EXCEPTION 'La suma de splits no coincide con el total';
  END IF;

  -- Insertar el gasto
  INSERT INTO expenses (group_id, paid_by, title, total_amount, split_type, receipt_url, receipt_items, notes)
  VALUES (p_group_id, p_paid_by, p_title, p_total, p_split_type, p_receipt_url, p_receipt_items, p_notes)
  RETURNING id INTO v_expense_id;

  -- Insertar los splits
  FOR v_split IN SELECT * FROM jsonb_array_elements(p_splits)
  LOOP
    INSERT INTO expense_splits (expense_id, user_id, amount_owed)
    VALUES (
      v_expense_id,
      (v_split->>'user_id')::uuid,
      (v_split->>'amount_owed')::integer
    );
  END LOOP;

  -- Construir array de user_ids para el feed
  SELECT array_agg(DISTINCT (s->>'user_id')::uuid)
  INTO v_user_ids
  FROM jsonb_array_elements(p_splits) s;

  -- Insertar evento en activity_feed
  INSERT INTO activity_feed (actor_id, type, payload, visible_to)
  VALUES (
    p_paid_by,
    'expense_created',
    jsonb_build_object(
      'expense_id', v_expense_id,
      'group_id', p_group_id,
      'title', p_title,
      'total_amount', p_total,
      'split_count', jsonb_array_length(p_splits)
    ),
    v_user_ids
  );

  RETURN v_expense_id;
END;
$$;

-- Calcular balance neto de un usuario en todos sus grupos
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id uuid)
RETURNS TABLE (
  total_owed_to_user  bigint,  -- te deben
  total_user_owes     bigint,  -- debes
  net_balance         bigint   -- neto
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN e.paid_by = p_user_id AND es.user_id != p_user_id AND NOT es.is_paid
                      THEN es.amount_owed ELSE 0 END), 0) AS total_owed_to_user,
    COALESCE(SUM(CASE WHEN es.user_id = p_user_id AND e.paid_by != p_user_id AND NOT es.is_paid
                      THEN es.amount_owed ELSE 0 END), 0) AS total_user_owes,
    COALESCE(SUM(CASE WHEN e.paid_by = p_user_id AND es.user_id != p_user_id AND NOT es.is_paid
                      THEN es.amount_owed
                      WHEN es.user_id = p_user_id AND e.paid_by != p_user_id AND NOT es.is_paid
                      THEN -es.amount_owed
                      ELSE 0 END), 0) AS net_balance
  FROM expense_splits es
  JOIN expenses e ON e.id = es.expense_id
  JOIN group_members gm ON gm.group_id = e.group_id AND gm.user_id = p_user_id;
$$;
```

### Migration 8: plan_usage

```sql
-- 20240108_plan_usage.sql
CREATE TABLE plan_usage (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('scan', 'group_created')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plan_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_usage_select_own" ON plan_usage FOR SELECT
  USING (user_id = auth.uid());
-- INSERT solo via Edge Functions con service_role key

CREATE INDEX plan_usage_user_month_idx ON plan_usage (user_id, type, created_at DESC);
```

### Seed data para desarrollo

```sql
-- supabase/seed/seed.sql
-- Solo se ejecuta en entorno local de desarrollo

-- Usuario de prueba (auth lo maneja Supabase, esto es solo el perfil)
INSERT INTO users (id, phone, display_name, plan)
VALUES
  ('00000000-0000-0000-0000-000000000001', '+56912345678', 'Sebastián Test', 'free'),
  ('00000000-0000-0000-0000-000000000002', '+56987654321', 'Camila Pérez', 'free'),
  ('00000000-0000-0000-0000-000000000003', '+56911111111', 'Matías Rodriguez', 'premium')
ON CONFLICT DO NOTHING;

INSERT INTO groups (id, created_by, name, emoji)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Depto Ñuñoa', '🏠'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Viña del Mar', '✈️')
ON CONFLICT DO NOTHING;

INSERT INTO group_members (group_id, user_id, role) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'member'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'admin'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'member')
ON CONFLICT DO NOTHING;
```

---

## EDGE FUNCTIONS — CÓDIGO COMPLETO

### _shared/cors.ts

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}
```

### _shared/auth.ts

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function requireAuth(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('No authorization header')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')

  return { user, supabase }
}

export function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}
```

### _shared/errors.ts

```typescript
import { corsHeaders } from './cors.ts'

export function errorResponse(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

export function successResponse(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

### _shared/plans.ts

```typescript
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FREEMIUM_ENABLED = Deno.env.get('FREEMIUM_ENABLED') === 'true'
const FREE_SCAN_LIMIT = 5

export async function checkScanLimit(userId: string, supabase: SupabaseClient): Promise<boolean> {
  if (!FREEMIUM_ENABLED) return true

  const { data: user } = await supabase
    .from('users').select('plan').eq('id', userId).single()
  if (user?.plan === 'premium') return true

  const startOfMonth = new Date()
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('plan_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'scan')
    .gte('created_at', startOfMonth.toISOString())

  return (count ?? 0) < FREE_SCAN_LIMIT
}

export async function recordUsage(
  userId: string,
  type: 'scan' | 'group_created',
  supabase: SupabaseClient
) {
  await supabase.from('plan_usage').insert({ user_id: userId, type })
}
```

### create-khipu-payment/index.ts

```typescript
import { handleCors, corsHeaders } from '../_shared/cors.ts'
import { requireAuth } from '../_shared/auth.ts'
import { errorResponse, successResponse } from '../_shared/errors.ts'

interface KhipuPaymentRequest {
  expense_id: string
  split_user_id: string // usuario que debe pagar
  amount: number        // CLP
  subject: string       // descripción del pago
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user, supabase } = await requireAuth(req)
    const body: KhipuPaymentRequest = await req.json()

    // Verificar que el split existe y pertenece a este usuario
    const { data: split, error: splitError } = await supabase
      .from('expense_splits')
      .select('*, expenses(title, group_id)')
      .eq('expense_id', body.expense_id)
      .eq('user_id', user.id)
      .eq('is_paid', false)
      .single()

    if (splitError || !split) {
      return errorResponse('Split no encontrado o ya pagado', 404)
    }

    if (split.amount_owed !== body.amount) {
      return errorResponse('Monto no coincide con el split')
    }

    // Crear cobro en Khipu
    const khipuRes = await fetch('https://khipu.com/api/2.0/payments', {
      method: 'POST',
      headers: {
        'Authorization': `${Deno.env.get('KHIPU_RECEIVER_ID')}:${Deno.env.get('KHIPU_SECRET')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        subject: body.subject,
        currency: 'CLP',
        amount: body.amount.toString(),
        transaction_id: `${body.expense_id}:${user.id}`,
        return_url: `${Deno.env.get('APP_URL')}/pago-ok/${body.expense_id}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/khipu-webhook`,
        payer_email: '', // opcional
      }).toString(),
    })

    if (!khipuRes.ok) {
      const err = await khipuRes.text()
      console.error('Khipu error:', err)
      return errorResponse('Error al crear el cobro en Khipu', 502)
    }

    const khipuData = await khipuRes.json()

    // Guardar el payment_id en el split para verificar después
    await supabase
      .from('expense_splits')
      .update({
        khipu_payment_id: khipuData.payment_id,
        khipu_payment_url: khipuData.payment_url,
      })
      .eq('expense_id', body.expense_id)
      .eq('user_id', user.id)

    return successResponse({
      payment_url: khipuData.payment_url,
      payment_id: khipuData.payment_id,
    })

  } catch (err) {
    console.error(err)
    return errorResponse((err as Error).message, 500)
  }
})
```

### khipu-webhook/index.ts

```typescript
import { createHmac } from 'node:crypto'
import { getServiceClient } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

function verifyHMAC(body: string, signature: string, secret: string): boolean {
  // Khipu firma con HMAC-SHA256 usando el secret como clave
  const expected = createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return expected === signature
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-khipu-signature') ?? ''

  // VERIFICACIÓN OBLIGATORIA — rechazar sin verificar
  if (!verifyHMAC(rawBody, signature, Deno.env.get('KHIPU_SECRET')!)) {
    console.error('Firma HMAC inválida', { signature })
    return new Response('Unauthorized', { status: 401 })
  }

  const body = new URLSearchParams(rawBody)
  const paymentId = body.get('payment_id')
  const status = body.get('status')
  const transactionId = body.get('transaction_id') // formato: "expense_id:user_id"

  if (status !== 'done' || !paymentId || !transactionId) {
    return new Response('OK', { status: 200 }) // ACK sin procesar
  }

  const [expenseId, userId] = transactionId.split(':')
  if (!expenseId || !userId) {
    return new Response('OK', { status: 200 })
  }

  const supabase = getServiceClient()

  // Verificar que el payment_id coincide (evitar replay attacks)
  const { data: split } = await supabase
    .from('expense_splits')
    .select('*')
    .eq('expense_id', expenseId)
    .eq('user_id', userId)
    .eq('khipu_payment_id', paymentId)
    .single()

  if (!split || split.is_paid) {
    return new Response('OK', { status: 200 })
  }

  // Marcar como pagado
  await supabase
    .from('expense_splits')
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq('expense_id', expenseId)
    .eq('user_id', userId)

  // Obtener datos del gasto para el feed
  const { data: expense } = await supabase
    .from('expenses')
    .select('*, users!paid_by(display_name)')
    .eq('id', expenseId)
    .single()

  // Insertar en activity_feed
  if (expense) {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', expense.group_id)
      .not('user_id', 'is', null)

    const visibleTo = members?.map(m => m.user_id).filter(Boolean) ?? []

    await supabase.from('activity_feed').insert({
      actor_id: userId,
      type: 'payment_made',
      payload: {
        expense_id: expenseId,
        amount: split.amount_owed,
        to_user_id: expense.paid_by,
        to_name: expense.users?.display_name ?? 'Usuario',
        title: expense.title,
      },
      visible_to: visibleTo,
    })
  }

  return new Response('OK', { status: 200 })
})
```

### scan-receipt/index.ts

```typescript
import { handleCors } from '../_shared/cors.ts'
import { requireAuth, getServiceClient } from '../_shared/auth.ts'
import { errorResponse, successResponse } from '../_shared/errors.ts'
import { checkScanLimit, recordUsage } from '../_shared/plans.ts'

interface ReceiptItem {
  name: string
  price: number
  assigned_to: 'all' | string // uuid o 'all'
}

interface ScanResult {
  restaurant_name: string
  total: number
  items: ReceiptItem[]
  confidence: 'high' | 'medium' | 'low'
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user } = await requireAuth(req)
    const serviceClient = getServiceClient()

    // Verificar límite de plan (server-side)
    const canScan = await checkScanLimit(user.id, serviceClient)
    if (!canScan) {
      return errorResponse('Límite de scans del plan gratuito alcanzado', 403)
    }

    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null
    if (!imageFile) return errorResponse('No se recibió imagen')

    // Convertir a base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    const mimeType = imageFile.type || 'image/jpeg'

    // Llamar a Gemini Flash Vision
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Eres un OCR especializado en boletas y facturas chilenas.
Analiza esta imagen y extrae la información de pago.
Responde SOLO con JSON válido, sin texto adicional, sin markdown.
Formato exacto:
{
  "restaurant_name": "nombre del local o comercio",
  "total": 12345,
  "items": [
    {"name": "nombre del ítem", "price": 1234, "assigned_to": "all"}
  ],
  "confidence": "high"
}
- Todos los precios en pesos chilenos (enteros, sin decimales)
- Si no puedes leer algo claramente, ponlo como "?"
- confidence: "high" si lees todo bien, "medium" si hay dudas, "low" si la imagen es mala
- assigned_to siempre "all" por defecto`
              },
              {
                inline_data: { mime_type: mimeType, data: base64 }
              }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
        })
      }
    )

    if (!geminiRes.ok) {
      return errorResponse('Error al procesar la imagen con IA', 502)
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    let result: ScanResult
    try {
      // Limpiar posibles backticks de markdown
      const cleanJson = rawText.replace(/```json?/g, '').replace(/```/g, '').trim()
      result = JSON.parse(cleanJson)
    } catch {
      return errorResponse('No se pudo interpretar la respuesta de la IA')
    }

    // Registrar uso para tracking de plan
    await recordUsage(user.id, 'scan', serviceClient)

    return successResponse(result)

  } catch (err) {
    console.error(err)
    return errorResponse((err as Error).message, 500)
  }
})
```

### send-notification/index.ts

```typescript
import { handleCors } from '../_shared/cors.ts'
import { getServiceClient } from '../_shared/auth.ts'
import { errorResponse, successResponse } from '../_shared/errors.ts'

interface NotificationPayload {
  user_ids: string[]
  title: string
  body: string
  data?: Record<string, string>
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Esta función solo se llama internamente (desde otros webhooks/triggers)
    // Verificar que viene del service role
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
      return errorResponse('Unauthorized', 401)
    }

    const payload: NotificationPayload = await req.json()
    const supabase = getServiceClient()

    // Obtener push tokens de los usuarios
    const { data: users } = await supabase
      .from('users')
      .select('id, push_token')
      .in('id', payload.user_ids)
      .not('push_token', 'is', null)

    if (!users?.length) return successResponse({ sent: 0 })

    // Aquí va la integración con el servicio de push que elijas
    // (Expo Push Notifications, Firebase FCM, etc.)
    // Por ahora solo loguea
    console.log('Notificaciones a enviar:', {
      tokens: users.map(u => u.push_token),
      title: payload.title,
      body: payload.body,
    })

    return successResponse({ sent: users.length })

  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
})
```

---

## FRONTEND — CÓDIGO COMPLETO

### src/constants/plans.ts

```typescript
export type PlanId = 'free' | 'premium'

export interface PlanLimits {
  maxActiveGroups: number
  maxScansPerMonth: number
  maxMembersPerGroup: number
  hasAdvancedStats: boolean
  hasAutoReminders: boolean
  hasExcelExport: boolean
}

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    maxActiveGroups: 3,
    maxScansPerMonth: 5,
    maxMembersPerGroup: 10,
    hasAdvancedStats: false,
    hasAutoReminders: false,
    hasExcelExport: false,
  },
  premium: {
    maxActiveGroups: Infinity,
    maxScansPerMonth: Infinity,
    maxMembersPerGroup: 50,
    hasAdvancedStats: true,
    hasAutoReminders: true,
    hasExcelExport: true,
  },
}

export const PLAN_PRICE_CLP = 2500
```

### src/constants/config.ts

```typescript
export const FREEMIUM_ENABLED = import.meta.env.VITE_FREEMIUM_ENABLED === 'true'
export const APP_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
```

### src/constants/routes.ts

```typescript
export const ROUTES = {
  LOGIN: '/login',
  OTP: '/otp',
  PROFILE_SETUP: '/perfil/setup',
  FEED: '/',
  GROUPS: '/grupos',
  GROUP_DETAIL: (id: string) => `/grupos/${id}`,
  NEW_EXPENSE: '/gasto/nuevo',
  SCAN_RECEIPT: '/gasto/scan',
  DEBTS: '/deudas',
  PAY_SUCCESS: (expenseId: string) => `/pago-ok/${expenseId}`,
  UPGRADE: '/premium',
  PROFILE: '/perfil',
} as const
```

### src/utils/formatCLP.ts

```typescript
const formatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatCLP(amount: number): string {
  return formatter.format(Math.round(amount))
}

// Para mostrar solo el número sin símbolo
export function formatCLPNumber(amount: number): string {
  return new Intl.NumberFormat('es-CL').format(Math.round(amount))
}
```

### src/utils/splitCalc.ts

```typescript
export interface SplitParticipant {
  user_id: string
  amount_owed: number
}

// División exactamente igual
export function splitEqual(total: number, userIds: string[]): SplitParticipant[] {
  if (!userIds.length) return []
  const base = Math.floor(total / userIds.length)
  const remainder = total - base * userIds.length

  return userIds.map((user_id, i) => ({
    user_id,
    amount_owed: i === 0 ? base + remainder : base, // el primero absorbe el residuo
  }))
}

// División por porcentaje
export function splitByPercent(
  total: number,
  participants: { user_id: string; percent: number }[]
): SplitParticipant[] {
  const sumPercent = participants.reduce((s, p) => s + p.percent, 0)
  if (Math.abs(sumPercent - 100) > 0.01) throw new Error('Los porcentajes no suman 100')

  const splits = participants.map(p => ({
    user_id: p.user_id,
    amount_owed: Math.floor(total * p.percent / 100),
  }))

  // Ajustar residuo al primero
  const sumSplits = splits.reduce((s, p) => s + p.amount_owed, 0)
  splits[0].amount_owed += total - sumSplits

  return splits
}

// División por monto exacto
export function splitByExact(
  total: number,
  participants: { user_id: string; amount: number }[]
): SplitParticipant[] {
  const sum = participants.reduce((s, p) => s + p.amount, 0)
  if (sum !== total) throw new Error(`La suma ${sum} no coincide con el total ${total}`)
  return participants.map(p => ({ user_id: p.user_id, amount_owed: p.amount }))
}
```

### src/utils/phoneNormalize.ts

```typescript
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('56') && digits.length === 11) return `+${digits}`
  if (digits.startsWith('9') && digits.length === 9) return `+56${digits}`
  if (digits.length === 8) return `+569${digits}` // sin el 9 inicial
  return `+56${digits}`
}

export function formatPhoneDisplay(phone: string): string {
  // +56912345678 → +569 1234 5678
  const normalized = normalizePhone(phone)
  if (normalized.length === 12) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 8)} ${normalized.slice(8)}`
  }
  return normalized
}
```

### src/lib/supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config'

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
)
```

### src/store/authStore.ts

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Tables } from '../types/database'

type UserProfile = Tables<'users'>

interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set({ user: null, session: null, profile: null, isLoading: false }),
    }),
    {
      name: 'kuenta-auth',
      partialize: (state) => ({ profile: state.profile }), // solo persistir perfil
    }
  )
)
```

### src/hooks/useAuth.ts

```typescript
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, session, profile, isLoading, setUser, setSession, setProfile, setLoading, reset } =
    useAuthStore()

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) await loadProfile(session.user.id)
        else { reset(); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signInWithOTP(phone: string) {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel: 'sms' },
    })
    if (error) throw error
  }

  async function verifyOTP(phone: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    reset()
  }

  async function updateProfile(updates: Partial<{ display_name: string; avatar_url: string }>) {
    if (!user) throw new Error('No hay usuario autenticado')
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  return {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    hasProfile: !!profile?.display_name,
    signInWithOTP,
    verifyOTP,
    signOut,
    updateProfile,
  }
}
```

### src/hooks/usePlan.ts

```typescript
import { FREEMIUM_ENABLED, PLANS } from '../constants'
import { useAuthStore } from '../store/authStore'
import type { PlanId, PlanLimits } from '../constants/plans'

export function usePlan() {
  const { profile } = useAuthStore()

  // En Fase 0 (FREEMIUM_ENABLED=false): todos tienen plan premium → sin restricciones
  // En Fase 1 (FREEMIUM_ENABLED=true): se usa el plan real del usuario
  const planId: PlanId = FREEMIUM_ENABLED
    ? ((profile?.plan as PlanId) ?? 'free')
    : 'premium'

  const limits: PlanLimits = PLANS[planId]

  return {
    planId,
    limits,
    isPremium: planId === 'premium',
    canCreateGroup: (currentActive: number) =>
      currentActive < limits.maxActiveGroups,
    canScanReceipt: (scansThisMonth: number) =>
      scansThisMonth < limits.maxScansPerMonth,
    canAddMember: (currentMembers: number) =>
      currentMembers < limits.maxMembersPerGroup,
  }
}
```

### src/hooks/useFeed.ts

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Tables } from '../types/database'

type FeedEvent = Tables<'activity_feed'>

export function useFeed() {
  const { user } = useAuthStore()
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) return

    // Carga inicial
    loadFeed()

    // Suscripción Realtime para actualizaciones en vivo
    const channel = supabase
      .channel('feed-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
          filter: `visible_to=cs.{${user.id}}`, // solo eventos visibles para este usuario
        },
        (payload) => {
          setEvents(prev => [payload.new as FeedEvent, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  async function loadFeed() {
    if (!user) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*, actor:actor_id(id, display_name, avatar_url)')
      .contains('visible_to', [user.id])
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) setError(new Error(error.message))
    else setEvents(data ?? [])
    setIsLoading(false)
  }

  return { events, isLoading, error, refresh: loadFeed }
}
```

### src/hooks/useDebts.ts

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export interface DebtSummary {
  with_user_id: string
  with_user_name: string
  with_user_avatar: string | null
  net_amount: number      // positivo = te deben, negativo = debes
  expense_count: number
}

export interface UserBalance {
  total_owed_to_user: number
  total_user_owes: number
  net_balance: number
}

export function useDebts() {
  const { user } = useAuthStore()
  const [debts, setDebts] = useState<DebtSummary[]>([])
  const [balance, setBalance] = useState<UserBalance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) return
    loadDebts()
  }, [user?.id])

  async function loadDebts() {
    if (!user) return
    setIsLoading(true)

    try {
      // Balance general vía RPC
      const { data: balanceData, error: balanceError } = await supabase
        .rpc('get_user_balance', { p_user_id: user.id })
        .single()

      if (balanceError) throw new Error(balanceError.message)
      setBalance(balanceData)

      // Deudas detalladas por persona
      const { data: splits, error: splitsError } = await supabase
        .from('expense_splits')
        .select(`
          amount_owed,
          is_paid,
          user_id,
          expenses!inner(
            paid_by,
            title,
            group_id,
            paid_by_user:paid_by(id, display_name, avatar_url)
          )
        `)
        .eq('is_paid', false)
        .or(`user_id.eq.${user.id},expenses.paid_by.eq.${user.id}`)

      if (splitsError) throw new Error(splitsError.message)

      // Agrupar por usuario contraparte
      const debtMap = new Map<string, DebtSummary>()

      for (const split of (splits ?? [])) {
        const expense = split.expenses as any
        const isPayer = expense.paid_by === user.id
        const counterpartId = isPayer ? split.user_id : expense.paid_by
        const counterpartUser = isPayer
          ? null // necesitaríamos fetch del otro usuario
          : expense.paid_by_user

        if (!counterpartId || counterpartId === user.id) continue

        const existing = debtMap.get(counterpartId) ?? {
          with_user_id: counterpartId,
          with_user_name: counterpartUser?.display_name ?? 'Usuario',
          with_user_avatar: counterpartUser?.avatar_url ?? null,
          net_amount: 0,
          expense_count: 0,
        }

        existing.net_amount += isPayer ? split.amount_owed : -split.amount_owed
        existing.expense_count += 1
        debtMap.set(counterpartId, existing)
      }

      setDebts(Array.from(debtMap.values()).sort((a, b) => Math.abs(b.net_amount) - Math.abs(a.net_amount)))
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  return { debts, balance, isLoading, error, refresh: loadDebts }
}
```

### src/hooks/useKhipuPayment.ts

```typescript
import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface PaymentResult {
  payment_url: string
  payment_id: string
}

export function useKhipuPayment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function createPayment(params: {
    expense_id: string
    amount: number
    subject: string
  }): Promise<PaymentResult> {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.functions.invoke('create-khipu-payment', {
        body: params,
      })

      if (error) throw new Error(error.message)
      if (!data?.payment_url) throw new Error('No se recibió URL de pago')

      return data as PaymentResult
    } catch (err) {
      const e = err as Error
      setError(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  function openPayment(paymentUrl: string) {
    // Abrir en nueva pestaña — el usuario paga en Khipu y vuelve via return_url
    window.open(paymentUrl, '_blank', 'noopener,noreferrer')
  }

  return { createPayment, openPayment, isLoading, error }
}
```

### src/hooks/useScanReceipt.ts

```typescript
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePlan } from './usePlan'

export interface ScannedItem {
  name: string
  price: number
  assigned_to: 'all' | string
}

export interface ScanResult {
  restaurant_name: string
  total: number
  items: ScannedItem[]
  confidence: 'high' | 'medium' | 'low'
}

export function useScanReceipt() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { canScanReceipt } = usePlan()

  async function scanReceipt(imageFile: File): Promise<ScanResult> {
    // Verificación client-side (también se verifica server-side)
    // En Fase 0, canScanReceipt siempre devuelve true
    if (!canScanReceipt(0)) {
      throw new Error('Has alcanzado el límite de scans de tu plan. Actualiza a Premium.')
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: formData,
      })

      if (error) throw new Error(error.message)
      return data as ScanResult
    } catch (err) {
      const e = err as Error
      setError(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return { scanReceipt, isLoading, error }
}
```

---

## DISEÑO Y UX

### Identidad visual

```
Color primario:    #534AB7 (morado KUENTA)
Color secundario:  #3C3489
Superficie clara:  #EEEDFE
Verde éxito:       #0F6E56
Rojo error:        #A32D2D
```

### Reglas de diseño mobile-first obligatorias

1. **Toda la app está diseñada para 375px de ancho** — iPhone SE como referencia
2. **TabBar fijo abajo** con 5 tabs: Inicio, Grupos, + (FAB central), Deudas, Perfil
3. **Tipografía:** Inter o sistema — font-size mínimo 14px en cualquier elemento
4. **Touch targets:** mínimo 44x44px en todos los elementos tocables
5. **Colores en CLP siempre en verde** si positivo (te deben), rojo si negativo (debes)
6. **Sin scroll horizontal** en ninguna pantalla
7. **Loading states** en todas las operaciones async — usar Spinner component
8. **Empty states** con ilustración simple y texto en todas las listas vacías

### Pantallas y su comportamiento

**LoginPage (`/login`)**
- Input de teléfono con prefijo +56 fijo
- Botón "Continuar" → llama `signInWithOTP`
- Redirige a `/otp` tras éxito

**OTPPage (`/otp`)**
- 6 inputs de un dígito cada uno (auto-advance al escribir)
- Timer de 60s para reenviar código
- Llama `verifyOTP` al completar los 6 dígitos automáticamente
- Si no tiene perfil → redirige a `/perfil/setup`
- Si tiene perfil → redirige a `/`

**FeedPage (`/`)**
- Header morado con nombre del usuario y balance neto (3 pills)
- Lista de FeedCards ordenadas por fecha DESC
- FAB morado (+) abre BottomSheet con opciones: Nuevo split, Enviar/pedir, Scan boleta
- Realtime: nuevos eventos aparecen arriba sin recargar

**GroupsPage (`/grupos`)**
- Lista de grupos ordenada: primero los que tienen deudas pendientes
- Cada GroupCard muestra nombre, emoji, cantidad de personas, y badge de deuda
- FAB para crear nuevo grupo

**GroupDetailPage (`/grupos/:id`)**
- Header con nombre y emoji del grupo
- Tabs: Gastos / Saldos
- Tab Gastos: lista de expenses con quién pagó, monto, y distribución
- Tab Saldos: quién le debe a quién, botón Pagar

**NewExpensePage (`/gasto/nuevo`)**
- Input grande de monto arriba (estilo calculadora)
- Input de título
- Lista de participantes con checkbox
- Pills de tipo split: Igual / % / Exacto / Por ítem
- El split se recalcula en tiempo real al cambiar cualquier parámetro
- Botón "Crear split" → llama `create_expense_with_splits` RPC

**ScanReceiptPage (`/gasto/scan`)**
- Área de captura/upload de foto
- Loading mientras procesa
- Lista de ítems detectados con precio
- Tap en cada ítem → asignar a persona específica o "Todos"
- Total detectado editable
- Botón "Usar para split" → pasa datos a NewExpensePage

**DebtsPage (`/deudas`)**
- Header con balance neto total
- Sección "Te deben" con lista de personas
- Sección "Debes" con lista de personas y botón "Pagar" en cada una
- Tap en una persona → ver detalle de qué gastos componen la deuda

**PaySuccessPage (`/pago-ok/:expenseId`)**
- Animación de check verde
- Monto pagado en grande
- Detalles: a quién, concepto, hora
- Botón "Volver al inicio"
- Botón "Compartir comprobante" (genera imagen para WhatsApp)

---

## CONFIGURACIÓN DE ARCHIVOS RAÍZ

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache', expiration: { maxEntries: 100 } },
          },
        ],
      },
      manifest: {
        name: 'KUENTA',
        short_name: 'Kuenta',
        description: 'Divide gastos y paga deudas fácil',
        theme_color: '#534AB7',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: { port: 5173 },
})
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### .env.example

```bash
# Supabase (pública — OK en frontend)
VITE_SUPABASE_URL=https://XXXXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Solo Edge Functions — NUNCA en el frontend
SUPABASE_SERVICE_ROLE_KEY=eyJ...
KHIPU_RECEIVER_ID=123456
KHIPU_SECRET=tu-secret-de-khipu
GEMINI_API_KEY=AIza...
RESEND_API_KEY=re_...
STRIPE_SECRET_KEY=sk_test_...        # vacío hasta Fase 1
STRIPE_WEBHOOK_SECRET=whsec_...      # vacío hasta Fase 1

# App
VITE_APP_URL=https://kuenta.app
VITE_FREEMIUM_ENABLED=false          # cambiar a true para activar freemium

# Supabase CLI necesita esto para las Edge Functions
APP_URL=https://kuenta.app
```

### .gitignore

```
node_modules/
dist/
.env.local
.env.*.local
*.local
.DS_Store
Thumbs.db
supabase/.temp/
supabase/functions/.env
coverage/
```

---

## REGLAS DE SEGURIDAD ABSOLUTAS

> **Lee `SECURITY.md` completo.** Lo que sigue es el resumen de las 10 reglas — el archivo tiene el código real de implementación para cada una.

1. `SUPABASE_SERVICE_ROLE_KEY` nunca en ningún archivo bajo `src/`
2. Llamadas a Gemini, Khipu y Stripe SIEMPRE por Edge Functions
3. Cada Edge Function llama `requireAuth()` como primer paso (ver `_shared/auth.ts`)
4. Webhook Khipu verifica firma HMAC SHA-256 con `timingSafeEqual` ANTES de procesar
5. RLS activo en TODAS las tablas — auditar con query en `SECURITY.md` sección 4.4
6. `users.plan` NUNCA desde el cliente — trigger `protect_plan_column` lo bloquea
7. TypeScript strict siempre — prohibido `any`, `as unknown as`, `// @ts-ignore`
8. Montos siempre `integer` CLP — prohibido `float`
9. Límites del plan verificados server-side en Edge Function Y client-side en hook
10. Validación con Zod en todos los formularios que tocan dinero (ver `SECURITY.md` sección 6)

---

## DISEÑO Y SISTEMA VISUAL

**Lee el archivo `DESIGN_SYSTEM.md` completo antes de tocar cualquier componente.**

### Resumen ejecutivo del design system

#### Dos fuentes, no más
```
Syne 800     → wordmark "K U E N T A" únicamente
DM Sans      → toda la interfaz (300–700)
```

Importar en `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
```

`tailwind.config.ts`:
```ts
fontFamily: {
  brand: ['Syne', 'sans-serif'],
  ui: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
},
```

#### El wordmark — componente obligatorio
```tsx
// src/components/ui/Wordmark.tsx
// Sizes: sm (22px/tracking-6), md (28px/tracking-8), lg (42px/tracking-12)
// Gradient: from-[#8880DE] via-[#4C44AA] to-[#6860C8]
// drop-shadow glow rgba(136,128,222,0.45)
// Uso:
<Wordmark size="lg" />   // splash
<Wordmark size="md" />   // login header
<Wordmark size="sm" />   // top bar app
```

#### Tokens CSS — dos temas
```css
/* globals.css aplica data-theme="dark" por defecto */
/* Ver tokens.css para lista completa */
--bg, --surface, --border, --text, --text-2, --text-3
--green, --green-bg, --red, --red-bg, --purple-text, --purple-bg
--input-bg, --tab-bg, --card-shadow
```

#### Reglas de diseño irrompibles
1. **Cero emojis** — solo Lucide React o SVG inline
2. **Cero hex hardcodeado** en componentes — usar CSS vars o tokens Tailwind
3. **Cero ShadCN** — design system propio
4. **Header siempre morado** — el gradient del header no cambia con el tema
5. **Touch targets ≥ 44px** siempre
6. **Loading states** con `<Skeleton />` en toda operación async
7. **Empty states** con mensaje + ícono, nunca pantalla en blanco

#### Pantalla Splash (`/splash` → 2.5s → `/login`)
- Fondo oscuro + 3 ambient blobs morados/azules
- `<Wordmark size="lg" />` centrado
- Tagline "divide · paga · listo" — DM Sans, 12px, tracking 2px, blanco 35%
- 3 dots pulsantes con animación `pulse-dot`

#### Pantalla Login (`/login`)
- Header: gradient morado + ambient blobs + `<Wordmark size="md" />` + título + subtítulo
- Body: input teléfono con prefix "+56" + bandera Chile SVG
- Divider + botones sociales (Google, Apple) con SVG icons
- Botón primario "Continuar" + ArrowRight
- Terms micro en la parte inferior

---

## ORDEN DE CONSTRUCCIÓN

Construir en este orden exacto. No saltar pasos:

### Fase 1: Proyecto y base de datos
1. `npm create vite@latest kuenta -- --template react-ts`
2. Instalar dependencias: `npm install @supabase/supabase-js zustand react-router-dom tailwindcss @tailwindcss/forms vite-plugin-pwa`
3. Configurar `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`
4. `npx supabase init`
5. Crear todas las migrations en orden
6. `npx supabase start`
7. `npx supabase db push`
8. `npx supabase gen types typescript --local > src/types/database.ts`
9. Crear `seed.sql` y ejecutar: `npx supabase db seed`

### Fase 2: Edge Functions

> **Lee `SECURITY.md` secciones 5 y 8 completas antes de empezar esta fase.**
1. Crear `_shared/` con los 4 archivos
2. Crear `create-khipu-payment/index.ts`
3. Crear `khipu-webhook/index.ts`
4. Crear `scan-receipt/index.ts`
5. Crear `send-notification/index.ts`
6. Probar localmente: `npx supabase functions serve`

### Fase 3: Core del frontend

> **Lee `SECURITY.md` secciones 3 y 8 antes de crear hooks de autenticación y lib/supabase.ts.**
1. Crear toda la estructura de carpetas
2. `constants/` → `routes.ts`, `config.ts`, `plans.ts`
3. `utils/` → `formatCLP.ts`, `splitCalc.ts`, `phoneNormalize.ts`
4. `lib/supabase.ts`
5. `store/authStore.ts`
6. `hooks/useAuth.ts`, `hooks/usePlan.ts`
7. Configurar router con `PrivateRoute` y `GuestRoute`

### Fase 4: Componentes UI base

> **Lee `DESIGN_SYSTEM.md` secciones 5, 6, 7 y 8 antes de empezar esta fase.**

1. `Button.tsx` — variantes: primary (gradient morado), ghost, social. Ver sección 6.7.
2. `Input.tsx` — con soporte de prefix (para "+56"). Ver sección 6.8.
3. `Avatar.tsx` — iniciales 2 letras, colores por hash. Ver sección 6.9 y `avatarColor.ts`.
4. `Badge.tsx` — pill con variantes: success (verde), error (rojo), neutral
5. `Spinner.tsx` — ring morado animado
6. `Skeleton.tsx` — shimmer con keyframe, para loading states
7. `BottomSheet.tsx` — modal con border-radius-modal (28px), glass-dark, drag handle
8. `TabBar.tsx` — glass-dark, blur 30px, border-radius 28px, FAB central. Ver sección 6.5 y 6.6.
9. `PremiumGate.tsx` — wrapper inactivo (VITE_FREEMIUM_ENABLED=false)

### Fase 5: Pantallas de auth

> **Lee `DESIGN_SYSTEM.md` secciones 1, 2, 3, 4 y 6.1 antes de empezar esta fase.**

**Orden de creación:**

1. **`src/styles/tokens.css`** — variables CSS para ambos temas (ver sección 3.1 del DESIGN_SYSTEM.md)
2. **`src/styles/animations.css`** — keyframes: `slide-up`, `pop-in`, `pulse-dot`, `shimmer`
3. **`src/styles/globals.css`** — `@tailwind base/components/utilities` + imports de tokens y animations
4. **`src/store/themeStore.ts`** — Zustand + persist, setea `data-theme` en `<html>`
5. **`src/components/ui/Wordmark.tsx`** — componente con sizes sm/md/lg, gradient, glow
6. **`src/components/ui/ThemeToggle.tsx`** — Sun/Moon con Lucide, usa themeStore
7. **`src/components/ui/AmbientBlobs.tsx`** — orbs de luz absolutos, pointer-events none
8. **`SplashPage.tsx`** — ruta `/splash`, duración 2.5s → navigate('/login'):
   - Fondo `linear-gradient(160deg, #0D0B1A, #1A1640, #0D1830)`
   - `<AmbientBlobs />` con 3 orbs
   - `<Wordmark size="lg" />` centrado
   - Tagline: "divide · paga · listo" en DM Sans 12px, tracking 2px, rgba(255,255,255,0.35)
   - 3 dots con animación `pulse-dot`
9. **`LoginPage.tsx`** — ruta `/login`:
   - Header con gradient morado + `<AmbientBlobs />`
   - `<Wordmark size="md" />` alineado izquierda
   - Título h2 blanco + subtítulo body-sm blanco 50%
   - Input teléfono: prefix "+56" con banderin CL SVG
   - Divider "o continúa con"
   - Botones Google + Apple (SVG icons, glass surface)
   - CTA "Continuar" primary-btn + ArrowRight icon
   - Terms micro con links morado
10. **`OTPPage.tsx`** — 6 inputs 1 dígito, auto-avance, resend 60s countdown
11. **`ProfileSetupPage.tsx`** — nombre, foto (Camera icon), skip opcional

### Fase 6: Pantallas principales
1. `FeedPage.tsx` + `FeedCard.tsx` + `hooks/useFeed.ts`
2. `GroupsPage.tsx` + `GroupCard.tsx` + `hooks/useGroups.ts`
3. `GroupDetailPage.tsx` + `hooks/useGroupDetail.ts`
4. `NewExpensePage.tsx` + `SplitForm.tsx` + `hooks/useCreateExpense.ts`
5. `ScanReceiptPage.tsx` + `hooks/useScanReceipt.ts`
6. `DebtsPage.tsx` + `DebtRow.tsx` + `hooks/useDebts.ts`
7. `PaySuccessPage.tsx` + `hooks/useKhipuPayment.ts`
8. `ProfilePage.tsx`

### Fase 7: PWA y polish
1. `manifest.json` + iconos
2. Service Worker
3. Meta tags para iOS (apple-touch-icon, viewport)
4. Probar instalación en Safari iOS y Chrome Android

---

## COMANDOS PARA EMPEZAR

```bash
# 1. Crear el proyecto
npm create vite@latest kuenta -- --template react-ts
cd kuenta

# 2. Instalar todo
npm install @supabase/supabase-js zustand react-router-dom
npm install -D tailwindcss @tailwindcss/forms autoprefixer postcss vite-plugin-pwa
npx tailwindcss init -p

# 3. Supabase local
npx supabase login
npx supabase init
npx supabase start

# 4. Copiar .env.local con tus valores reales y arrancar
npm run dev
```

---

## PREGUNTAS FRECUENTES PARA CLAUDE CODE

**¿Puedo usar ShadCN/UI?**
No. El design system es propio, construido con Tailwind. Mantiene el bundle pequeño y control total sobre el diseño móvil.

**¿Puedo usar React Query / TanStack Query?**
No en el MVP. Los hooks personalizados con useState son suficientes y más simples para un primer MVP. Si hay problemas de caché o sincronización, se evalúa entonces.

**¿Puedo usar Prisma o un ORM?**
No. Supabase JS SDK + tipos generados es el ORM. No agregar capas innecesarias.

**¿Qué hago si un tipo de TypeScript es complejo de inferir?**
Crear un tipo explícito en `src/types/app.ts`. Nunca usar `any`. Si el tipo de Supabase es anidado, usar `Tables<'tabla'>` y combinar con `&`.

**¿Cómo manejo errores?**
Siempre try/catch en hooks. Setear el estado `error`. Mostrar un componente de error amigable en la UI. Los errores de Edge Functions vuelven como `{ error: string }`.

**¿Los guests (sin cuenta) pueden pagar?**
En Fase 0: reciben un link de Khipu por SMS/WhatsApp. El link abre Khipu en el navegador sin necesidad de tener KUENTA instalado. Cuando pagan, el webhook actualiza el split.

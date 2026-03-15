# KUENTA — Security Guide v1.0

> **Instrucción para Claude Code:** Lee este archivo completo antes de crear
> cualquier Edge Function, hook de autenticación, formulario, o lógica que
> toque datos de usuarios o dinero. La seguridad no es opcional.

---

## 1. Modelo de amenazas

KUENTA maneja dinero real de usuarios chilenos. Las amenazas prioritarias son:

| Amenaza | Impacto | Mitigación principal |
|---|---|---|
| Usuario ve gastos de otro grupo | Alto | RLS en Supabase |
| Usuario modifica su propio `plan` a `premium` | Alto | RLS + server-side check |
| Webhook Khipu falso marca deudas como pagadas | Crítico | HMAC SHA-256 |
| API key expuesta en el frontend | Crítico | Solo ANON_KEY en cliente |
| Inyección SQL vía inputs | Alto | Supabase SDK (queries parametrizadas) |
| Phishing del número de teléfono OTP | Medio | Rate limiting en Supabase Auth |
| Enumeración de usuarios por teléfono | Medio | Mensajes de error genéricos |
| Token JWT expirado usado en Edge Function | Alto | Verificación en cada request |

---

## 2. Reglas absolutas — nunca romper

```
REGLA 1: SUPABASE_SERVICE_ROLE_KEY nunca en src/
REGLA 2: Llamadas a APIs externas (Khipu, Gemini, Stripe) solo desde Edge Functions
REGLA 3: Cada Edge Function verifica JWT antes de cualquier operación
REGLA 4: Webhook Khipu verifica HMAC SHA-256 ANTES de procesar el pago
REGLA 5: RLS activo en TODAS las tablas — nunca bypassear con service_role desde cliente
REGLA 6: users.plan NUNCA se actualiza desde el cliente
REGLA 7: Montos siempre integer CLP — nunca float
REGLA 8: Errores externos nunca se exponen al cliente — mensaje genérico siempre
REGLA 9: Logs de producción nunca incluyen tokens, keys, ni datos personales completos
REGLA 10: Rate limiting en toda operación de auth y pago
```

---

## 3. Autenticación — implementación completa

### 3.1 Supabase Auth config (en Supabase Dashboard)

```
Auth > Settings:
- OTP expiry: 600 segundos (10 min)
- Rate limit: 5 OTP por hora por número
- Disable email confirmations: true (usamos solo OTP SMS)
- JWT expiry: 3600 segundos (1 hora)
- Refresh token rotation: habilitado
- Reuse interval: 10 segundos
```

### 3.2 Hook useAuth — flujo completo

```typescript
// src/hooks/useAuth.ts
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { normalizePhone } from '@/utils/phoneNormalize'

export function useAuth() {
  const { setUser, setSession, setLoading } = useAuthStore()

  // Escuchar cambios de sesión — incluyendo refresh automático
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Limpiar estado en logout o token inválido
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (!session) {
            useAuthStore.getState().reset()
          }
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])
}

// Enviar OTP — nunca revelar si el número existe o no
export async function signInWithPhone(rawPhone: string) {
  const phone = normalizePhone(rawPhone)

  if (!phone) {
    // Error genérico — no revelar el formato esperado
    return { error: 'Número de teléfono inválido' }
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      channel: 'sms',
    },
  })

  // IMPORTANTE: siempre devolver el mismo mensaje,
  // exista o no el usuario (previene enumeración)
  if (error && error.status !== 429) {
    return { error: 'No pudimos enviar el código. Intenta de nuevo.' }
  }

  if (error?.status === 429) {
    return { error: 'Demasiados intentos. Espera unos minutos.' }
  }

  return { error: null }
}

// Verificar OTP
export async function verifyOTP(phone: string, token: string) {
  const normalized = normalizePhone(phone)

  if (!normalized || token.length !== 6 || !/^\d{6}$/.test(token)) {
    return { error: 'Código inválido', session: null }
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalized,
    token,
    type: 'sms',
  })

  if (error) {
    // Nunca exponer el error interno de Supabase al usuario
    return {
      error: 'Código incorrecto o expirado. Solicita uno nuevo.',
      session: null,
    }
  }

  return { error: null, session: data.session }
}
```

### 3.3 Normalización de teléfono chileno

```typescript
// src/utils/phoneNormalize.ts
// Formato requerido por Supabase Auth: E.164 → +56XXXXXXXXX

export function normalizePhone(raw: string): string | null {
  // Quitar todo lo que no sea dígito o +
  const digits = raw.replace(/[^\d+]/g, '')

  // Ya en formato E.164
  if (/^\+56[2-9]\d{8}$/.test(digits)) return digits

  // Solo dígitos, empieza con 56
  if (/^56[2-9]\d{8}$/.test(digits)) return `+${digits}`

  // Número local: 9XXXXXXXX (celular) o 2XXXXXXXX (fijo Santiago)
  if (/^[2-9]\d{8}$/.test(digits)) return `+56${digits}`

  // Número local con 0 adelante: 09XXXXXXXX
  if (/^0[2-9]\d{8}$/.test(digits)) return `+56${digits.slice(1)}`

  return null  // inválido
}

// Test — ejecutar con: npx vitest run utils/phoneNormalize
// normalizePhone('+56912345678') → '+56912345678'
// normalizePhone('912345678')    → '+56912345678'
// normalizePhone('0912345678')   → '+56912345678'
// normalizePhone('56912345678')  → '+56912345678'
// normalizePhone('1234')         → null
// normalizePhone('hello')        → null
```

### 3.4 Guards de ruta

```typescript
// src/router/guards.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'

// Solo usuarios autenticados
export function PrivateRoute() {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) return <Spinner fullscreen />

  if (!user) {
    // Guardar la ruta original para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

// Solo usuarios NO autenticados (login, splash, otp)
export function GuestRoute() {
  const { user, loading } = useAuthStore()

  if (loading) return <Spinner fullscreen />

  // Si ya está logueado, ir al feed
  if (user) return <Navigate to="/" replace />

  return <Outlet />
}

// Solo usuarios con perfil completo
export function ProfileCompleteRoute() {
  const { user, profile, loading } = useAuthStore()
  const location = useLocation()

  if (loading) return <Spinner fullscreen />
  if (!user) return <Navigate to="/login" replace />

  // Perfil incompleto → setup obligatorio
  if (!profile?.display_name) {
    return <Navigate to="/setup" state={{ from: location }} replace />
  }

  return <Outlet />
}
```

```typescript
// src/router/index.tsx — estructura de rutas con guards
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { PrivateRoute, GuestRoute, ProfileCompleteRoute } from './guards'
import { Spinner } from '@/components/ui/Spinner'

const SplashPage       = lazy(() => import('@/pages/auth/SplashPage'))
const LoginPage        = lazy(() => import('@/pages/auth/LoginPage'))
const OTPPage          = lazy(() => import('@/pages/auth/OTPPage'))
const ProfileSetupPage = lazy(() => import('@/pages/auth/ProfileSetupPage'))
const FeedPage         = lazy(() => import('@/pages/feed/FeedPage'))
const GroupsPage       = lazy(() => import('@/pages/groups/GroupsPage'))
// ... resto de páginas

const wrap = (el: React.ReactElement) => (
  <Suspense fallback={<Spinner fullscreen />}>{el}</Suspense>
)

export const router = createBrowserRouter([
  // Rutas públicas (solo sin sesión)
  {
    element: <GuestRoute />,
    children: [
      { path: '/splash', element: wrap(<SplashPage />) },
      { path: '/login',  element: wrap(<LoginPage />) },
      { path: '/otp',    element: wrap(<OTPPage />) },
    ],
  },
  // Setup de perfil (autenticado pero sin perfil)
  {
    element: <PrivateRoute />,
    children: [
      { path: '/setup', element: wrap(<ProfileSetupPage />) },
    ],
  },
  // App principal (autenticado + perfil completo)
  {
    element: <ProfileCompleteRoute />,
    children: [
      { path: '/',            element: wrap(<FeedPage />) },
      { path: '/grupos',      element: wrap(<GroupsPage />) },
      // ... resto
    ],
  },
  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
])
```

---

## 4. Row Level Security (RLS) — explicado

### 4.1 Principio

Supabase ejecuta estas políticas en la base de datos, **antes** de devolver cualquier dato.
No importa qué haga el frontend — si RLS está bien configurado, un usuario
no puede ver ni modificar datos de otro usuario aunque manipule la app.

### 4.2 Política crítica: users.plan nunca desde el cliente

```sql
-- Esta política en users permite UPDATE pero BLOQUEA la columna plan
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Aunque el cliente mande plan en el UPDATE, esta columna es ignorada
    -- La actualización de plan SOLO ocurre via Edge Function con service_role
  );

-- Columna plan protegida con trigger adicional
CREATE OR REPLACE FUNCTION protect_plan_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el plan cambió y el caller NO es service_role, revertir
  IF NEW.plan IS DISTINCT FROM OLD.plan
     AND current_setting('role') != 'service_role' THEN
    NEW.plan := OLD.plan;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_plan_protection
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION protect_plan_column();
```

### 4.3 Política: expense_splits — solo el dueño inicia pago

```sql
-- Un usuario solo puede pagar sus propios splits
CREATE POLICY "splits_pay_own" ON expense_splits
  FOR UPDATE USING (
    auth.uid() = user_id
    AND is_paid = false  -- no re-pagar lo ya pagado
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- NOTA: el campo khipu_payment_id y is_paid=true
-- solo los puede escribir el webhook via service_role
```

### 4.4 Verificar RLS activo en cada tabla

```sql
-- Ejecutar esto para auditar. TODAS deben mostrar rls_enabled = true
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Si alguna muestra false, INMEDIATAMENTE:
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;
```

---

## 5. Edge Functions — seguridad

### 5.1 _shared/auth.ts — verificación de JWT obligatoria

```typescript
// supabase/functions/_shared/auth.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cliente con service_role — solo para operaciones server-side autorizadas
export function getServiceClient() {
  const url  = Deno.env.get('SUPABASE_URL')!
  const key  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

// Verificar que el request viene de un usuario autenticado válido
export async function requireAuth(req: Request): Promise<{
  userId: string
  error: Response | null
}> {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      userId: '',
      error: new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  const token = authHeader.replace('Bearer ', '')

  // Verificar el JWT con Supabase — detecta tokens expirados, inválidos, etc.
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_ANON_KEY')!
  const client = createClient(url, key)

  const { data: { user }, error } = await client.auth.getUser(token)

  if (error || !user) {
    return {
      userId: '',
      error: new Response(
        JSON.stringify({ error: 'Sesión inválida o expirada' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  return { userId: user.id, error: null }
}
```

### 5.2 _shared/cors.ts

```typescript
// supabase/functions/_shared/cors.ts

// En producción, cambiar '*' por el dominio real de KUENTA
const ALLOWED_ORIGINS = [
  'https://kuenta.app',
  'https://www.kuenta.app',
  // Solo en desarrollo local:
  ...(Deno.env.get('ENVIRONMENT') === 'development'
    ? ['http://localhost:5173']
    : []),
]

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Max-Age': '86400',
  }
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) })
  }
  return null
}
```

### 5.3 _shared/errors.ts — nunca exponer errores internos

```typescript
// supabase/functions/_shared/errors.ts

// Mapa de errores internos → mensajes seguros para el cliente
const SAFE_ERRORS: Record<string, string> = {
  'JWT expired':              'Tu sesión expiró. Vuelve a ingresar.',
  'Invalid JWT':              'Sesión inválida.',
  'User not found':           'Usuario no encontrado.',
  'duplicate key value':      'Este registro ya existe.',
  'violates foreign key':     'Referencia inválida.',
  'insufficient_privilege':   'No tienes permiso para esto.',
}

export function safeError(err: unknown, statusCode = 500): Response {
  const message = err instanceof Error ? err.message : String(err)

  // Buscar si hay un mensaje seguro para este error
  const safeMessage = Object.entries(SAFE_ERRORS).find(
    ([key]) => message.includes(key)
  )?.[1] ?? 'Error interno. Intenta de nuevo.'

  // NUNCA devolver el error real al cliente en producción
  if (Deno.env.get('ENVIRONMENT') !== 'development') {
    console.error('[KUENTA ERROR]', message)  // log interno solamente
  }

  return new Response(
    JSON.stringify({ error: safeMessage }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
```

### 5.4 Plantilla completa de Edge Function segura

```typescript
// supabase/functions/create-khipu-payment/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { requireAuth, getServiceClient } from '../_shared/auth.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { safeError } from '../_shared/errors.ts'

serve(async (req) => {
  // 1. CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // 2. Solo POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405, headers: corsHeaders(req),
    })
  }

  // 3. Verificar JWT — siempre primero
  const { userId, error: authError } = await requireAuth(req)
  if (authError) return authError

  try {
    // 4. Parsear y validar body
    const body = await req.json().catch(() => null)
    if (!body?.split_id || typeof body.split_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'split_id requerido' }),
        { status: 400, headers: corsHeaders(req) }
      )
    }

    const { split_id } = body as { split_id: string }

    // 5. Verificar que el split pertenece a este usuario
    const db = getServiceClient()
    const { data: split, error: splitError } = await db
      .from('expense_splits')
      .select('id, user_id, amount_owed, is_paid, expense_id')
      .eq('id', split_id)
      .eq('user_id', userId)       // ← CRÍTICO: filtrar por userId del JWT
      .eq('is_paid', false)
      .single()

    if (splitError || !split) {
      return new Response(
        JSON.stringify({ error: 'Split no encontrado o ya pagado' }),
        { status: 404, headers: corsHeaders(req) }
      )
    }

    // 6. Crear link de cobro en Khipu
    const khipuResponse = await fetch('https://khipu.com/api/2.0/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(
          `${Deno.env.get('KHIPU_RECEIVER_ID')}:${Deno.env.get('KHIPU_SECRET')}`
        )}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        subject:    `Pago KUENTA - gasto #${split.expense_id}`,
        amount:     String(split.amount_owed),
        currency:   'CLP',
        return_url: `${Deno.env.get('APP_URL')}/pago-ok/${split.id}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/khipu-webhook`,
        transaction_id: split.id,
      }),
    })

    if (!khipuResponse.ok) {
      throw new Error(`Khipu error: ${khipuResponse.status}`)
    }

    const khipu = await khipuResponse.json()

    // 7. Guardar payment_id en el split
    await db
      .from('expense_splits')
      .update({ khipu_payment_id: khipu.payment_id })
      .eq('id', split_id)

    // 8. Solo devolver lo necesario al cliente
    return new Response(
      JSON.stringify({ payment_url: khipu.payment_url }),
      { status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return safeError(err)
  }
})
```

### 5.5 Webhook Khipu — verificación HMAC obligatoria

```typescript
// supabase/functions/khipu-webhook/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createHmac } from 'https://deno.land/std@0.177.0/crypto/mod.ts'
import { encode } from 'https://deno.land/std@0.177.0/encoding/hex.ts'
import { getServiceClient } from '../_shared/auth.ts'
import { safeError } from '../_shared/errors.ts'

// Webhook NO requiere JWT de usuario — viene de Khipu directamente
// Pero DEBE verificar la firma HMAC

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.text()
    const params = new URLSearchParams(body)

    // ── 1. VERIFICAR FIRMA HMAC ────────────────────────────────────────
    const receivedSignature = req.headers.get('X-Khipu-Signature')
    if (!receivedSignature) {
      console.error('[WEBHOOK] Sin firma HMAC')
      return new Response('Unauthorized', { status: 401 })
    }

    const secret = Deno.env.get('KHIPU_SECRET')!
    const key    = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature  = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
    const hexSig     = new TextDecoder().decode(encode(new Uint8Array(signature)))
    const expectedSig = `sha256=${hexSig}`

    // Comparación constante — previene timing attacks
    if (!timingSafeEqual(receivedSignature, expectedSig)) {
      console.error('[WEBHOOK] Firma HMAC inválida')
      return new Response('Unauthorized', { status: 401 })
    }
    // ── FIN VERIFICACIÓN HMAC ─────────────────────────────────────────

    // 2. Parsear datos del webhook
    const paymentId    = params.get('payment_id')
    const status       = params.get('payment_status')
    const transactionId = params.get('transaction_id') // es nuestro split_id

    if (!paymentId || !transactionId) {
      return new Response('Bad Request', { status: 400 })
    }

    // 3. Solo procesar pagos confirmados
    if (status !== 'done') {
      return new Response('OK', { status: 200 }) // ignorar otros estados silenciosamente
    }

    const db = getServiceClient()

    // 4. Verificar que el payment_id coincide con lo que guardamos
    const { data: split } = await db
      .from('expense_splits')
      .select('id, user_id, expense_id, khipu_payment_id, is_paid')
      .eq('id', transactionId)
      .single()

    if (!split) {
      console.error('[WEBHOOK] Split no encontrado:', transactionId)
      return new Response('Not Found', { status: 404 })
    }

    // 5. Verificar que el payment_id coincide (doble seguridad)
    if (split.khipu_payment_id !== paymentId) {
      console.error('[WEBHOOK] payment_id no coincide')
      return new Response('Unauthorized', { status: 401 })
    }

    // 6. Idempotencia — si ya está pagado, retornar OK sin re-procesar
    if (split.is_paid) {
      return new Response('OK', { status: 200 })
    }

    // 7. Marcar como pagado (operación atómica)
    const { error } = await db
      .from('expense_splits')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', transactionId)
      .eq('is_paid', false)  // condición extra — previene race conditions

    if (error) throw error

    // 8. Registrar en activity_feed
    await db.from('activity_feed').insert({
      actor_id:   split.user_id,
      type:       'payment_made',
      payload:    { split_id: split.id, expense_id: split.expense_id, payment_id: paymentId },
      visible_to: [split.user_id], // solo visible al pagador por ahora
    })

    return new Response('OK', { status: 200 })

  } catch (err) {
    return safeError(err)
  }
})

// Comparación constante — previene timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
```

---

## 6. Validación de inputs

### 6.1 Reglas generales

```typescript
// src/utils/validate.ts

// Monto CLP — siempre integer, mínimo $1, máximo $50.000.000
export function validateAmount(value: unknown): number | null {
  const n = Number(value)
  if (!Number.isInteger(n)) return null
  if (n < 1 || n > 50_000_000) return null
  return n
}

// Texto libre (nombres, descripciones)
export function sanitizeText(value: unknown, maxLength = 100): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > maxLength) return null
  // Quitar caracteres de control
  return trimmed.replace(/[\x00-\x1F\x7F]/g, '')
}

// UUID v4
export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

// OTP — exactamente 6 dígitos
export function isValidOTP(value: unknown): value is string {
  return typeof value === 'string' && /^\d{6}$/.test(value)
}
```

### 6.2 Validación en formularios (React Hook Form + Zod)

```bash
npm install react-hook-form zod @hookform/resolvers
```

```typescript
// src/pages/expenses/NewExpensePage.tsx — schema de validación
import { z } from 'zod'

export const newExpenseSchema = z.object({
  title: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(/^[^<>{}]*$/, 'Caracteres no permitidos'),

  total_amount: z
    .number({ invalid_type_error: 'Ingresa un monto válido' })
    .int('El monto debe ser entero')
    .min(1, 'Monto mínimo: $1')
    .max(50_000_000, 'Monto máximo: $50.000.000'),

  group_id: z
    .string()
    .uuid('Grupo inválido'),

  split_type: z.enum(['equal', 'percent', 'exact', 'items']),

  participant_ids: z
    .array(z.string().uuid())
    .min(2, 'Mínimo 2 participantes')
    .max(50, 'Máximo 50 participantes'),
})

export type NewExpenseInput = z.infer<typeof newExpenseSchema>
```

### 6.3 Validación en Edge Functions (Deno)

```typescript
// Validar en Edge Function — no confiar en el cliente
function validateCreatePaymentBody(body: unknown): {
  split_id: string
} | null {
  if (!body || typeof body !== 'object') return null

  const { split_id } = body as Record<string, unknown>

  if (
    typeof split_id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(split_id)
  ) {
    return null
  }

  return { split_id }
}
```

---

## 7. Content Security Policy (PWA)

```typescript
// vite.config.ts — agregar headers de seguridad
import { defineConfig } from 'vite'

export default defineConfig({
  // ...
  server: {
    headers: {
      // Solo en dev — en prod configurar en Vercel (vercel.json)
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",       // unsafe-inline requerido por Vite dev
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://*.supabase.co",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://khipu.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
    },
  },
})
```

```json
// vercel.json — headers de seguridad en producción
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://khipu.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        },
        { "key": "X-Frame-Options",           "value": "DENY" },
        { "key": "X-Content-Type-Options",    "value": "nosniff" },
        { "key": "Referrer-Policy",           "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy",        "value": "camera=(self), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    }
  ]
}
```

---

## 8. Variables de entorno — seguridad

### 8.1 Regla de clasificación

```
PÚBLICA (puede estar en el frontend, prefijo VITE_):
  VITE_SUPABASE_URL          → dominio de tu proyecto Supabase
  VITE_SUPABASE_ANON_KEY     → clave pública, solo operaciones con RLS
  VITE_APP_URL               → URL de producción
  VITE_FREEMIUM_ENABLED      → feature flag (no es secreta)

PRIVADA (solo Edge Functions, NUNCA en src/):
  SUPABASE_SERVICE_ROLE_KEY  → bypasea RLS — poder absoluto sobre la BD
  KHIPU_RECEIVER_ID          → ID de cuenta Khipu
  KHIPU_SECRET               → para firmar y verificar webhooks
  GEMINI_API_KEY             → facturado por uso
  RESEND_API_KEY             → para enviar emails
  STRIPE_SECRET_KEY          → acceso a cuenta Stripe
  STRIPE_WEBHOOK_SECRET      → verificar webhooks Stripe
```

### 8.2 Chequeo automático en desarrollo

```typescript
// src/lib/supabase.ts — verificar que no hay keys privadas en el bundle
const url     = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Faltan variables de entorno de Supabase')
}

// Detectar accidentalmente la service_role_key en el frontend
// (empieza con 'eyJ' pero tiene 'service_role' en el payload decodificado)
if (import.meta.env.DEV) {
  try {
    const payload = JSON.parse(atob(anonKey.split('.')[1]))
    if (payload.role === 'service_role') {
      throw new Error(
        '⛔ SEGURIDAD: Estás usando la SERVICE_ROLE_KEY en el frontend. ' +
        'Usa la ANON_KEY (VITE_SUPABASE_ANON_KEY).'
      )
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('SEGURIDAD')) throw e
  }
}
```

### 8.3 .gitignore — verificar que esté incluido

```gitignore
# Variables de entorno — NUNCA commitear
.env
.env.local
.env.*.local
.env.production

# Supabase secrets
supabase/.env
supabase/functions/.env
```

---

## 9. Logs seguros

```typescript
// src/utils/logger.ts
// En producción, no loguear datos sensibles nunca

const IS_PROD = import.meta.env.PROD

export const logger = {
  info: (msg: string, data?: Record<string, unknown>) => {
    if (IS_PROD) return  // silencio en producción
    console.log(`[KUENTA] ${msg}`, data ?? '')
  },

  error: (msg: string, err?: unknown) => {
    // En producción: loguear solo el mensaje, nunca el stack completo
    if (IS_PROD) {
      console.error(`[KUENTA ERROR] ${msg}`)
      return
    }
    console.error(`[KUENTA ERROR] ${msg}`, err)
  },

  // NUNCA usar esto para datos de usuario:
  // logger.info('Usuario logueado', { phone: '+56912345678' }) ← MAL
  // logger.info('Usuario logueado', { userId: '...' })        ← OK
}
```

---

## 10. Checklist de seguridad antes de deploy

```
Autenticación
[ ] OTP rate limiting configurado en Supabase Dashboard
[ ] JWT expiry en 3600s, refresh token rotation activo
[ ] Guards de ruta implementados (PrivateRoute, GuestRoute, ProfileCompleteRoute)
[ ] normalizePhone valida formato E.164 antes de enviar a Supabase

Base de datos
[ ] RLS activo en TODAS las tablas (verificar con query de auditoría)
[ ] Trigger protect_plan_column activo en users
[ ] Políticas de update verifican .eq('user_id', userId) siempre
[ ] No hay queries con .from('...').select('*') sin filtros de usuario

Edge Functions
[ ] Cada función llama requireAuth() como primer paso
[ ] Webhook Khipu verifica HMAC con timingSafeEqual
[ ] Webhook Khipu verifica idempotencia (is_paid check)
[ ] safeError() usado en todos los catch — nunca exponer errores internos
[ ] CORS configurado con dominio específico (no '*' en producción)

Variables de entorno
[ ] SERVICE_ROLE_KEY no aparece en ningún archivo src/
[ ] Chequeo automático en lib/supabase.ts activo
[ ] .env.local en .gitignore y NO commiteado
[ ] Vercel tiene todas las env vars configuradas

Frontend
[ ] Zod schemas en todos los formularios que tocan dinero
[ ] validateAmount() usado antes de enviar montos al backend
[ ] vercel.json con todos los security headers
[ ] No hay console.log con datos de usuario en producción
[ ] Spinner/loading en todas las operaciones async (previene doble submit)

Khipu
[ ] KHIPU_RECEIVER_ID y KHIPU_SECRET en variables de Supabase Functions
[ ] notify_url apunta a la Edge Function de webhook
[ ] transaction_id en el link de cobro = split_id (para reconciliación)
```

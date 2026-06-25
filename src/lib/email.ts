import { Resend } from 'resend';
import { LOGO_PNG_BASE64 } from '@/lib/logoData';

// Content-ID usado para referenciar a logo embutida via `cid:` no HTML.
const LOGO_CID = 'amf-logo';

// O Resend só é instanciado se houver chave; assim o build/dev não quebra
// quando a variável de ambiente ainda não foi configurada.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM ?? 'CEAM <onboarding@resend.dev>';

const isLocalUrl = (url?: string): boolean =>
  !url || /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(url);

/**
 * URL base da aplicação, usada para montar os links dos e-mails.
 *
 * Cuidado de produção: se `NEXT_PUBLIC_APP_URL` estiver configurada como
 * localhost (engano comum ao copiar o .env para a Vercel), ela é ignorada em
 * favor do domínio real do deploy, para os links do e-mail nunca apontarem
 * para localhost em produção.
 */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');

  // Override explícito só vale se não for um endereço local.
  if (explicit && !isLocalUrl(explicit)) return explicit;

  // Em ambiente Vercel, prefere o domínio de produção (estável) e, na falta,
  // a URL do deploy atual.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // Desenvolvimento local: usa o override local, se houver, ou o padrão.
  return explicit ?? 'http://localhost:3000';
}

// ---------------------------------------------------------------------------
// Paleta (espelha as variáveis de --brand do app)
// ---------------------------------------------------------------------------

const C = {
  ink: '#0a1626',
  inkSoft: '#1b2a3d',
  brand: '#1273c2',
  brand700: '#0e5c9e',
  brand300: '#6db2e6',
  tint: '#e8f1fb',
  paper: '#eef2f7',
  line: '#e6ebf2',
  text: '#3b4757',
  muted: '#8a97a8',
};

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// ---------------------------------------------------------------------------
// Template base
// ---------------------------------------------------------------------------

interface LayoutOpts {
  /** Texto de pré-visualização exibido na lista da caixa de entrada. */
  preheader: string;
  /** Selo de status colorido acima do título (opcional). */
  badge?: { label: string; color: string; bg: string };
  title: string;
  /** Corpo em HTML (parágrafos). */
  bodyHtml: string;
  /** Bloco de detalhes em HTML (opcional). */
  detailsHtml?: string;
  cta?: { label: string; href: string };
  /** Linha de rodapé extra (ex.: aviso sobre link expirando). */
  footnote?: string;
}

function layout(o: LayoutOpts): string {
  // A logo é enviada como anexo inline (cid), então funciona no Gmail, em dev
  // e em produção sem depender de uma URL pública acessível.
  const logo = `cid:${LOGO_CID}`;

  const badge = o.badge
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
         <tr><td style="background:${o.badge.bg};border-radius:999px;padding:6px 14px;">
           <span style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${o.badge.color};">${o.badge.label}</span>
         </td></tr>
       </table>`
    : '';

  const cta = o.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;">
         <tr><td align="center" bgcolor="${C.brand}" style="border-radius:12px;box-shadow:0 6px 16px rgba(18,115,194,.28);">
           <a href="${o.cta.href}" target="_blank"
              style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">
             ${o.cta.label}&nbsp;&rarr;
           </a>
         </td></tr>
       </table>`
    : '';

  const details = o.detailsHtml ?? '';
  const footnote = o.footnote
    ? `<p style="margin:18px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};">${o.footnote}</p>`
    : '';

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light only" />
</head>
<body style="margin:0;padding:0;background:${C.paper};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${o.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};padding:32px 14px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:512px;background:#ffffff;border:1px solid ${C.line};border-radius:20px;overflow:hidden;box-shadow:0 10px 34px rgba(10,22,38,.08);">

        <!-- Cabeçalho -->
        <tr><td style="background:${C.ink};background-image:linear-gradient(135deg,${C.ink} 0%,${C.inkSoft} 100%);padding:30px 28px 26px;" align="center">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="background:#ffffff;border-radius:999px;width:64px;height:64px;text-align:center;vertical-align:middle;box-shadow:0 4px 12px rgba(0,0,0,.18);">
              <img src="${logo}" width="42" height="42" alt="AMF"
                   style="display:inline-block;vertical-align:middle;border:0;outline:none;" />
            </td>
          </tr></table>
          <div style="font-family:${FONT};font-size:16px;font-weight:700;color:#ffffff;margin-top:14px;">Centro Esportivo Educacional Antonio Meneghetti</div>
          <div style="font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${C.brand300};margin-top:5px;">Agendamentos Esportivos</div>
        </td></tr>

        <!-- Faixa de destaque -->
        <tr><td style="height:4px;line-height:4px;font-size:0;background:${C.brand};">&nbsp;</td></tr>

        <!-- Corpo -->
        <tr><td style="padding:32px 32px 30px;">
          ${badge}
          <h1 style="margin:0 0 14px;font-family:${FONT};font-size:22px;line-height:1.25;font-weight:800;color:${C.ink};">${o.title}</h1>
          <div style="font-family:${FONT};font-size:15px;line-height:1.65;color:${C.text};">${o.bodyHtml}</div>
          ${details}
          ${cta}
          ${footnote}
        </td></tr>

        <!-- Rodapé -->
        <tr><td style="padding:20px 32px;border-top:1px solid ${C.line};background:#fbfcfe;">
          <div style="font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};">
            Antônio Meneghetti Faculdade · Agendamentos Esportivos<br/>
            Este é um e-mail automático — por favor, não responda.
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Envia um e-mail de forma tolerante a falhas: nunca lança, só registra. */
async function send(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY ausente — e-mail "${subject}" para ${to} NÃO enviado.`);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      attachments: [
        {
          filename: 'logo.png',
          content: LOGO_PNG_BASE64,
          contentId: LOGO_CID,
          contentType: 'image/png',
        },
      ],
    });
    if (error) console.error(`[email] falha ao enviar "${subject}" para ${to}:`, error);
  } catch (e) {
    console.error(`[email] exceção ao enviar "${subject}" para ${to}:`, e);
  }
}

// ---------------------------------------------------------------------------
// E-mails de autenticação
// ---------------------------------------------------------------------------

export function buildVerificationEmail(name: string, token: string): string {
  const href = `${appUrl()}/verify-email?token=${token}`;
  return layout({
    preheader: 'Confirme seu e-mail para ativar sua conta na Agendamentos Esportivos.',
    badge: { label: 'Confirmação de conta', color: C.brand700, bg: C.tint },
    title: `Bem-vindo(a), ${name}! 👋`,
    bodyHtml: `<p style="margin:0 0 12px;">Falta só um passo para ativar sua conta na <strong>Agendamentos Esportivos</strong>.
               Confirme seu e-mail clicando no botão abaixo.</p>`,
    cta: { label: 'Confirmar meu e-mail', href },
    footnote: 'O link expira em 24 horas. Se você não criou esta conta, é só ignorar este e-mail.',
  });
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  await send(to, 'Confirme seu e-mail · Agendamentos Esportivos', buildVerificationEmail(name, token));
}

export function buildPasswordResetEmail(name: string, token: string): string {
  const href = `${appUrl()}/reset-password?token=${token}`;
  return layout({
    preheader: 'Crie uma nova senha para sua conta na Agendamentos Esportivos.',
    badge: { label: 'Segurança', color: C.brand700, bg: C.tint },
    title: `Redefinir sua senha 🔒`,
    bodyHtml: `<p style="margin:0 0 12px;">Olá, ${name}! Recebemos um pedido para redefinir a senha da sua conta.
               Clique no botão abaixo para criar uma nova senha.</p>`,
    cta: { label: 'Criar nova senha', href },
    footnote: 'O link expira em 1 hora. Se não foi você, ignore este e-mail — sua senha continua a mesma.',
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  await send(to, 'Redefinir sua senha · Agendamentos Esportivos', buildPasswordResetEmail(name, token));
}

// ---------------------------------------------------------------------------
// E-mails de agendamento
// ---------------------------------------------------------------------------

interface BookingInfo {
  court: string;
  date: string; // YYYY-MM-DD
  time: string;
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** Formata "2026-06-24" como "24/06/2026 · terça-feira". */
function fmtDate(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  const weekday = WEEKDAYS[new Date(`${ymd}T12:00:00`).getDay()];
  return `${d}/${m}/${y} · ${weekday}`;
}

function row(icon: string, label: string, value: string): string {
  return `<tr>
    <td style="padding:11px 14px;border-bottom:1px solid ${C.line};width:20px;font-size:15px;">${icon}</td>
    <td style="padding:11px 0;border-bottom:1px solid ${C.line};font-family:${FONT};font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};width:78px;">${label}</td>
    <td style="padding:11px 14px;border-bottom:1px solid ${C.line};font-family:${FONT};font-size:14px;font-weight:700;color:${C.ink};text-align:right;">${value}</td>
  </tr>`;
}

function bookingDetails(b: BookingInfo): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                 style="margin:22px 0 4px;border:1px solid ${C.line};border-radius:14px;overflow:hidden;background:#fbfcfe;border-collapse:separate;">
    ${row('🏟️', 'Quadra', b.court)}
    ${row('📅', 'Data', fmtDate(b.date))}
    <tr>
      <td style="padding:11px 14px;width:20px;font-size:15px;">⏰</td>
      <td style="padding:11px 0;font-family:${FONT};font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};width:78px;">Horário</td>
      <td style="padding:11px 14px;font-family:${FONT};font-size:14px;font-weight:700;color:${C.ink};text-align:right;">${b.time}</td>
    </tr>
  </table>`;
}

export type BookingEmailKind = 'accepted' | 'rejected' | 'cancelled' | 'promoted';

const KIND: Record<
  BookingEmailKind,
  { subject: string; title: string; intro: string; badge: { label: string; color: string; bg: string } }
> = {
  accepted: {
    subject: 'Agendamento confirmado',
    title: 'Agendamento confirmado ✅',
    intro: 'Boas notícias! Seu agendamento foi <strong>aceito</strong>. Confira os detalhes:',
    badge: { label: 'Confirmado', color: '#15803d', bg: '#eafaf0' },
  },
  rejected: {
    subject: 'Agendamento recusado',
    title: 'Agendamento recusado',
    intro: 'Seu pedido de agendamento foi <strong>recusado</strong> pela administração. Veja os dados do pedido:',
    badge: { label: 'Recusado', color: '#b91c1c', bg: '#fdecec' },
  },
  cancelled: {
    subject: 'Agendamento cancelado',
    title: 'Agendamento cancelado',
    intro: 'Seu agendamento confirmado foi <strong>cancelado</strong>. Veja os detalhes:',
    badge: { label: 'Cancelado', color: '#b45309', bg: '#fef3e2' },
  },
  promoted: {
    subject: 'Sua vez na lista de espera',
    title: 'Uma vaga abriu para você 🎉',
    intro:
      'Um horário em que você estava na <strong>lista de espera</strong> foi liberado e seu pedido voltou para análise. Detalhes:',
    badge: { label: 'Lista de espera', color: C.brand700, bg: C.tint },
  },
};

export function buildBookingStatusEmail(name: string, kind: BookingEmailKind, booking: BookingInfo): string {
  const k = KIND[kind];
  return layout({
    preheader: `${k.subject} — ${booking.court}, ${fmtDate(booking.date)} às ${booking.time}.`,
    badge: k.badge,
    title: k.title,
    bodyHtml: `<p style="margin:0;">Olá, ${name}!<br/>${k.intro}</p>`,
    detailsHtml: bookingDetails(booking),
    cta: { label: 'Ver na agenda', href: `${appUrl()}/dashboard` },
  });
}

export async function sendBookingStatusEmail(
  to: string,
  name: string,
  kind: BookingEmailKind,
  booking: BookingInfo,
): Promise<void> {
  const k = KIND[kind];
  await send(to, `${k.subject} · Agendamentos Esportivos`, buildBookingStatusEmail(name, kind, booking));
}

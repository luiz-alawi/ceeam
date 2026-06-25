import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { verifyEmailAction } from '@/actions/auth';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : { ok: false };

  return (
    <div className="min-h-screen grid place-items-center bg-[var(--paper)] px-5 py-10">
      <div className="w-full max-w-[400px] bg-white border border-[var(--line)] rounded-2xl p-8 text-center">
        <img src="/logo.png" alt="AMF" className="h-12 w-12 object-contain mx-auto mb-6" />

        {result.ok ? (
          <>
            <div className="h-14 w-14 rounded-2xl bg-[#eafaf0] grid place-items-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-[#15803d]" />
            </div>
            <h1 className="font-display text-[24px] font-bold text-[var(--ink)]">E-mail confirmado!</h1>
            <p className="text-[14px] text-[var(--muted)] mt-2">
              Sua conta está ativa. Agora é só entrar e reservar suas quadras.
            </p>
          </>
        ) : (
          <>
            <div className="h-14 w-14 rounded-2xl bg-[#fdecec] grid place-items-center mx-auto mb-5">
              <XCircle className="w-7 h-7 text-[#b91c1c]" />
            </div>
            <h1 className="font-display text-[24px] font-bold text-[var(--ink)]">Link inválido ou expirado</h1>
            <p className="text-[14px] text-[var(--muted)] mt-2">
              Este link de confirmação não é mais válido. Faça login para reenviar um novo e-mail de confirmação.
            </p>
          </>
        )}

        <Link href="/login"
          className="inline-block w-full bg-[var(--brand)] text-white py-3 rounded-xl font-semibold text-[14px] hover:bg-[var(--brand-700)] transition-all mt-6">
          Ir para o login
        </Link>
      </div>
    </div>
  );
}

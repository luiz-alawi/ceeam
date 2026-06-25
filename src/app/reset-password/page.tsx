import Link from 'next/link';
import ResetPasswordForm from './ResetPasswordForm';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="min-h-screen grid place-items-center bg-[var(--paper)] px-5 py-10">
      <div className="w-full max-w-[400px] bg-white border border-[var(--line)] rounded-2xl p-8">
        <img src="/logo.png" alt="AMF" className="h-12 w-12 object-contain mx-auto mb-6" />

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="text-center">
            <h1 className="font-display text-[24px] font-bold text-[var(--ink)]">Link inválido</h1>
            <p className="text-[14px] text-[var(--muted)] mt-2">
              O link de redefinição está incompleto. Solicite um novo na tela de login.
            </p>
            <Link href="/forgot-password"
              className="inline-block w-full bg-[var(--brand)] text-white py-3 rounded-xl font-semibold text-[14px] hover:bg-[var(--brand-700)] transition-all mt-6">
              Solicitar novo link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

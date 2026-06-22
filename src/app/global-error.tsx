'use client';

import { useEffect } from 'react';

/**
 * Boundary global de erro. Substitui toda a árvore (inclusive o RootLayout)
 * quando um Server/Client Component lança no render. Sem isto, a produção
 * mostra apenas a mensagem genérica "Server Components render" sem contexto.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Facilita o diagnóstico no console do navegador.
    console.error('GlobalError:', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: '#0e1726',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Algo deu errado</h1>
          <p style={{ fontSize: 14, opacity: 0.75, margin: '0 0 20px', lineHeight: 1.5 }}>
            Tivemos um problema ao carregar esta página. Tente novamente — se o
            erro continuar, avise o administrador informando o código abaixo.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 12,
                opacity: 0.5,
                fontFamily: 'monospace',
                margin: '0 0 20px',
                wordBreak: 'break-all',
              }}
            >
              Código: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              background: '#fff',
              color: '#0e1726',
              border: 0,
              borderRadius: 12,
              padding: '10px 22px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}

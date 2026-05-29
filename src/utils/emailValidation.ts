/**
 * Provedores conhecidos: se o base name do domínio estiver nessa lista,
 * o domínio completo precisa ser um dos valores permitidos.
 * Domínios customizados (ex: @ceam.edu, @empresa.org) passam direto.
 */
const KNOWN_PROVIDERS: Record<string, string[]> = {
  gmail:      ['gmail.com'],
  hotmail:    ['hotmail.com', 'hotmail.com.br', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.it', 'hotmail.es', 'hotmail.de'],
  outlook:    ['outlook.com', 'outlook.com.br', 'outlook.com.ar', 'outlook.co.uk', 'outlook.es', 'outlook.fr', 'outlook.de', 'outlook.it'],
  yahoo:      ['yahoo.com', 'yahoo.com.br', 'yahoo.co.uk', 'yahoo.co.jp', 'yahoo.fr', 'yahoo.es', 'yahoo.de', 'yahoo.it'],
  live:       ['live.com', 'live.com.br', 'live.com.ar', 'live.co.uk', 'live.fr', 'live.de', 'live.it'],
  icloud:     ['icloud.com'],
  msn:        ['msn.com'],
  aol:        ['aol.com'],
  uol:        ['uol.com.br'],
  bol:        ['bol.com.br'],
  terra:      ['terra.com.br'],
  ig:         ['ig.com.br'],
  proton:     ['proton.me'],
  protonmail: ['protonmail.com'],
  yandex:     ['yandex.com', 'yandex.ru'],
};

/** Retorna uma mensagem de erro ou null se o email for válido. */
export function validateEmailFormat(email: string): string | null {
  const trimmed = email.trim().toLowerCase();

  // Formato básico: algo@dominio.tld
  if (!/^[^\s@]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(trimmed)) {
    return 'Formato de e-mail inválido';
  }

  const domain = trimmed.split('@')[1];
  const baseName = domain.split('.')[0]; // ex: "gmail" de "gmail.com"

  if (KNOWN_PROVIDERS[baseName]) {
    if (!KNOWN_PROVIDERS[baseName].includes(domain)) {
      const valid = KNOWN_PROVIDERS[baseName].join(', ');
      return `E-mail inválido para "${baseName}". Domínios aceitos: ${valid}`;
    }
  }

  return null;
}

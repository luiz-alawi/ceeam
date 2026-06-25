# Agendamentos Esportivos — CEAM

Sistema de reserva das quadras do Centro Esportivo Educacional Antônio Meneghetti. O aluno entra, vê a disponibilidade do dia e pede o horário; a administração aprova, recusa ou organiza a fila de espera. Tudo com confirmação por e-mail.

Projeto da disciplina de Fundamentos de Sistemas (Antônio Meneghetti Faculdade).

## O que dá pra fazer

**Usuário**
- Cadastro com confirmação de e-mail e recuperação de senha
- Agenda do dia com as quadras lado a lado e os horários livres/ocupados
- Pedido de reserva avulsa ou de horário fixo (recorrente)
- Lista de espera quando o horário já está ocupado
- Histórico das próprias reservas e troca de mensagens com a administração

**Administração**
- Aprovar/recusar pedidos, inclusive substituindo uma reserva já confirmada
- Calendário geral e relatórios (taxa de aceite, presença/falta, etc.)
- Regras configuráveis: limite de reservas por semana, antecedência mínima/máxima, fila de espera
- Eventos fixos semanais (treinos) e fechamento do ginásio em datas específicas
- Gestão de usuários e trilha de auditoria das ações

As decisões de agendamento disparam e-mail automático para o aluno (aceito, recusado, cancelado ou chamado da fila de espera).

## Tecnologias

- [Next.js 16](https://nextjs.org/) (App Router) e React 19
- TypeScript
- Tailwind CSS v4
- Prisma com MongoDB
- iron-session + bcryptjs para autenticação
- [Resend](https://resend.com/) para envio de e-mails

## Rodando localmente

Pré-requisitos: Node 20+ e um banco MongoDB (local ou Atlas).

```bash
git clone <url-do-repositorio>
cd CEAM
npm install
```

Crie um arquivo `.env` na raiz:

```env
DATABASE_URL="sua-string-de-conexao-mongodb"
SESSION_SECRET="uma-chave-secreta-de-pelo-menos-32-caracteres"

# Envio de e-mails (Resend)
RESEND_API_KEY="re_sua_chave"
EMAIL_FROM="CEAM <onboarding@resend.dev>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Gere o cliente do Prisma e sincronize o schema com o banco:

```bash
npx prisma generate
npx prisma db push
```

E suba o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação fica em `http://localhost:3000`.

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão do MongoDB |
| `SESSION_SECRET` | Segredo dos cookies de sessão (mínimo 32 caracteres) |
| `RESEND_API_KEY` | Chave da API do Resend. Sem ela, os e-mails só são registrados no log e não são enviados |
| `EMAIL_FROM` | Remetente dos e-mails |
| `NEXT_PUBLIC_APP_URL` | URL base usada nos links dos e-mails. Em produção, aponte para a URL pública |

Sobre o Resend: usando o domínio de teste (`onboarding@resend.dev`), a entrega só funciona para o e-mail dono da conta. Para enviar a qualquer destinatário é preciso verificar um domínio próprio em [resend.com/domains](https://resend.com/domains) e ajustar o `EMAIL_FROM`.

## Administrador

Não há cadastro de administrador pela interface. Um usuário vira admin alterando o campo `isAdmin` para `true` no documento dele na coleção `User` (a confirmação de e-mail também precisa estar marcada para conseguir entrar).

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção |

## Estrutura

```
src/
  app/         rotas (login, dashboard, admin, recuperação de senha, API)
  actions/     server actions (auth, reservas, pedidos, relatórios...)
  components/  componentes da agenda e dos painéis do admin
  lib/         prisma, sessão, regras de agendamento, e-mail
  utils/       validações e helpers de data
prisma/
  schema.prisma
```

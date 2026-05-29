import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@ceam.com' },
    update: { passwordHash, isAdmin: true, name: 'Administrador' },
    create: {
      email: 'admin@ceam.com',
      passwordHash,
      name: 'Administrador',
      isAdmin: true,
    },
  });

  console.log('✅  Usuário admin criado: admin@ceam.com / admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

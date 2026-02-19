import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@gsf.org';
    const password = 'Admin@1234';
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password: hash,
            fullName: 'GSF Admin',
            role: Role.ADMIN,
        },
    });

    console.log('✅ Seeded test admin user:');
    console.log(`   Email:    ${user.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role:     ${user.role}`);
    console.log(`   ID:       ${user.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
    // --- Seed admin user ---
    const testEmail = 'admin@gsf.org';
    const testPassword = 'Admin@1234';
    const hashedPassword = await bcrypt.hash(testPassword, SALT_ROUNDS);

    const user = await prisma.user.upsert({
        where: { email: testEmail },
        update: {},
        create: {
            email: testEmail,
            password: hashedPassword,
            fullName: 'GSF Admin',
            role: Role.ADMIN,
        },
    });

    console.log('✅ Seeded test admin user:');
    console.log(`   Email:    ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Role:     ${user.role}`);
    console.log(`   ID:       ${user.id}`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

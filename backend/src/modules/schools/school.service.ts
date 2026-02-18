import { prisma } from '../../prisma/client';

export const listSchools = async () => {
    return prisma.school.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { students: true },
            },
        },
    });
};

export const getSchoolById = async (id: string) => {
    const school = await prisma.school.findUnique({
        where: { id },
        include: {
            students: {
                include: { parents: true },
                orderBy: { firstName: 'asc' },
            },
        },
    });
    if (!school) {
        const error = new Error('School not found') as Error & { statusCode?: number };
        error.statusCode = 404;
        throw error;
    }
    return school;
};

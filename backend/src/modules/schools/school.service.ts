import { prisma } from '../../prisma/client';

export const listSchools = async () => {
    return prisma.school.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { enrollments: true } },
        },
    });
};

export const getSchoolById = async (id: string) => {
    return prisma.school.findUnique({
        where: { id },
        include: {
            enrollments: {
                include: {
                    student: {
                        include: {
                            family: { include: { centre: true } },
                        },
                    },
                },
                orderBy: { academicYear: 'desc' },
            },
        },
    });
};

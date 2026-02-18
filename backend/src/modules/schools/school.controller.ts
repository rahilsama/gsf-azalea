import type { Request, Response, NextFunction } from 'express';
import { listSchools, getSchoolById } from './school.service';

export const listSchoolsHandler = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const schools = await listSchools();
        res.json(schools);
    } catch (err) {
        next(err);
    }
};

export const getSchoolByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const school = await getSchoolById(req.params.id);
        res.json(school);
    } catch (err) {
        next(err);
    }
};

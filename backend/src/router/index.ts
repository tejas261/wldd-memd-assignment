import { Router } from 'express';
import authRouter from './auth';
import campaignRouter from './campaigns';
import submissionRouter from './submissions';
import creatorRouter from './creator';

export const router = Router();

router.use('/auth', authRouter);
router.use('/campaigns', campaignRouter);
router.use('/submissions', submissionRouter);
router.use('/creator', creatorRouter);

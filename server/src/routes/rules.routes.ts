// ============================================
// Rules Routes
// ============================================

import { Router } from 'express';
import { sendSuccess, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';

const router = Router();

// Get all active rules (public)
router.get('/', async (req, res) => {
  try {
    const rules = await prisma.rule.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { order: 'asc' },
      ],
    });

    sendSuccess(res, rules);
  } catch (error) {
    errors.serverError(res);
  }
});

export default router;


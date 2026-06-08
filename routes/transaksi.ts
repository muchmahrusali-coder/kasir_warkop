import express from 'express';
import {
  getTransaksi,
  getTransaksiById,
  createTransaksi,
  deleteTransaksi,
  getDashboardStats,
} from '../controllers/transaksiController.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

// Dashboard Summary Stats
router.get('/stats', authenticateToken, getDashboardStats);

// Transaction History CRUD
router.get('/', authenticateToken, getTransaksi);
router.get('/:id', authenticateToken, getTransaksiById);
router.post('/', authenticateToken, createTransaksi);
router.delete('/:id', authenticateToken, deleteTransaksi);

export default router;

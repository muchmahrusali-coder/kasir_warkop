import express from 'express';
import {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  getCategories,
} from '../controllers/menuController.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

// Categories
router.get('/categories', authenticateToken, getCategories);

// Menu CRUD
router.get('/', authenticateToken, getMenus);
router.get('/:id', authenticateToken, getMenuById);
router.post('/', authenticateToken, createMenu);
router.put('/:id', authenticateToken, updateMenu);
router.delete('/:id', authenticateToken, deleteMenu);

export default router;

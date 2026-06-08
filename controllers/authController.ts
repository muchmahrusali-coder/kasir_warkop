import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'warkop_maju_jaya_secret_key';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Username dan password wajib diisi!' });
      return;
    }

    // Query database for user
    const users = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (!users || users.length === 0) {
      res.status(401).json({ message: 'Username tidak ditemukan!' });
      return;
    }

    const user = users[0];
    // Compare password using bcrypt
    const isMatched = bcrypt.compareSync(password, user.password_hash || user.password);

    if (!isMatched) {
      res.status(401).json({ message: 'Password salah!' });
      return;
    }

    // Create JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role || 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'admin',
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan sistem saat memproses login.' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ message: 'Logout berhasil! Hapus token dari penyimpanan lokal.' });
};

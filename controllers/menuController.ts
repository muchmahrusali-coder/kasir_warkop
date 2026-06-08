import { Request, Response } from 'express';
import db, { readLocalDB } from '../config/db.ts';

export const getMenus = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchQuery = req.query.q ? String(req.query.q).toLowerCase() : '';
    const categoryFilter = req.query.category ? Number(req.query.category) : null;

    // Fetch menus and categories
    const menus = await db.query('SELECT * FROM menu');
    const categories = await db.query('SELECT * FROM kategori');

    const categoryMap = new Map<number, string>();
    categories.forEach((cat: any) => {
      categoryMap.set(cat.id, cat.nama_kategori);
    });

    // Map categories to menus
    let results = menus.map((menu: any) => ({
      ...menu,
      harga: Number(menu.harga),
      stok: Number(menu.stok),
      kategori_nama: categoryMap.get(Number(menu.kategori_id)) || 'Lain-lain',
    }));

    // Filter by search query
    if (searchQuery) {
      results = results.filter((m: any) =>
        m.nama_menu.toLowerCase().includes(searchQuery) ||
        m.kategori_nama.toLowerCase().includes(searchQuery)
      );
    }

    // Filter by category ID
    if (categoryFilter) {
      results = results.filter((m: any) => Number(m.kategori_id) === categoryFilter);
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('getMenus error:', error);
    res.status(500).json({ message: 'Gagal mengambil data menu.' });
  }
};

export const getMenuById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const menus = await db.query('SELECT * FROM menu WHERE id = ?', [id]);

    if (!menus || menus.length === 0) {
      res.status(404).json({ message: 'Menu tidak ditemukan.' });
      return;
    }

    const categories = await db.query('SELECT * FROM kategori');
    const category = categories.find((cat: any) => cat.id === Number(menus[0].kategori_id));

    res.status(200).json({
      ...menus[0],
      harga: Number(menus[0].harga),
      stok: Number(menus[0].stok),
      kategori_nama: category?.nama_kategori || 'Lain-lain',
    });
  } catch (error) {
    console.error('getMenuById error:', error);
    res.status(500).json({ message: 'Gagal mengambil data detail menu.' });
  }
};

export const createMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nama_menu, kategori_id, harga, stok, foto } = req.body;

    if (!nama_menu || !kategori_id || harga === undefined || stok === undefined) {
      res.status(400).json({ message: 'Semua field (nama_menu, kategori_id, harga, stok) harus diisi!' });
      return;
    }

    const parsedKategoriId = Number(kategori_id);
    const parsedHarga = Number(harga);
    const parsedStok = Number(stok);

    const defaultImages: Record<number, string> = {
      1: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop', // Kopi
      2: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?q=80&w=800&auto=format&fit=crop', // Minuman
      3: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop', // Makanan
      4: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop', // Snack
    };

    const finalFoto = foto || defaultImages[parsedKategoriId] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop';

    const result = await db.query(
      'INSERT INTO menu (nama_menu, kategori_id, harga, stok, foto) VALUES (?, ?, ?, ?, ?)',
      [nama_menu, parsedKategoriId, parsedHarga, parsedStok, finalFoto]
    );

    res.status(201).json({
      message: 'Menu berhasil ditambahkan!',
      menuId: result.insertId,
    });
  } catch (error) {
    console.error('createMenu error:', error);
    res.status(500).json({ message: 'Gagal menambahkan menu baru.' });
  }
};

export const updateMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nama_menu, kategori_id, harga, stok, foto } = req.body;

    if (!nama_menu || !kategori_id || harga === undefined || stok === undefined) {
      res.status(400).json({ message: 'Semua field (nama_menu, kategori_id, harga, stok) harus diisi!' });
      return;
    }

    const parsedKategoriId = Number(kategori_id);
    const parsedHarga = Number(harga);
    const parsedStok = Number(stok);

    const result = await db.query(
      'UPDATE menu SET nama_menu = ?, kategori_id = ?, harga = ?, stok = ?, foto = ? WHERE id = ?',
      [nama_menu, parsedKategoriId, parsedHarga, parsedStok, foto, Number(id)]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Menu tidak ditemukan atau tidak ada perubahan data.' });
      return;
    }

    res.status(200).json({ message: 'Menu berhasil diperbarui!' });
  } catch (error) {
    console.error('updateMenu error:', error);
    res.status(500).json({ message: 'Gagal memperbarui menu.' });
  }
};

export const deleteMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM menu WHERE id = ?', [Number(id)]);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Menu tidak ditemukan.' });
      return;
    }

    res.status(200).json({ message: 'Menu berhasil dihapus!' });
  } catch (error) {
    console.error('deleteMenu error:', error);
    res.status(500).json({ message: 'Gagal menghapus menu.' });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await db.query('SELECT * FROM kategori');
    res.status(200).json(categories);
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ message: 'Gagal mengambil kategori.' });
  }
};

import { Response } from 'express';
import db, { readLocalDB } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export const getTransaksi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const transaksiRaw = await db.query('SELECT * FROM transaksi');
    
    // Fetch details and menu info
    const details = await db.query('SELECT * FROM detail_transaksi');
    const menus = await db.query('SELECT * FROM menu');
    
    const menuMap = new Map<number, string>();
    menus.forEach((m: any) => {
      menuMap.set(m.id, m.nama_menu);
    });

    const enrichedTransactions = transaksiRaw.map((t: any) => {
      const tDetails = details
        .filter((d: any) => Number(d.transaksi_id) === Number(t.id))
        .map((d: any) => ({
          ...d,
          id: Number(d.id),
          transaksi_id: Number(d.transaksi_id),
          menu_id: Number(d.menu_id),
          qty: Number(d.qty),
          harga: Number(d.harga),
          subtotal: Number(d.subtotal),
          nama_menu: menuMap.get(Number(d.menu_id)) || 'Menu Tidak Diketahui',
        }));

      return {
        ...t,
        id: Number(t.id),
        total: Number(t.total),
        bayar: Number(t.bayar),
        kembalian: Number(t.kembalian),
        details: tDetails,
      };
    });

    // Sort newest first
    enrichedTransactions.sort((a: any, b: any) => b.id - a.id);

    res.status(200).json(enrichedTransactions);
  } catch (error) {
    console.error('getTransaksi error:', error);
    res.status(500).json({ message: 'Gagal mengambil riwayat transaksi.' });
  }
};

export const getTransaksiById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const transactions = await db.query('SELECT * FROM transaksi WHERE id = ?', [id]);
    if (!transactions || transactions.length === 0) {
      res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
      return;
    }

    const transaction = transactions[0];

    // Fetch details
    const details = await db.query('SELECT * FROM detail_transaksi WHERE transaksi_id = ?', [id]);
    
    // Fetch menu info to resolve menu names
    const menus = await db.query('SELECT * FROM menu');
    const menuMap = new Map<number, string>();
    menus.forEach((m: any) => {
      menuMap.set(m.id, m.nama_menu);
    });

    const enrichedDetails = details.map((d: any) => ({
      ...d,
      qty: Number(d.qty),
      harga: Number(d.harga),
      subtotal: Number(d.subtotal),
      nama_menu: menuMap.get(Number(d.menu_id)) || 'Menu Tidak Diketahui',
    }));

    res.status(200).json({
      ...transaction,
      id: Number(transaction.id),
      total: Number(transaction.total),
      bayar: Number(transaction.bayar),
      kembalian: Number(transaction.kembalian),
      details: enrichedDetails,
    });
  } catch (error) {
    console.error('getTransaksiById error:', error);
    res.status(500).json({ message: 'Gagal mengambil detail transaksi.' });
  }
};

export const createTransaksi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { total, bayar, kembalian, cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      res.status(400).json({ message: 'Keranjang belanja kosong!' });
      return;
    }

    if (total === undefined || bayar === undefined || kembalian === undefined) {
      res.status(400).json({ message: 'Total, bayar, dan kembalian harus valid!' });
      return;
    }

    if (Number(bayar) < Number(total)) {
      res.status(400).json({ message: 'Nominal pembayaran kurang!' });
      return;
    }

    // Double check stock check. Since we are full-stack, let's keep database checks real!
    const menus = await db.query('SELECT * FROM menu');
    const menuStockMap = new Map<number, { stok: number, nama_menu: string }>();
    menus.forEach((m: any) => {
      menuStockMap.set(m.id, { stok: Number(m.stok), nama_menu: m.nama_menu });
    });

    for (const item of cart) {
      const dbItem = menuStockMap.get(Number(item.menu_id));
      if (!dbItem) {
        res.status(400).json({ message: `Menu dengan ID ${item.menu_id} tidak ditemukan!` });
        return;
      }
      if (dbItem.stok < Number(item.qty)) {
        res.status(400).json({ message: `Stok "${dbItem.nama_menu}" tidak mencukupi! Tersisa: ${dbItem.stok}. Porsi dipesan: ${item.qty}` });
        return;
      }
    }

    // Insert Header Transaksi
    const txResult = await db.query(
      'INSERT INTO transaksi (total, bayar, kembalian) VALUES (?, ?, ?)',
      [Number(total), Number(bayar), Number(kembalian)]
    );
    
    const transaksiId = txResult.insertId;

    // Insert Details
    for (const item of cart) {
      await db.query(
        'INSERT INTO detail_transaksi (transaksi_id, menu_id, qty, harga, subtotal) VALUES (?, ?, ?, ?, ?)',
        [transaksiId, Number(item.menu_id), Number(item.qty), Number(item.harga), Number(item.subtotal)]
      );
    }

    res.status(201).json({
      message: 'Transaksi berhasil disimpan!',
      transaksiId,
    });
  } catch (error) {
    console.error('createTransaksi error:', error);
    res.status(500).json({ message: 'Gagal memproses transaksi.' });
  }
};

export const deleteTransaksi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM transaksi WHERE id = ?', [Number(id)]);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
      return;
    }

    res.status(200).json({ message: 'Transaksi berhasil dihapus!' });
  } catch (error) {
    console.error('deleteTransaksi error:', error);
    res.status(500).json({ message: 'Gagal menghapus transaksi.' });
  }
};

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const menus = await db.query('SELECT * FROM menu');
    const transactions = await db.query('SELECT * FROM transaksi');
    const details = await db.query('SELECT * FROM detail_transaksi');

    // Filter transactions and revenue made today
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    let todayTransactions = 0;
    let todayRevenue = 0;

    transactions.forEach((tx: any) => {
      const txDateStr = new Date(tx.tanggal || tx.created_at).toISOString().split('T')[0];
      if (txDateStr === todayStr) {
        todayTransactions++;
        todayRevenue += Number(tx.total);
      }
    });

    // Calculate most popular item(s)
    const menuSalesMap = new Map<number, number>();
    details.forEach((d: any) => {
      const mid = Number(d.menu_id);
      const qty = Number(d.qty);
      menuSalesMap.set(mid, (menuSalesMap.get(mid) || 0) + qty);
    });

    let bestSellerMenuId: number | null = null;
    let maxQty = 0;
    menuSalesMap.forEach((qty, mid) => {
      if (qty > maxQty) {
        maxQty = qty;
        bestSellerMenuId = mid;
      }
    });

    let bestSellerMenuName = 'Belum Ada';
    if (bestSellerMenuId !== null) {
      const matched = menus.find((m: any) => m.id === bestSellerMenuId);
      if (matched) {
        bestSellerMenuName = `${matched.nama_menu} (${maxQty} Porsi)`;
      }
    }

    res.status(200).json({
      totalMenu: menus.length,
      todayTransactions,
      todayRevenue,
      bestSellerMenu: bestSellerMenuName,
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ message: 'Gagal membuat ringkasan dashboard.' });
  }
};

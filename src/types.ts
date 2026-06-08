export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Kategori {
  id: number;
  nama_kategori: string;
}

export interface Menu {
  id: number;
  nama_menu: string;
  kategori_id: number;
  harga: number;
  stok: number;
  foto: string;
  kategori_nama?: string;
  created_at?: string;
}

export interface CartItem {
  menu_id: number;
  nama_menu: string;
  harga: number;
  qty: number;
  subtotal: number;
  foto?: string;
}

export interface Transaksi {
  id: number;
  tanggal: string;
  total: number;
  bayar: number;
  kembalian: number;
}

export interface TransaksiDetail {
  id: number;
  transaksi_id: number;
  menu_id: number;
  qty: number;
  harga: number;
  subtotal: number;
  nama_menu: string;
}

export interface EnrichedTransaksi extends Transaksi {
  details?: TransaksiDetail[];
}

export interface DashboardStats {
  totalMenu: number;
  todayTransactions: number;
  todayRevenue: number;
  bestSellerMenu: string;
}

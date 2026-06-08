import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const isMySQLConfigured = (): boolean => {
  return !!(
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_NAME
  );
};

let mysqlPool: mysql.Pool | null = null;

if (isMySQLConfigured()) {
  try {
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log('Connected to MySQL Database via mysql2 Pool');
  } catch (error) {
    console.error('Failed to initialize MySQL pool, falling back to Local JSON DB:', error);
  }
}

// ---- LOCAL FILE DATABASE IMPLEMENTATION (Fallback) ----
const localDbDir = path.resolve(process.cwd(), 'database');
const localDbPath = path.resolve(localDbDir, 'local_db.json');

interface User {
  id: number;
  username: string;
  password_hash: string;
  role: string;
  created_at: string;
}

interface Kategori {
  id: number;
  nama_kategori: string;
}

interface Menu {
  id: number;
  nama_menu: string;
  kategori_id: number;
  harga: number;
  stok: number;
  foto: string;
  created_at: string;
}

interface Transaksi {
  id: number;
  tanggal: string;
  total: number;
  bayar: number;
  kembalian: number;
}

interface DetailTransaksi {
  id: number;
  transaksi_id: number;
  menu_id: number;
  qty: number;
  harga: number;
  subtotal: number;
}

interface DBStructure {
  users: User[];
  kategori: Kategori[];
  menu: Menu[];
  transaksi: Transaksi[];
  detail_transaksi: DetailTransaksi[];
}

function getInitialDB(): DBStructure {
  // Generate bcrypt hash dynamically on seed to prevent issues
  const hashedAdminPassword = bcrypt.hashSync('admin', 10);
  
  return {
    users: [
      {
        id: 1,
        username: 'admin',
        password_hash: hashedAdminPassword,
        role: 'admin',
        created_at: new Date().toISOString(),
      },
    ],
    kategori: [
      { id: 1, nama_kategori: 'Kopi' },
      { id: 2, nama_kategori: 'Minuman' },
      { id: 3, nama_kategori: 'Makanan' },
      { id: 4, nama_kategori: 'Snack' },
    ],
    menu: [
      {
        id: 1,
        nama_menu: 'Kopi Hitam Tubruk',
        kategori_id: 1,
        harga: 8000,
        stok: 50,
        foto: '/src/assets/images/kopi_hitam_tubruk_1780812200552.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        nama_menu: 'Kopi Susu Gula Aren',
        kategori_id: 1,
        harga: 12000,
        stok: 40,
        foto: '/src/assets/images/kopi_susu_gula_aren_1780812216334.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        nama_menu: 'Es Teh Manis',
        kategori_id: 2,
        harga: 5000,
        stok: 100,
        foto: '/src/assets/images/es_teh_manis_1780812232366.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 4,
        nama_menu: 'Indomie Goreng Double + Telur',
        kategori_id: 3,
        harga: 13000,
        stok: 30,
        foto: '/src/assets/images/indomie_goreng_egg_1780811525708.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 5,
        nama_menu: 'Pisang Goreng Coklat Keju',
        kategori_id: 4,
        harga: 10000,
        stok: 25,
        foto: '/src/assets/images/pisang_goreng_coklat_keju_1780812249899.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 6,
        nama_menu: 'Josua (Extra Joss Susu)',
        kategori_id: 2,
        harga: 7000,
        stok: 50,
        foto: '/src/assets/images/josua_energy_milk_1780810984488.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 7,
        nama_menu: 'Espresso Single Shot',
        kategori_id: 1,
        harga: 6000,
        stok: 60,
        foto: '/src/assets/images/espresso_single_1780812658853.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 8,
        nama_menu: 'Cappuccino Creamy',
        kategori_id: 1,
        harga: 14000,
        stok: 40,
        foto: '/src/assets/images/cappuccino_creamy_1780812675435.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 9,
        nama_menu: 'Mocha Latte Caramel',
        kategori_id: 1,
        harga: 15000,
        stok: 35,
        foto: '/src/assets/images/mocha_latte_caramel_1780812691015.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 10,
        nama_menu: 'Caramel Macchiato',
        kategori_id: 1,
        harga: 16000,
        stok: 30,
        foto: '/src/assets/images/caramel_macchiato_1780812704541.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 11,
        nama_menu: 'Kopi V60 Manual Brew',
        kategori_id: 1,
        harga: 13000,
        stok: 25,
        foto: '/src/assets/images/kopi_v60_brew_1780812718882.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 12,
        nama_menu: 'Es Jeruk Peras',
        kategori_id: 2,
        harga: 7000,
        stok: 80,
        foto: '/src/assets/images/es_jeruk_peras_1780812265878.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 13,
        nama_menu: 'Jus Alpukat Nutella',
        kategori_id: 2,
        harga: 12000,
        stok: 35,
        foto: '/src/assets/images/jus_alpukat_nutella_1780812102006.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 14,
        nama_menu: 'Teh Tarik Selasih',
        kategori_id: 2,
        harga: 8000,
        stok: 50,
        foto: '/src/assets/images/teh_tarik_selasih_1780812186430.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 15,
        nama_menu: 'Soda Gembira Pink',
        kategori_id: 2,
        harga: 10000,
        stok: 40,
        foto: '/src/assets/images/soda_gembira_pink_1780812082714.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 16,
        nama_menu: 'Es Kelapa Muda Segar',
        kategori_id: 2,
        harga: 9000,
        stok: 45,
        foto: '/src/assets/images/es_kelapa_muda_1780812737799.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 17,
        nama_menu: 'Nasi Goreng Spesial Warkop',
        kategori_id: 3,
        harga: 15000,
        stok: 40,
        foto: '/src/assets/images/nasi_goreng_spesial_1780812751201.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 18,
        nama_menu: 'Mie Instan Kuah Pedas Telur',
        kategori_id: 3,
        harga: 10000,
        stok: 60,
        foto: '/src/assets/images/mie_kuah_pedas_1780812764613.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 19,
        nama_menu: 'Magelangan Istimewa',
        kategori_id: 3,
        harga: 14000,
        stok: 35,
        foto: '/src/assets/images/magelangan_istimewa_1780812117804.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 20,
        nama_menu: 'Ayam Goreng Penyet',
        kategori_id: 3,
        harga: 18000,
        stok: 30,
        foto: '/src/assets/images/ayam_penyet_1780812779055.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 21,
        nama_menu: 'Roti Bakar Bandung Coklat Keju',
        kategori_id: 3,
        harga: 11000,
        stok: 30,
        foto: '/src/assets/images/roti_bakar_bandung_1780812134227.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 22,
        nama_menu: 'Tempe Mendoan Anget',
        kategori_id: 4,
        harga: 8000,
        stok: 50,
        foto: '/src/assets/images/tempe_mendoan_1780812792593.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 23,
        nama_menu: 'Cireng Rujak Pedas',
        kategori_id: 4,
        harga: 8000,
        stok: 45,
        foto: '/src/assets/images/cireng_rujak_pedas_1780812150893.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 24,
        nama_menu: 'Kentang Goreng Krispi',
        kategori_id: 4,
        harga: 9500,
        stok: 40,
        foto: '/src/assets/images/kentang_goreng_1780812807882.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 25,
        nama_menu: 'Sosis Bakar Jumbo',
        kategori_id: 4,
        harga: 10000,
        stok: 30,
        foto: '/src/assets/images/sosis_bakar_1780812822885.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 26,
        nama_menu: 'Singkong Goreng Keju',
        kategori_id: 4,
        harga: 9000,
        stok: 35,
        foto: '/src/assets/images/singkong_goreng_keju_1780812167306.png',
        created_at: new Date().toISOString(),
      },
    ],
    transaksi: [],
    detail_transaksi: [],
  };
}

export const readLocalDB = (): DBStructure => {
  if (!fs.existsSync(localDbDir)) {
    fs.mkdirSync(localDbDir, { recursive: true });
  }
  if (!fs.existsSync(localDbPath)) {
    const freshDb = getInitialDB();
    fs.writeFileSync(localDbPath, JSON.stringify(freshDb, null, 2), 'utf-8');
    return freshDb;
  }
  try {
    const data = fs.readFileSync(localDbPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local JSON DB, resetting to defaults:', err);
    const freshDb = getInitialDB();
    fs.writeFileSync(localDbPath, JSON.stringify(freshDb, null, 2), 'utf-8');
    return freshDb;
  }
};

export const writeLocalDB = (data: DBStructure): void => {
  if (!fs.existsSync(localDbDir)) {
    fs.mkdirSync(localDbDir, { recursive: true });
  }
  fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), 'utf-8');
};

// Generic query proxy that mimics standard database client calls
export const db = {
  // Query for both MySQL and the local fell-back database
  query: async (sqlText: string, params: any[] = []): Promise<any> => {
    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.query(sqlText, params);
        return rows;
      } catch (err) {
        console.error('MySQL query error, using local fallback:', err);
      }
    }

    // fallback query implementation mimicking standard table structures
    const data = readLocalDB();
    const cleanSql = sqlText.trim().replace(/\s+/g, ' ').toLowerCase();

    // 1. Authenticate / Users
    if (cleanSql.includes('select * from users') || cleanSql.includes('select * from `users`')) {
      if (cleanSql.includes('where username =')) {
        const usernameParam = params[0];
        const matched = data.users.find(u => u.username.toLowerCase() === String(usernameParam).toLowerCase());
        return matched ? [matched] : [];
      }
      return data.users;
    }

    // 2. Kategori list
    if (cleanSql.includes('select * from kategori') || cleanSql.includes('select * from `kategori`')) {
      return data.kategori;
    }

    // 3. Menu queries
    if (cleanSql.includes('select * from menu') || cleanSql.includes('select * from `menu`')) {
      // Check if detail with ID is requested
      if (cleanSql.includes('where id =')) {
        const idParam = Number(params[0]);
        const matched = data.menu.find(m => m.id === idParam);
        return matched ? [matched] : [];
      }
      // Return menus
      return data.menu;
    }

    // 4. Transaksi list queries
    if (cleanSql.includes('select * from transaksi') || cleanSql.includes('select * from `transaksi`')) {
      if (cleanSql.includes('where id =')) {
        const idParam = Number(params[0]);
        const matched = data.transaksi.find(t => t.id === idParam);
        return matched ? [matched] : [];
      }
      // Sort reverse by default (newest transactions)
      return [...data.transaksi].sort((a, b) => b.id - a.id);
    }

    // 5. Detail_transaksi queries
    if (cleanSql.includes('select * from detail_transaksi') || cleanSql.includes('select * from `detail_transaksi`')) {
      if (cleanSql.includes('where transaksi_id =')) {
        const txId = Number(params[0]);
        return data.detail_transaksi.filter(d => d.transaksi_id === txId);
      }
      return data.detail_transaksi;
    }

    // Insert user
    if (cleanSql.includes('insert into users')) {
      const newUser: User = {
        id: data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1,
        username: params[0],
        password_hash: params[1],
        role: params[2] || 'user',
        created_at: new Date().toISOString(),
      };
      data.users.push(newUser);
      writeLocalDB(data);
      return { insertId: newUser.id, affectedRows: 1 };
    }

    // Insert menu
    if (cleanSql.includes('insert into menu')) {
      // params ordered by request (nama_menu, kategori_id, harga, stok, foto)
      const newMenu: Menu = {
        id: data.menu.length > 0 ? Math.max(...data.menu.map(m => m.id)) + 1 : 1,
        nama_menu: params[0],
        kategori_id: Number(params[1]),
        harga: Number(params[2]),
        stok: Number(params[3]),
        foto: params[4] || '',
        created_at: new Date().toISOString(),
      };
      data.menu.push(newMenu);
      writeLocalDB(data);
      return { insertId: newMenu.id, affectedRows: 1 };
    }

    // Update menu
    if (cleanSql.includes('update menu') || cleanSql.includes('update `menu`')) {
      // params: [nama_menu, kategori_id, harga, stok, foto, id]
      const idParam = Number(params[5]);
      const idx = data.menu.findIndex(m => m.id === idParam);
      if (idx !== -1) {
        data.menu[idx] = {
          ...data.menu[idx],
          nama_menu: params[0],
          kategori_id: Number(params[1]),
          harga: Number(params[2]),
          stok: Number(params[3]),
          foto: params[4] || data.menu[idx].foto,
        };
        writeLocalDB(data);
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }

    // Delete menu
    if (cleanSql.includes('delete from menu') || cleanSql.includes('delete from `menu`')) {
      const idParam = Number(params[0]);
      const initialLength = data.menu.length;
      data.menu = data.menu.filter(m => m.id !== idParam);
      writeLocalDB(data);
      return { affectedRows: initialLength - data.menu.length };
    }

    // Insert transaksi
    if (cleanSql.includes('insert into transaksi')) {
      // params: [total, bayar, kembalian]
      const newTx: Transaksi = {
        id: data.transaksi.length > 0 ? Math.max(...data.transaksi.map(t => t.id)) + 1 : 1,
        tanggal: new Date().toISOString(),
        total: Number(params[0]),
        bayar: Number(params[1]),
        kembalian: Number(params[2]),
      };
      data.transaksi.push(newTx);
      writeLocalDB(data);
      return { insertId: newTx.id, affectedRows: 1 };
    }

    // Insert detail_transaksi
    if (cleanSql.includes('insert into detail_transaksi')) {
      // params: [transaksi_id, menu_id, qty, harga, subtotal]
      const newDetail: DetailTransaksi = {
        id: data.detail_transaksi.length > 0 ? Math.max(...data.detail_transaksi.map(d => d.id)) + 1 : 1,
        transaksi_id: Number(params[0]),
        menu_id: Number(params[1]),
        qty: Number(params[2]),
        harga: Number(params[3]),
        subtotal: Number(params[4]),
      };

      // Deduct stock from index
      const menuIdx = data.menu.findIndex(m => m.id === newDetail.menu_id);
      if (menuIdx !== -1) {
        data.menu[menuIdx].stok = Math.max(0, data.menu[menuIdx].stok - newDetail.qty);
      }

      data.detail_transaksi.push(newDetail);
      writeLocalDB(data);
      return { insertId: newDetail.id, affectedRows: 1 };
    }

    // Delete transaksi
    if (cleanSql.includes('delete from transaksi') || cleanSql.includes('delete from `transaksi`')) {
      const idParam = Number(params[0]);
      
      // Also delete detail_transaksi for consistency
      data.detail_transaksi = data.detail_transaksi.filter(d => d.transaksi_id !== idParam);
      
      const initialLength = data.transaksi.length;
      data.transaksi = data.transaksi.filter(t => t.id !== idParam);
      writeLocalDB(data);
      return { affectedRows: initialLength - data.transaksi.length };
    }

    return [];
  },
};
export default db;

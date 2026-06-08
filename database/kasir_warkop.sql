-- =======================================================
-- DATABASES & TABLES SEEDER FOR KASIR WARKOP MAJU JAYA
-- =======================================================

-- 1. Create and Use Database
CREATE DATABASE IF NOT EXISTS kasir_warkop;
USE kasir_warkop;

-- 2. Drop existing tables if they exist for clean migrations
DROP TABLE IF EXISTS detail_transaksi;
DROP TABLE IF EXISTS transaksi;
DROP TABLE IF EXISTS menu;
DROP TABLE IF EXISTS kategori;
DROP TABLE IF EXISTS users;

-- 3. Create Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create Kategori Table
CREATE TABLE kategori (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_kategori VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create Menu Table
CREATE TABLE menu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_menu VARCHAR(100) NOT NULL,
  kategori_id INT NOT NULL,
  harga DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stok INT NOT NULL DEFAULT 0,
  foto VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create Transaksi (Header) Table
CREATE TABLE transaksi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  bayar DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  kembalian DECIMAL(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Create Detail Transaksi Table
CREATE TABLE detail_transaksi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaksi_id INT NOT NULL,
  menu_id INT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  harga DECIMAL(10,2) NOT NULL NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL NOT NULL DEFAULT 0.00,
  FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =======================================================
-- INITIAL SEED RECORDS (DATA AWAL)
-- =======================================================

-- Seed Users (Default: admin / admin)
-- Password 'admin' is hashed using standard salt rounds (bcrypt)
INSERT INTO users (id, username, password, role) VALUES 
(1, 'admin', '$2a$10$fVqX0X754m1Nl8tU8gT/2eA6M3W1c08I.tC/t.bE99G4gVeeU4DCO', 'admin');

-- Seed Kategori
INSERT INTO kategori (id, nama_kategori) VALUES 
(1, 'Kopi'),
(2, 'Minuman'),
(3, 'Makanan'),
(4, 'Snack');

-- Seed Menu
INSERT INTO menu (id, nama_menu, kategori_id, harga, stok, foto) VALUES 
(1, 'Kopi Hitam Tubruk', 1, 8000.00, 50, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop'),
(2, 'Kopi Susu Gula Aren', 1, 12000.00, 40, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800&auto=format&fit=crop'),
(3, 'Es Teh Manis', 2, 5000.00, 100, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop'),
(4, 'Indomie Goreng Double + Telur', 3, 13000.00, 30, 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?q=80&w=800&auto=format&fit=crop'),
(5, 'Pisang Goreng Coklat Keju', 4, 10000.00, 25, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=800&auto=format&fit=crop');

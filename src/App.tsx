import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Menu as MenuIcon, 
  ShoppingBag, 
  Receipt, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Check, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  User as UserIcon, 
  Lock, 
  Printer, 
  X,
  CreditCard,
  ShoppingBag as CartIcon,
  RefreshCw,
  Eye,
  Sun,
  Moon
} from 'lucide-react';
import { 
  Menu, 
  Kategori, 
  CartItem, 
  EnrichedTransaksi, 
  DashboardStats 
} from './types.ts';

// Helper to format IDR Currency
const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      body?.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body?.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // Login Inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Layout Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kasir' | 'menu' | 'transaksi'>('dashboard');

  // Core Data States
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [transactions, setTransactions] = useState<EnrichedTransaksi[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalMenu: 0,
    todayTransactions: 0,
    todayRevenue: 0,
    bestSellerMenu: 'Memuat...'
  });

  // Loadings & Refresh triggers
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Search & Filters
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [txSearch, setTxSearch] = useState('');

  // Cashier State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [taxChecked, setTaxChecked] = useState(false);
  const [cashPayAmount, setCashPayAmount] = useState<string>('');
  const [cashierMenusSearch, setCashierMenusSearch] = useState('');
  const [selectedCashierCategory, setSelectedCashierCategory] = useState<number | null>(null);

  // Menu Form Modal State
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null);
  const [menuFormName, setMenuFormName] = useState('');
  const [menuFormCategory, setMenuFormCategory] = useState<number>(1);
  const [menuFormHarga, setMenuFormHarga] = useState<number>(0);
  const [menuFormStok, setMenuFormStok] = useState<number>(0);
  const [menuFormFoto, setMenuFormFoto] = useState('');

  // Receipt Modal and Print State
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [receiptDetailModalOpen, setReceiptDetailModalOpen] = useState(false);

  // Custom Confirmation Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger: boolean = true,
    confirmText: string = 'Hapus',
    cancelText: string = 'Batal'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText,
      cancelText,
      isDanger
    });
  };

  // General Notification Alert Banner
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Clear global notifications
  const triggerToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Setup Authorization headers
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Trigger loading on mount and authentication change
  useEffect(() => {
    if (token) {
      fetchCategories();
      fetchMenus();
      fetchDashboardStats();
      fetchTransactions();
    }
  }, [token, refreshTrigger]);

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/menu/categories', { headers: getHeaders() });
      if (response.status === 401 || response.status === 403) {
        handleClientLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch Menus
  const fetchMenus = async () => {
    setLoadingMenus(true);
    try {
      const response = await fetch('/api/menu', { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setMenus(data);
      }
    } catch (err) {
      console.error('Error fetching menus:', err);
      triggerToast('Gagal memuat daftar menu', 'error');
    } finally {
      setLoadingMenus(false);
    }
  };

  // Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch('/api/transaksi/stats', { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Transaction logs
  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const response = await fetch('/api/transaksi', { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoadingTx(false);
    }
  };

  // Handlers for Authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.message || 'Login gagal!');
        setLoginLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setUsername('');
      setPassword('');
      triggerToast('Selamat datang kembali, Kasir Admin!', 'success');
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Koneksi server gagal. Coba lagi.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleClientLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCart([]);
    triggerToast('Anda telah keluar dari aplikasi kasir.', 'success');
  };

  const handleLogoutFetch = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', headers: getHeaders() });
    } catch (err) {
      console.error('Logout API failure:', err);
    }
    handleClientLogout();
  };

  // Cashier Cart Mechanics
  const addToCart = (menuItem: Menu) => {
    if (menuItem.stok <= 0) {
      triggerToast(`Stok "${menuItem.nama_menu}" habis!`, 'error');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.menu_id === menuItem.id);
    if (existingIndex !== -1) {
      const itemInCart = cart[existingIndex];
      if (itemInCart.qty >= menuItem.stok) {
        triggerToast(`Stok mementori sisa stok menu (${menuItem.stok})!`, 'error');
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...itemInCart,
        qty: itemInCart.qty + 1,
        subtotal: (itemInCart.qty + 1) * itemInCart.harga
      };
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          menu_id: menuItem.id,
          nama_menu: menuItem.nama_menu,
          harga: menuItem.harga,
          qty: 1,
          subtotal: menuItem.harga,
          foto: menuItem.foto
        }
      ]);
    }
  };

  const updateCartQty = (menuId: number, diff: number) => {
    const itemIdx = cart.findIndex((i) => i.menu_id === menuId);
    if (itemIdx === -1) return;

    const item = cart[itemIdx];
    const originalMenu = menus.find((m) => m.id === menuId);
    if (!originalMenu) return;

    const newQty = item.qty + diff;

    if (newQty <= 0) {
      setCart(cart.filter((c) => c.menu_id !== menuId));
      return;
    }

    if (newQty > originalMenu.stok) {
      triggerToast(`Batas max stok tercapai (${originalMenu.stok})`, 'error');
      return;
    }

    const updated = [...cart];
    updated[itemIdx] = {
      ...item,
      qty: newQty,
      subtotal: newQty * item.harga
    };
    setCart(updated);
  };

  const deleteFromCart = (menuId: number) => {
    setCart(cart.filter((item) => item.menu_id !== menuId));
  };

  const clearCart = () => {
    setCart([]);
    setCashPayAmount('');
    setTaxChecked(false);
  };

  // Calculate Subtotals
  const cartSubtotal = cart.reduce((add, item) => add + item.subtotal, 0);
  const taxAmount = taxChecked ? Math.round(cartSubtotal * 0.1) : 0;
  const cartTotalPay = cartSubtotal + taxAmount;
  const cashChangeAmount = cashPayAmount && Number(cashPayAmount) >= cartTotalPay 
    ? Number(cashPayAmount) - cartTotalPay 
    : 0;

  // Process Transaction Checkout
  const handleCheckoutProcess = async () => {
    if (cart.length === 0) {
      triggerToast('Keranjang belanja masih kosong!', 'error');
      return;
    }
    const paymentNum = Number(cashPayAmount);
    if (!cashPayAmount || paymentNum < cartTotalPay) {
      triggerToast('Nominal pembayaran tunai tidak mencukupi atau tidak valid!', 'error');
      return;
    }

    try {
      const response = await fetch('/api/transaksi', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          total: cartTotalPay,
          bayar: paymentNum,
          kembalian: cashChangeAmount,
          cart: cart
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        triggerToast(resData.message || 'Gagal menyimpan transaksi', 'error');
        return;
      }

      // Fetch transaction with detailed records to trigger the printable layout
      const detailResponse = await fetch(`/api/transaksi/${resData.transaksiId}`, { headers: getHeaders() });
      if (detailResponse.ok) {
        const enrichedRecord = await detailResponse.json();
        setActiveReceipt(enrichedRecord);
      } else {
        // Fallback printable mockup
        setActiveReceipt({
          id: resData.transaksiId,
          tanggal: new Date().toISOString(),
          total: cartTotalPay,
          bayar: paymentNum,
          kembalian: cashChangeAmount,
          details: cart.map(item => ({
            nama_menu: item.nama_menu,
            qty: item.qty,
            harga: item.harga,
            subtotal: item.subtotal
          }))
        });
      }

      triggerToast('Checkout berhasil disimpan!', 'success');
      clearCart();
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Checkout error:', err);
      triggerToast('Gagal menghubungkan ke server checkout', 'error');
    }
  };

  // Execute Direct Receipt Print
  const triggerBrowserPrint = () => {
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Menu Management Modal handlers
  const openAddMenuModal = (initialName: any = '') => {
    setEditingMenuId(null);
    setMenuFormName(typeof initialName === 'string' ? initialName : '');
    setMenuFormCategory(categories[0]?.id || 1);
    setMenuFormHarga(0);
    setMenuFormStok(50);
    setMenuFormFoto('');
    setMenuModalOpen(true);
  };

  const openEditMenuModal = (menuItem: Menu) => {
    setEditingMenuId(menuItem.id);
    setMenuFormName(menuItem.nama_menu);
    setMenuFormCategory(menuItem.kategori_id);
    setMenuFormHarga(menuItem.harga);
    setMenuFormStok(menuItem.stok);
    setMenuFormFoto(menuItem.foto);
    setMenuModalOpen(true);
  };

  const handleMenuFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuFormName || menuFormHarga <= 0 || menuFormStok < 0) {
      triggerToast('Harap mengisi form menu dengan data valid!', 'error');
      return;
    }

    const payload = {
      nama_menu: menuFormName,
      kategori_id: menuFormCategory,
      harga: menuFormHarga,
      stok: menuFormStok,
      foto: menuFormFoto
    };

    try {
      const url = editingMenuId ? `/api/menu/${editingMenuId}` : '/api/menu';
      const method = editingMenuId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (!response.ok) {
        triggerToast(resData.message || 'Gagal menyimpan menu', 'error');
        return;
      }

      triggerToast(
        editingMenuId ? 'Data menu berhasil diperbarui!' : 'Menu baru berhasil ditambahkan!',
        'success'
      );
      setMenuModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Menu save error:', err);
      triggerToast('Kesalahan koneksi ke server untuk menyimpan menu', 'error');
    }
  };

  // Delete Menu Handler
  const handleDeleteMenuClick = (id: number, name: string) => {
    requestConfirmation(
      'Hapus Menu dari Katalog',
      `Apakah Anda yakin ingin menghapus menu "${name}" secara permanen dari daftar menu? Tindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          const response = await fetch(`/api/menu/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
          });

          if (!response.ok) {
            const errorData = await response.json();
            triggerToast(errorData.message || 'Gagal menghapus menu', 'error');
            return;
          }

          triggerToast(`Menu "${name}" berhasil dihapus`, 'success');
          setRefreshTrigger(prev => prev + 1);
        } catch (err) {
          console.error('Delete menu error:', err);
          triggerToast('Koneksi internet bermasalah atau gagal menghapus menu', 'error');
        }
      },
      true, // isDanger (red style button)
      'Ya, Hapus',
      'Batal'
    );
  };

  // Delete Transaction History Handler
  const handleDeleteTransactionClick = (id: number) => {
    requestConfirmation(
      'Hapus Catatan Transaksi',
      `Apakah Anda yakin ingin menghapus arsip catatan transaksi #${id}? Catatan ini akan dihapus secara permanen.`,
      async () => {
        try {
          const response = await fetch(`/api/transaksi/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
          });

          if (!response.ok) {
            triggerToast('Gagal menghapus catatan transaksi', 'error');
            return;
          }

          triggerToast(`Transaksi #${id} sukses dihapus`, 'success');
          setReceiptDetailModalOpen(false);
          setRefreshTrigger(prev => prev + 1);
        } catch (err) {
          console.error('Delete transaction error:', err);
          triggerToast('Koneksi internet bermasalah atau gagal menghapus transaksi', 'error');
        }
      },
      true, // isDanger (red style button)
      'Ya, Hapus',
      'Batal'
    );
  };

  // View Details of Transaction
  const handleViewReceiptDetails = async (txId: number) => {
    try {
      const response = await fetch(`/api/transaksi/${txId}`, { headers: getHeaders() });
      if (response.ok) {
        const fullDetails = await response.json();
        setActiveReceipt(fullDetails);
        setReceiptDetailModalOpen(true);
      } else {
        triggerToast('Gagal mengambil rincian detail', 'error');
      }
    } catch (err) {
      console.error('Fetch transaction detail error:', err);
    }
  };

  // Formatted Filters lists
  const filteredCatalogMenus = menus.filter((menu) => {
    const matchSearch = menu.nama_menu.toLowerCase().includes(menuSearch.toLowerCase()) || 
                       (menu.kategori_nama && menu.kategori_nama.toLowerCase().includes(menuSearch.toLowerCase()));
    const matchCategory = selectedCategoryFilter ? menu.kategori_id === selectedCategoryFilter : true;
    return matchSearch && matchCategory;
  });

  const filteredCashierMenus = menus.filter((menu) => {
    const matchSearch = menu.nama_menu.toLowerCase().includes(cashierMenusSearch.toLowerCase());
    const matchCategory = selectedCashierCategory ? menu.kategori_id === selectedCashierCategory : true;
    return matchSearch && matchCategory;
  });

  // Filtered transactions history listing
  const filteredTransactions = transactions.filter((tx) => {
    const query = txSearch.trim().toLowerCase();
    if (!query) return true;
    
    // Allow search by date, ID, numerical totals, or purchased menu names
    const matchId = String(tx.id).includes(query);
    const matchDate = new Date(tx.tanggal).toLocaleDateString('id-ID').includes(query);
    const matchTotal = String(tx.total).includes(query);
    const matchMenu = tx.details?.some(d => d.nama_menu.toLowerCase().includes(query)) || false;
    return matchId || matchDate || matchTotal || matchMenu;
  });

  // Renders Authentication screen
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-[#3c1e08]/10 via-[#221206]/5 to-[#f7f4ef] dark:from-[#3c1e08]/20 dark:via-[#120f0c]/90 dark:to-[#120f0c] px-4 py-12 transition-colors duration-300 relative">
        {/* Floating Theme Toggle in Login */}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#221c17] text-amber-400 border-[#382c21] hover:bg-[#32281f]'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            id="login-theme-toggle"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-[#1a1511] rounded-2xl shadow-xl shadow-amber-950/5 dark:shadow-none border border-amber-900/10 dark:border-[#282019] overflow-hidden transform transition duration-500 hover:scale-[1.01]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5c3015] to-[#3c1e08] p-8 text-center text-white relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
            <div className="inline-flex p-4 rounded-full bg-white/10 mb-4 animate-bounce">
              <Coffee className="w-10 h-10 text-amber-200" id="login-logo-coffee" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">KASIR WARKOP</h1>
            <p className="text-amber-100 text-xs mt-1 tracking-wider uppercase font-medium">Sistem Management & Kasir Modern</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="p-8 space-y-6">
            <h3 className="text-center font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-widest text-xs">Akses Masuk Admin</h3>
            {loginError && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/25 rounded-lg" id="alert-login-error">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">Username Admin</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4/12 max-w-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username (ex: admin)"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 dark:border-[#2f241c] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-stone-50 dark:bg-[#1f1914] text-stone-800 dark:text-stone-100 font-medium"
                    id="input-login-username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4/12 max-w-4 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password (ex: admin)"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 dark:border-[#2f241c] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-stone-50 dark:bg-[#1f1914] text-stone-800 dark:text-stone-100 font-medium"
                    id="input-login-password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#703b19] to-[#542a10] hover:from-[#542a10] hover:to-[#381a08] text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              id="btn-login-submit"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>

            <div className="text-center pt-2 text-stone-400 dark:text-stone-550 text-[10px] leading-relaxed">
              Default credentials untuk login demo:<br />
              <span className="font-semibold text-amber-800 dark:text-amber-400">username: admin | password: admin</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Active Screen Elements
  return (
    <div className="min-h-screen bg-[#fcfbfa] dark:bg-[#120f0c] flex flex-col md:flex-row text-[#2b221a] dark:text-[#f5f2eb] transition-colors duration-300" id="app-viewport">
      
      {/* 1. NOTIFICATION BANNER */}
      {toastMessage && (
        <div 
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 py-3 px-5 rounded-lg shadow-lg text-sm border font-medium/30 tracking-wide transition-all ${
            toastMessage.type === 'success' 
              ? 'bg-amber-50 dark:bg-[#201a14] text-amber-800 dark:text-amber-400 border-amber-200 dark:border-[#382d23]' 
              : 'bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-350 border-[#fed7d7] dark:border-red-900/20'
          }`}
          id="toast-alert"
        >
          {toastMessage.type === 'success' ? <Check className="w-5 h-5 text-amber-600 animate-pulse" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-3 hover:opacity-75 focus:outline-none text-[11px] font-bold">×</button>
        </div>
      )}

      {/* 2. SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-gradient-to-b from-[#2c1607] to-[#170902] text-amber-100 flex flex-col border-r border-[#3d1e0a] shrink-0" id="sidebar-navigation">
        <div className="p-6 border-b border-[#3d1e0a] flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 rounded-xl text-stone-950 shadow-md">
              <Coffee className="w-6 h-6 text-[#2c1607]" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base tracking-wide">WARKOP JACK</h2>
              <p className="text-[10px] text-amber-300 font-semibold tracking-widest uppercase mb-0.5">Bersama Jack Menuju IMO</p>
              <p className="text-[9px] text-[#cca98f] font-normal leading-none">Jl. Raya Tembok Ratapan Yerussolo</p>
            </div>
          </div>
          {/* Mobile User Profile Button */}
          <div className="md:hidden flex items-center gap-2">
            <span className="text-xs bg-[#ffffff10] px-2.5 py-1 rounded-full text-white font-medium flex items-center gap-1.5 border border-white/5">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
              {user?.username}
            </span>
          </div>
        </div>

        {/* Navigation lists */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-3.5 ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/40 relative font-bold'
                : 'hover:bg-[#ffffff08] text-amber-200/80 hover:text-white'
            }`}
            id="nav-link-dashboard"
          >
            <TrendingUp className="w-5 h-5 shrink-0" />
            <span>Dashboard</span>
            {activeTab === 'dashboard' && <span className="absolute right-3 w-1.5 h-1.5 bg-stone-950 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('kasir')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-3.5 ${
              activeTab === 'kasir'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/40 relative font-bold'
                : 'hover:bg-[#ffffff08] text-amber-200/80 hover:text-white'
            }`}
            id="nav-link-kasir"
          >
            <ShoppingBag className="w-5 h-5 shrink-0" />
            <span>Halaman Kasir</span>
            {activeTab === 'kasir' && <span className="absolute right-3 w-1.5 h-1.5 bg-stone-950 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-3.5 ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/40 relative font-bold'
                : 'hover:bg-[#ffffff08] text-amber-200/80 hover:text-white'
            }`}
            id="nav-link-menu"
          >
            <MenuIcon className="w-5 h-5 shrink-0" />
            <span>Kelola Menu</span>
            {activeTab === 'menu' && <span className="absolute right-3 w-1.5 h-1.5 bg-stone-950 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('transaksi')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-3.5 ${
              activeTab === 'transaksi'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/40 relative font-bold'
                : 'hover:bg-[#ffffff08] text-amber-200/80 hover:text-white'
            }`}
            id="nav-link-riwayat"
          >
            <Receipt className="w-5 h-5 shrink-0" />
            <span>Riwayat Transaksi</span>
            {activeTab === 'transaksi' && <span className="absolute right-3 w-1.5 h-1.5 bg-stone-950 rounded-full"></span>}
          </button>
        </nav>

        {/* Profile Footer and Log out */}
        <div className="p-4 border-t border-[#3d1e0a] bg-stone-950/30">
          <div className="hidden md:flex items-center gap-3 px-3 py-2.5 mb-3 bg-[#ffffff05] border border-white/5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-400">
              <UserIcon className="w-4 h-4 text-amber-400" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-white truncate">{user?.username || 'Administrator'}</h4>
              <p className="text-[10px] text-amber-400/80 uppercase font-semibold tracking-wider">Role Admin</p>
            </div>
          </div>
          
          <button
            onClick={handleLogoutFetch}
            className="w-full py-2.5 px-4 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-bold transition-colors flex items-center gap-3 cursor-pointer"
            id="btn-logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Kasir (Logout)</span>
          </button>
        </div>
      </aside>

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0" id="main-workspace">
        
        {/* Top Navbar */}
        <header className="bg-white dark:bg-[#1a1511] border-b border-stone-200/80 dark:border-[#282019] py-4 px-6 md:px-8 flex items-center justify-between shadow-stone-100 dark:shadow-none shadow-sm shrink-0 transition-colors duration-300">
          <div>
            <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100 capitalize tracking-wide transition-colors">
              {activeTab === 'dashboard' && 'Dashboard Analisis'}
              {activeTab === 'kasir' && 'Halaman Kasir Penjualan'}
              {activeTab === 'menu' && 'Kelola Katalog Menu'}
              {activeTab === 'transaksi' && 'Riwayat & Laporan Transaksi'}
            </h1>
            <p className="text-xs text-stone-300 dark:text-stone-550 mt-0.5 transition-colors">Warkop Jack • Bersama Jack Menuju IMO</p>
            <p className="text-[10px] text-stone-400 dark:text-stone-550 mt-1 leading-none transition-colors">Jl. Raya Tembok Ratapan Yerussolo</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#221c17] text-amber-400 border-[#382c21] hover:bg-[#32281f]'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              id="theme-toggle"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-[10px] text-stone-400 dark:text-stone-555">Status Database: <span className="font-semibold text-emerald-600 dark:text-emerald-505 uppercase">Terhubung</span></p>
              </div>
              <div className="h-8 w-px bg-stone-200 dark:bg-[#282019]"></div>
              <button 
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="p-2 text-stone-500 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-[#221c17] rounded-lg transition-all cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Core Pages Views */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8" id="page-content-host">
          
          {/* =========================================
              VIEW: DASHBOARD
             ========================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in" id="view-dashboard">
              {/* Header Banner Greeting */}
              <div className="bg-gradient-to-r from-[#703b19] to-[#3d1e0a] p-6 md:p-8 rounded-2xl text-white shadow-md shadow-amber-900/5 relative overflow-hidden" id="dashboard-banner">
                <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pr-8 pointer-events-none">
                  <Coffee className="w-56 h-56" />
                </div>
                <div className="max-w-xl space-y-2 relative">
                  <span className="text-[10px] px-2.5 py-1 bg-amber-500/20 text-amber-200 rounded-full border border-amber-300/10 font-bold tracking-widest uppercase">Admin Warkop Panel</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Selamat Datang, {user?.username}!</h2>
                  <p className="text-amber-100/90 text-xs md:text-sm leading-relaxed">
                    Aplikasi Kasir Warkop Jack siap digunakan. Bersama Jack Menuju IMO. Kelola persediaan stok kopi, catat penjualan, serta cetak struk kasir dengan praktis dan instan.
                  </p>
                </div>
              </div>

              {/* Bento Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="dashboard-analytics-bento">
                
                {/* Stat Tab 1: Total Menu */}
                <div className="bg-white dark:bg-[#1a1511] rounded-xl p-6 border border-stone-200/80 dark:border-[#282019] shadow-stone-100 dark:shadow-none shadow-md flex items-center gap-5 transition-all hover:translate-y-[-2px]" id="stat-card-total-menu">
                  <div className="p-4 bg-amber-500/10 text-amber-800 dark:text-amber-400 rounded-xl">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-stone-400 font-bold block mb-0.5">Total Menu</span>
                    {loadingStats ? (
                      <div className="h-6 w-16 bg-stone-200 dark:bg-stone-800 animate-pulse rounded"></div>
                    ) : (
                      <span className="text-2xl font-black text-stone-800 dark:text-stone-100 block leading-none">{stats.totalMenu} <span className="text-xs text-stone-400 font-normal">Menu</span></span>
                    )}
                  </div>
                </div>

                {/* Stat Tab 2: Total Tx Today */}
                <div className="bg-white dark:bg-[#1a1511] rounded-xl p-6 border border-stone-200/80 dark:border-[#282019] shadow-stone-100 dark:shadow-none shadow-md flex items-center gap-5 transition-all hover:translate-y-[-2px]" id="stat-card-total-tx">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-750 dark:text-emerald-400 rounded-xl">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-stone-400 font-bold block mb-0.5">Transaksi Hari Ini</span>
                    {loadingStats ? (
                      <div className="h-6 w-16 bg-stone-200 dark:bg-stone-800 animate-pulse rounded"></div>
                    ) : (
                      <span className="text-2xl font-black text-stone-800 dark:text-stone-100 block leading-none">{stats.todayTransactions} <span className="text-xs text-stone-400 font-normal">Nota</span></span>
                    )}
                  </div>
                </div>

                {/* Stat Tab 3: Today's revenue */}
                <div className="bg-white dark:bg-[#1a1511] rounded-xl p-6 border border-stone-200/80 dark:border-[#282019] shadow-stone-100 dark:shadow-none shadow-md flex items-center gap-5 transition-all hover:translate-y-[-2px]" id="stat-card-revenue">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs text-stone-400 font-bold block mb-0.5 mt-0.5">Pendapatan Hari Ini</span>
                    {loadingStats ? (
                      <div className="h-6 w-24 bg-stone-200 dark:bg-stone-800 animate-pulse rounded"></div>
                    ) : (
                      <span className="text-xl font-extrabold text-stone-800 dark:text-stone-100 block leading-none truncate">{formatIDR(stats.todayRevenue)}</span>
                    )}
                  </div>
                </div>

                {/* Stat Tab 4: Best Seller */}
                <div className="bg-white dark:bg-[#1a1511] rounded-xl p-6 border border-stone-200/80 dark:border-[#282019] shadow-stone-100 dark:shadow-none shadow-md flex items-center gap-5 transition-all hover:translate-y-[-2px]" id="stat-card-bestseller">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 rounded-xl">
                    <Coffee className="w-6 h-6 text-blue-800 dark:text-blue-400" />
                  </div>
                  <div className="overflow-hidden select-none">
                    <span className="text-xs text-stone-400 font-bold block mb-0.5">Menu Terlaris</span>
                    {loadingStats ? (
                      <div className="h-6 w-24 bg-stone-200 dark:bg-stone-800 animate-pulse rounded"></div>
                    ) : (
                      <span className="text-sm font-extrabold text-stone-800 dark:text-stone-200 block truncate leading-none pt-1" title={stats.bestSellerMenu}>
                        {stats.bestSellerMenu}
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* Grid Section for Quick Actions & Latest Transactions */}
              <div className="columns-1 lg:columns-2 gap-8 space-y-8" id="dashboard-bottom-grid">
                
                {/* Cashier Quick Entrance card */}
                <div className="bg-white dark:bg-[#1a1511] rounded-xl p-6 border border-stone-200/80 dark:border-[#282019] shadow-sm relative overflow-hidden flex flex-col justify-between break-inside-avoid">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-800">
                        <CreditCard className="w-5 h-5 text-amber-800 dark:text-amber-400" />
                      </div>
                      <h3 className="font-bold text-stone-800 dark:text-stone-100">Layanan Kasir Penjualan</h3>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      Lakukan transaksi pesanan pembeli dengan cepat. Menu filterable berdasarkan kategori, hitung otomatis kembalian serta cetak struk kasir thermal instan.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('kasir')}
                    className="mt-6 py-3 px-6 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Buka Layanan Kasir Sekarang</span>
                  </button>
                </div>

                {/* Recent transaction listing summary */}
                <div className="bg-white dark:bg-[#1a1511] rounded-xl p-6 border border-stone-200/80 dark:border-[#282019] shadow-sm break-inside-avoid">
                  <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-[#282019] mb-4">
                    <span className="font-bold text-stone-800 dark:text-stone-100">Transaksi Terakhir</span>
                    <button onClick={() => setActiveTab('transaksi')} className="text-xs text-amber-800 dark:text-amber-400 font-semibold hover:underline cursor-pointer">Semua Transaksi</button>
                  </div>

                  {loadingTx ? (
                    <div className="space-y-2 py-4">
                      <div className="h-10 bg-stone-150 dark:bg-stone-800 animate-pulse rounded-lg"></div>
                      <div className="h-10 bg-stone-150 dark:bg-stone-800 animate-pulse rounded-lg"></div>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-stone-400 dark:text-stone-500 text-xs">Belum ada riwayat transaksi penjualan hari ini.</div>
                  ) : (
                    <div className="space-y-3.5">
                      {transactions.slice(0, 4).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between py-2.5 px-3 bg-stone-50 dark:bg-[#201a14]/60 rounded-lg hover:bg-stone-100/50 dark:hover:bg-[#2c221a]/85 transition">
                          <div>
                            <span className="text-xs font-bold text-stone-800 dark:text-stone-250 block">Transaksi #{tx.id}</span>
                            <span className="text-[10px] text-stone-400 dark:text-stone-500">{new Date(tx.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(tx.tanggal).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-amber-900 dark:text-amber-300">{formatIDR(Number(tx.total))}</span>
                            <button 
                              onClick={() => handleViewReceiptDetails(tx.id)}
                              className="p-1 px-2.5 bg-amber-500/10 dark:bg-amber-500/15 hover:bg-amber-500 hover:text-stone-950 text-amber-850 dark:text-amber-300 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" /> Detil
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* =========================================
              VIEW: KASIR WORKSPACE
             ========================================= */}
          {activeTab === 'kasir' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in" id="view-kasir">
              
              {/* Left Column: Menu Browsing (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                            {/* Search and Category Filters */}
                <div className="bg-white dark:bg-[#1a1511] p-5 rounded-xl border border-stone-200/80 dark:border-[#282019] shadow-sm space-y-4">
                  {/* Search bar */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        value={cashierMenusSearch}
                        onChange={(e) => setCashierMenusSearch(e.target.value)}
                        placeholder="Cari Menu Kopi, Makanan atau Cemilan..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 dark:border-[#2c221a] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-stone-50 dark:bg-[#221c17] text-stone-800 dark:text-stone-100"
                        id="input-cashier-search"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => openAddMenuModal(cashierMenusSearch)}
                      className="bg-amber-800 hover:bg-amber-900 transition-colors text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer shadow-sm"
                      title="Tambah Menu Item Baru"
                      id="btn-cashier-quick-add"
                    >
                      <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                      <span className="hidden sm:inline">Tambah Menu</span>
                    </button>
                  </div>

                  {/* Kategori list Horizontal tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" id="cashier-category-tabs">
                    <button
                      onClick={() => setSelectedCashierCategory(null)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        selectedCashierCategory === null
                          ? 'bg-amber-800 text-white shadow shadow-amber-950/20'
                          : 'bg-stone-100 dark:bg-[#221c17] hover:bg-stone-200 dark:hover:bg-[#2d241c] text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      Semua Kategori
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCashierCategory(cat.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                          selectedCashierCategory === cat.id
                            ? 'bg-amber-800 text-white shadow shadow-amber-950/20'
                            : 'bg-stone-100 dark:bg-[#221c17] hover:bg-stone-200 dark:hover:bg-[#2d241c] text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {cat.nama_kategori}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Menu items display grid */}
                {loadingMenus ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="h-44 bg-stone-150 dark:bg-[#1a1511] animate-pulse rounded-xl"></div>
                    <div className="h-44 bg-stone-150 dark:bg-[#1a1511] animate-pulse rounded-xl"></div>
                    <div className="h-44 bg-stone-150 dark:bg-[#1a1511] animate-pulse rounded-xl"></div>
                  </div>
                ) : filteredCashierMenus.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-[#1a1511] rounded-xl border border-dashed border-stone-300 dark:border-[#2f241a] text-stone-400 p-6 flex flex-col items-center justify-center space-y-4">
                    <Coffee className="w-12 h-12 text-stone-300 dark:text-stone-500 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium text-stone-600 dark:text-stone-300">Tidak ada menu yang sesuai dengan pencarian Anda.</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Ingin menambahkannya ke katalog?</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAddMenuModal(cashierMenusSearch || '')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer shadow-sm shadow-amber-900/10"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Tambah {cashierMenusSearch ? `"${cashierMenusSearch}"` : 'Menu Baru'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" id="cashier-menu-grid">
                    {filteredCashierMenus.map((menu) => (
                      <div 
                        key={menu.id}
                        onClick={() => addToCart(menu)}
                        className="group bg-white dark:bg-[#1a1511] rounded-xl border border-stone-200/80 dark:border-[#282019] shadow-stone-100 dark:shadow-none shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
                      >
                        {/* Menu Image */}
                        <div className="aspect-[4/3] bg-stone-100 dark:bg-stone-900 relative overflow-hidden">
                          <img 
                            src={menu.foto || 'https://images.unsplash.com/photo-1541167760496-1628856ab772'} 
                            alt={menu.nama_menu}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          {/* Quick delete button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMenuClick(menu.id, menu.nama_menu);
                            }}
                            className="absolute top-2 left-2 p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer active:scale-90 z-10"
                            title="Hapus Menu"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          
                          {/* Stock pill */}
                          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-extrabold shadow-sm ${
                            menu.stok <= 0 
                              ? 'bg-red-500 text-white' 
                              : menu.stok <= 5 
                              ? 'bg-amber-500 text-stone-950 animate-pulse' 
                              : 'bg-stone-900/80 text-amber-200'
                          }`}>
                            {menu.stok <= 0 ? 'HABIS' : `Stok: ${menu.stok}`}
                          </div>
                        </div>

                        {/* Description and Action info */}
                        <div className="p-3.5 space-y-1 bg-white dark:bg-[#1a1511] transition-colors">
                          <span className="text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">{menu.kategori_nama}</span>
                          <h4 className="text-xs font-extrabold text-stone-800 dark:text-stone-100 line-clamp-1 group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors">{menu.nama_menu}</h4>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-black text-amber-955 dark:text-amber-300">{formatIDR(menu.harga)}</span>
                            <div className="p-1 rounded-lg bg-amber-500 text-stone-950 group-hover:scale-105 transition-all">
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Right Column: Checkout Workspace (5 cols) */}
              <div className="lg:col-span-5 bg-white dark:bg-[#1a1511] rounded-xl border border-stone-200/80 dark:border-[#282019] shadow-md p-5 flex flex-col justify-between max-h-[82vh] sticky top-8 transition-colors duration-300" id="cashier-cart-panel">
                
                {/* Header info */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#282019] mb-3">
                  <div className="flex items-center gap-2">
                    <CartIcon className="w-5 h-5 text-amber-800 dark:text-amber-400 animate-pulse" />
                    <span className="font-bold text-stone-800 dark:text-stone-100">Keranjang Kasir</span>
                  </div>
                  <button 
                    onClick={clearCart} 
                    disabled={cart.length === 0}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 font-semibold disabled:opacity-40 disabled:no-underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Bersihkan
                  </button>
                </div>

                {/* Basket List Items (Scrollable) */}
                <div className="flex-1 overflow-y-auto space-y-3 min-h-[140px] pr-1" id="cashier-cart-list">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-stone-400 dark:text-stone-500 text-center space-y-3">
                      <ShoppingBag className="w-12 h-12 text-stone-300 dark:text-stone-600 stroke-[1.5]" />
                      <p className="text-xs leading-relaxed max-w-[200px]">Kembali pilih menu di sebelah kiri untuk menambah ke struk belanja.</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.menu_id} className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-[#1f1914] rounded-xl hover:bg-stone-150/40 dark:hover:bg-[#2a221b] transition">
                        {/* Name and small info */}
                        <div className="max-w-[50%]">
                          <h5 className="text-xs font-extrabold text-stone-800 dark:text-stone-100 truncate">{item.nama_menu}</h5>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold">{formatIDR(item.harga)} <span className="font-normal text-stone-300 dark:text-[#5c4a3b]">/ porsi</span></span>
                        </div>

                        {/* Qty controller trigger increments */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateCartQty(item.menu_id, -1)}
                            className="w-6 h-6 rounded bg-stone-200 dark:bg-[#2c221a] hover:bg-stone-300 dark:hover:bg-[#3d3024] text-stone-700 dark:text-stone-350 flex items-center justify-center text-xs font-black transition-all cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-stone-800 dark:text-stone-200 w-5 text-center select-none" id={`cart-item-qty-${item.menu_id}`}>{item.qty}</span>
                          <button 
                            onClick={() => updateCartQty(item.menu_id, 1)}
                            className="w-6 h-6 rounded bg-stone-200 dark:bg-[#2c221a] hover:bg-stone-300 dark:hover:bg-[#3d3024] text-stone-700 dark:text-stone-350 flex items-center justify-center text-xs font-black transition-all cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Delete & pricing actions */}
                        <div className="text-right">
                          <span className="text-xs font-bold text-amber-950 dark:text-amber-300 block">{formatIDR(item.subtotal)}</span>
                          <button 
                            onClick={() => deleteFromCart(item.menu_id)}
                            className="text-[10px] text-red-500 hover:text-red-700 font-bold hover:underline py-0.5 cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotals & Taxes Calculation block */}
                <div className="border-t border-stone-100 dark:border-[#282019] pt-3 mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-500 dark:text-stone-400">
                    <span>Subtotal</span>
                    <span>{formatIDR(cartSubtotal)}</span>
                  </div>

                  {/* Tax Optional toggler (10%) */}
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-bold">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={taxChecked}
                        onChange={(e) => setTaxChecked(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-800 rounded border-stone-300 dark:border-[#423126] dark:bg-[#1f1914]"
                        id="checkbox-tax-opt"
                      />
                      <span>Pajak (PPN 10%)</span>
                    </label>
                    <span>{formatIDR(taxAmount)}</span>
                  </div>

                  {/* Grand total Highlight */}
                  <div className="flex items-center justify-between text-sm font-black text-amber-950 dark:text-amber-200 bg-amber-50/50 dark:bg-amber-950/15 py-2 px-3 rounded-lg border border-amber-100/40 dark:border-amber-900/10">
                    <span>TOTAL TAGIHAN</span>
                    <span className="text-base" id="cart-grand-total">{formatIDR(cartTotalPay)}</span>
                  </div>
                </div>

                {/* Billing inputs & payments changes logic */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 mb-1">DANA TUNAI DITERIMA</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-stone-400 text-xs font-bold font-mono">Rp</span>
                      <input
                        type="number"
                        placeholder="Jumlah uang bayar tunai..."
                        value={cashPayAmount}
                        onChange={(e) => setCashPayAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 dark:border-[#382c21] focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-[#1f1914] font-bold"
                        id="input-cashier-pay-amount"
                      />
                    </div>
                  </div>

                  {/* Quick cash denomination options */}
                  {cartTotalPay > 0 && (
                    <div className="grid grid-cols-4 gap-1.5" id="quick-cash-option-grid">
                      {[cartTotalPay, 10000, 20000, 50000, 100000].map((val, idx) => {
                        const amount = Math.ceil(val);
                        if (amount < cartTotalPay && idx > 0) return null;
                        return (
                          <button
                            key={idx}
                            onClick={() => setCashPayAmount(String(amount))}
                            className="py-1 bg-stone-100 dark:bg-[#201a14] hover:bg-stone-200 dark:hover:bg-[#2d241c] text-stone-600 dark:text-stone-300 text-[10px] font-bold rounded transition-colors cursor-pointer"
                          >
                            {idx === 0 ? 'Pas' : formatIDR(amount).replace('Rp', '').trim()}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Automatic Change block display */}
                  <div className="flex items-center justify-between py-1 px-1 text-xs">
                    <span className="text-stone-400 font-bold">KEMBALIAN TUNAI</span>
                    <span className={`font-black ${cashChangeAmount > 0 ? 'text-emerald-600' : 'text-stone-550'}`} id="cart-cash-change">
                      {formatIDR(cashChangeAmount)}
                    </span>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckoutProcess}
                    disabled={cart.length === 0 || !cashPayAmount || Number(cashPayAmount) < cartTotalPay}
                    className="w-full py-3 bg-gradient-to-r from-amber-800 to-[#542a10] hover:from-amber-900 hover:to-stone-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-900/10 active:scale-95 disabled:opacity-40 disabled:scale-100 cursor-pointer transition-all uppercase tracking-wider"
                    id="btn-checkout-submit"
                  >
                    <Printer className="w-4 h-4" />
                    <span>PROSES CHEKOUT & CETAK STRUK</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* =========================================
              VIEW: MANAGE CATALOG MENU
             ========================================= */}
          {activeTab === 'menu' && (
            <div className="space-y-6 animate-fade-in" id="view-menus-management">
              
              {/* Header block with buttons & search */}
              <div className="bg-white dark:bg-[#1a1511] p-5 rounded-xl border border-stone-200/80 dark:border-[#282019] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="manage-menu-controls">
                
                {/* Search Catalogs input */}
                <div className="relative flex-1 max-w-md">
                   <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Cari Menu Kopi, Minuman, Makanan..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 dark:border-[#33271d] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-[#faf9f6] dark:bg-[#1f1914] text-stone-800 dark:text-stone-100"
                    id="input-manage-menu-search"
                  />
                </div>

                {/* Filters and Add menus button */}
                <div className="flex items-center flex-wrap gap-3">
                  <select 
                    value={selectedCategoryFilter || ''} 
                    onChange={(e) => setSelectedCategoryFilter(e.target.value ? Number(e.target.value) : null)}
                    className="text-xs font-bold text-stone-600 dark:text-stone-300 bg-white dark:bg-[#191410] border border-stone-200 dark:border-[#33271d] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nama_kategori}</option>
                    ))}
                  </select>

                  <button
                    onClick={openAddMenuModal}
                    className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition duration-250 cursor-pointer shadow-sm shadow-amber-900/10"
                    id="btn-add-new-menu"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Tambah Menu Baru</span>
                  </button>
                </div>

              </div>

              {/* Grid lists of Catalogs */}
              {loadingMenus ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                  <div className="h-44 bg-stone-200 dark:bg-[#1a1511] rounded-xl"></div>
                  <div className="h-44 bg-stone-200 dark:bg-[#1a1511] rounded-xl"></div>
                </div>
              ) : filteredCatalogMenus.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1a1511] rounded-xl border border-dashed border-stone-300 dark:border-[#2f241a]">
                  <Coffee className="w-16 h-16 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
                  <h4 className="font-bold text-stone-700 dark:text-stone-300">Belum ada item menu</h4>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Gunakan tombol 'Tambah Menu Baru' untuk mendaftarkan menu di kasir.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="manage-menus-grid">
                  {filteredCatalogMenus.map((menu) => (
                    <div key={menu.id} className="bg-white dark:bg-[#1a1511] rounded-xl border border-stone-200/80 dark:border-[#282019] shadow-md dark:shadow-none flex flex-col overflow-hidden relative group hover:shadow-lg transition justify-between">
                      
                      {/* Image cover and labels */}
                      <div className="aspect-[4/3] bg-stone-100 dark:bg-stone-900 relative overflow-hidden shrink-0">
                        <img 
                          src={menu.foto || 'https://images.unsplash.com/photo-1541167760496-1628856ab772'} 
                          alt={menu.nama_menu}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
                          referrerPolicy="no-referrer"
                        />
                        {/* Category label badge */}
                        <div className="absolute top-3 left-3 bg-[#170902]/85 text-amber-200 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-amber-500/10">
                          {menu.kategori_nama}
                        </div>
                        {/* Stock label status badge */}
                        <div className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-lg ${
                          menu.stok <= 0 ? 'bg-red-500 text-white' : menu.stok <= 5 ? 'bg-amber-600 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                          Stok: {menu.stok}
                        </div>
                      </div>

                      {/* Info & action buttons */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm line-clamp-1">{menu.nama_menu}</h4>
                          <span className="text-base font-black text-amber-955 dark:text-amber-300 block">{formatIDR(menu.harga)}</span>
                        </div>

                        {/* Action buttons (Edit & Delete) */}
                        <div className="flex items-center gap-2 pt-1 border-t border-stone-100 dark:border-[#282019]">
                          <button
                            onClick={() => openEditMenuModal(menu)}
                            className="flex-1 py-1.5 px-3 border border-stone-200 dark:border-[#382d23] hover:border-amber-805 dark:hover:border-amber-400 text-stone-600 dark:text-stone-300 hover:text-amber-850 dark:hover:text-amber-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Ubah</span>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteMenuClick(menu.id, menu.nama_menu)}
                            className="py-1.5 px-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 border border-red-100 dark:border-red-900/10 h-8 w-8 text-red-650 rounded-lg flex items-center justify-center transition active:scale-95 cursor-pointer"
                            title="Hapus Menu"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* =========================================
              VIEW: TRANSACTION HISTORY LOGS
             ========================================= */}
          {activeTab === 'transaksi' && (
            <div className="space-y-6 animate-fade-in" id="view-transactions-logs">
                        {/* Filter tools */}
              <div className="bg-white dark:bg-[#1a1511] p-5 rounded-xl border border-stone-200/80 dark:border-[#282019] shadow-sm flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Cari transaksi berdasarkan ID, total, tanggal..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 dark:border-[#33271d] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-stone-50 dark:bg-[#1f1914] text-stone-850 dark:text-stone-100"
                    id="input-tx-search"
                  />
                </div>
                
                <div className="text-xs text-stone-400 dark:text-stone-550 flex items-center gap-1">
                  <span>Hasil Ditemukan:</span> 
                  <span className="font-bold text-stone-700 dark:text-stone-350">{filteredTransactions.length} Transaksi</span>
                </div>
              </div>

              {/* Transactions list Table view */}
              <div className="bg-white dark:bg-[#1a1511] rounded-xl border border-stone-200/80 dark:border-[#282019] shadow-md dark:shadow-none overflow-hidden">
                {loadingTx ? (
                  <div className="divide-y divide-stone-100 dark:divide-[#241d18] py-6 px-4 space-y-4">
                    <div className="h-10 bg-stone-100 dark:bg-[#1f1914] animate-pulse rounded"></div>
                    <div className="h-10 bg-stone-100 dark:bg-[#1f1914] animate-pulse rounded"></div>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-20">
                    <Receipt className="w-16 h-16 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
                    <h4 className="font-bold text-stone-700 dark:text-stone-300">Tidak ada riwayat transaksi</h4>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Coba cari kata kunci lain atau lakukan penjualan terlebih dahulu.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" id="transactions-records-table">
                       <thead>
                        <tr className="bg-stone-50 dark:bg-[#201a14] border-b border-stone-200 dark:border-[#282019] text-stone-500 dark:text-stone-400 text-[10px] font-extrabold uppercase tracking-widest">
                          <th className="py-4 px-6">ID Nota</th>
                          <th className="py-4 px-6">Tanggal & Waktu</th>
                          <th className="py-4 px-6">Item yang Dipesan</th>
                          <th className="py-4 px-6 text-right">Total Transaksi</th>
                          <th className="py-4 px-6 text-right">Pembayaran Tunai</th>
                          <th className="py-4 px-6 text-right">Kembalian</th>
                          <th className="py-4 px-6 text-center">Aksi Pelayanan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-[#241d18] text-xs font-semibold">
                        {filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-stone-50/50 dark:hover:bg-[#221a14]/65 transition">
                            <td className="py-4 px-6 font-bold text-amber-955 dark:text-amber-400">#STR{tx.id}</td>
                            <td className="py-4 px-6 text-stone-600 dark:text-stone-300">
                              {new Date(tx.tanggal).toLocaleDateString('id-ID', { year: '2-digit', month: 'numeric', day: 'numeric' })} - {new Date(tx.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-4 px-6">
                              {tx.details && tx.details.length > 0 ? (
                                <div className="flex flex-col gap-1 max-w-[240px]">
                                  {tx.details.map((detail, idx) => (
                                    <div key={idx} className="text-stone-700 dark:text-stone-300 truncate text-[11px]" title={`${detail.qty}x ${detail.nama_menu}`}>
                                      <span className="font-extrabold text-amber-800 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 px-1.5 py-0.5 rounded text-[10px] mr-1 inline-block min-w-[22px] text-center">{detail.qty}x</span>
                                      <span>{detail.nama_menu}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-stone-400 italic text-[11px]">Tidak ada rincian</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right font-black text-[#170902] dark:text-stone-100">{formatIDR(Number(tx.total))}</td>
                            <td className="py-4 px-6 text-right text-stone-600 dark:text-stone-300">{formatIDR(Number(tx.bayar))}</td>
                            <td className="py-4 px-6 text-right text-emerald-750 dark:text-emerald-400 font-bold">{formatIDR(Number(tx.kembalian))}</td>
                            <td className="py-4 px-6 text-center">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleViewReceiptDetails(tx.id)}
                                  className="px-3 py-1.5 bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500 text-amber-850 dark:text-amber-300 hover:text-stone-950 font-bold rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Rincian</span>
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteTransactionClick(tx.id)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/25 border border-red-100 dark:border-red-900/15 rounded-lg transition active:scale-95 cursor-pointer"
                                  title="Hapus Transaksi"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-650" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

      {/* =========================================
          MODAL 1: ADD & EDIT MENU CATALOG
         ========================================= */}
      {menuModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a1511] rounded-2xl shadow-xl w-full max-w-md border border-stone-100 dark:border-[#2a211a] overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-900 to-[#2c1607] p-5 text-white flex items-center justify-between">
              <span className="font-bold text-sm tracking-wide">{editingMenuId ? 'EDIT DATA MENU CATALOG' : 'DAFTARKAN MENU PENJUALAN BARU'}</span>
              <button 
                onClick={() => setMenuModalOpen(false)} 
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Form fields */}
            <form onSubmit={handleMenuFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-405 mb-1">Nama Item Menu</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Susu Mantan, Mie Nyemek"
                  value={menuFormName}
                  onChange={(e) => setMenuFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 dark:border-[#2f241c] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-[#221c17] font-bold"
                  id="menu-form-input-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-405 mb-1">Kategori Menu</label>
                  <select
                    value={menuFormCategory}
                    onChange={(e) => setMenuFormCategory(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-200 dark:border-[#2f241c] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-[#221c17] font-bold"
                    id="menu-form-select-category"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nama_kategori}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-405 mb-1">Stok Menetap</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={menuFormStok}
                    onChange={(e) => setMenuFormStok(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-200 dark:border-[#2f241c] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-[#221c17] font-bold"
                    id="menu-form-input-stock"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-405 mb-1">Harga Jual (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 text-xs font-bold font-mono">Rp</span>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="Contoh: 10000"
                    value={menuFormHarga || ''}
                    onChange={(e) => setMenuFormHarga(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-stone-200 dark:border-[#2f241c] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-[#221c17] font-bold"
                    id="menu-form-input-price"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-405 mb-1">Link URL Foto Menu (Opsional)</label>
                <input
                  type="url"
                  placeholder="Link URL gambar (Unsplash, Imgur, etc.)"
                  value={menuFormFoto}
                  onChange={(e) => setMenuFormFoto(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 dark:border-[#2f241c] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs text-stone-850 dark:text-stone-150 bg-stone-50 dark:bg-[#221c17] font-bold"
                  id="menu-form-input-photo-url"
                />
                <span className="text-[10px] text-stone-400 dark:text-stone-500 leading-normal block mt-1">Kosongkan saja untuk menggunakan default launcher gambar kategori otomatis.</span>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-stone-100 dark:border-[#282019]">
                <button
                  type="button"
                  onClick={() => setMenuModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-250 dark:border-[#382d23] hover:bg-stone-50 dark:hover:bg-[#1f1914] text-stone-600 dark:text-stone-300 text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer"
                  id="menu-form-btn-submit"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: TRANSACTION DETAILS AND PRINT
         ========================================= */}
      {(receiptDetailModalOpen || activeReceipt) && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a1511] rounded-2xl shadow-xl w-full max-w-sm border border-stone-100 dark:border-[#2a211a] overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-900 to-[#1c0d04] p-4 text-white flex items-center justify-between">
              <span className="font-bold text-xs">NOTA BUKTI PEMBAYARAN KASIR</span>
              <button 
                onClick={() => {
                  setReceiptDetailModalOpen(false);
                  setActiveReceipt(null);
                }} 
                className="p-1 rounded hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Simulated Receipt Preview Content */}
            <div className="p-6 bg-[#faf9f5] dark:bg-[#1f1914] transition-colors">
              <div className="bg-white p-5 border border-stone-200/60 shadow-sm rounded-xl font-mono text-xs text-stone-850 space-y-4" id="screen-receipt-viewer">
                
                <div className="text-center space-y-0.5">
                  <h4 className="font-extrabold text-[#2c1607] tracking-wider text-sm">WARKOP JACK</h4>
                  <p className="text-[10px] text-amber-800 font-bold tracking-wide italic">Bersama Jack Menuju IMO</p>
                  <p className="text-[10px] text-stone-400">Jl. Raya Tembok Ratapan Yerussolo</p>
                  <p className="text-[9px] text-stone-400">Nota ID: #STR{activeReceipt?.id}</p>
                  <p className="text-[9px] text-stone-400">{activeReceipt?.tanggal ? new Date(activeReceipt.tanggal).toLocaleString('id-ID') : '07-06-2026 11:34'}</p>
                </div>

                <div className="border-t border-dashed border-stone-200 my-2"></div>

                <div className="space-y-2">
                  {activeReceipt?.details ? (
                    activeReceipt.details.map((item: any, idx: number) => (
                      <div key={idx} className="flex flex-col">
                        <div className="flex justify-between font-bold text-stone-800">
                          <span>{item.nama_menu}</span>
                          <span>{formatIDR(Number(item.subtotal))}</span>
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {item.qty} Porsi x {formatIDR(Number(item.harga))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-stone-300 py-2 text-center text-[10px]">Tiada rincian belanja.</div>
                  )}
                </div>

                <div className="border-t border-dashed border-stone-200 my-2"></div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between font-extrabold text-stone-900">
                    <span>JUMLAH TAGIHAN:</span>
                    <span>{formatIDR(Number(activeReceipt?.total))}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>CASH BAYAR:</span>
                    <span>{formatIDR(Number(activeReceipt?.bayar))}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 font-extrabold">
                    <span>DANA KEMBALI:</span>
                    <span>{formatIDR(Number(activeReceipt?.kembalian))}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-200 my-2"></div>

                <div className="text-center font-bold text-stone-500 text-[10px]">
                  TERIMA KASIH ATAS KUNJUNGAN ANDA
                </div>

              </div>
            </div>

            {/* Print and Close Actions */}
            <div className="p-4 bg-stone-50 dark:bg-[#18130f] border-t border-stone-100 dark:border-[#282019] flex items-center gap-3">
              <button
                onClick={() => {
                  setReceiptDetailModalOpen(false);
                  setActiveReceipt(null);
                }}
                className="flex-1 py-1.5 border border-stone-250 dark:border-[#382d23] text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#1f1914] text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Tutup
              </button>
              
              <button
                onClick={triggerBrowserPrint}
                className="flex-1 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-amber-900/10"
                id="btn-trigger-print"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Cetak Nota Struk</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" id="confirm-modal-overlay">
          <div className="bg-white dark:bg-[#1a1511] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-stone-200/80 dark:border-[#282019] animate-scale-up" id="confirm-modal-box">
            
            {/* Header / Accent Bar */}
            <div className={`p-5 flex items-start gap-4 ${confirmModal.isDanger ? 'bg-red-50/50 dark:bg-red-950/10' : 'bg-amber-50/50 dark:bg-[#201a14]'}`}>
              <div className={`p-3 rounded-full shrink-0 ${confirmModal.isDanger ? 'bg-red-100 text-red-600 dark:bg-red-950/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/30'}`}>
                {confirmModal.isDanger ? <Trash2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-stone-900 dark:text-stone-100 tracking-tight text-base leading-none">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mt-1.5 font-medium">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-stone-50 dark:bg-[#18130f] px-5 py-4 border-t border-stone-100 dark:border-[#2c221a] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-stone-250 dark:border-[#382d23] text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#1f1914] text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer"
              >
                {confirmModal.cancelText || 'Batal'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer shadow-sm ${
                  confirmModal.isDanger 
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/10' 
                    : 'bg-amber-800 hover:bg-amber-900 shadow-amber-900/10'
                }`}
                id="btn-confirm-action"
              >
                {confirmModal.confirmText || 'Konfirmasi'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================
          PRINTER COMPONENT (Only seen during print media window.print())
         ========================================= */}
      {activeReceipt && (
        <div id="print-receipt-container" style={{ fontFamily: 'monospace', width: '300px', padding: '10px', color: 'black', background: 'white' }}>
          <div>====================</div>
          <div style={{ textAlign: 'center', fontWeight: 'bold' }}>WARKOP JACK</div>
          <div style={{ textAlign: 'center', fontSize: '9px', fontStyle: 'italic', margin: '2px 0' }}>Bersama Jack Menuju IMO</div>
          <div style={{ textAlign: 'center', fontSize: '10px' }}>Jl. Raya Tembok Ratapan Yerussolo</div>
          <div style={{ textAlign: 'center', fontSize: '10px' }}>ID STRUK: #STR{activeReceipt.id}</div>
          <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '10px' }}>
            {new Date(activeReceipt.tanggal).toLocaleString('id-ID')}
          </div>
          <div>====================</div>
          
          <div style={{ marginTop: '10px', marginBottom: '10px' }}>
            {activeReceipt.details && activeReceipt.details.map((item: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold' }}>{item.nama_menu} x{item.qty}</div>
                <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
                  <span>{formatIDR(Number(item.harga))} / porsi</span>
                  <span style={{ float: 'right' }}>{formatIDR(Number(item.subtotal))}</span>
                </div>
                <div style={{ clear: 'both' }}></div>
              </div>
            ))}
          </div>
          
          <div>--------------------</div>
          
          <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
            <span>TOTAL :</span>
            <span style={{ float: 'right' }}>{formatIDR(Number(activeReceipt.total))}</span>
          </div>
          <div style={{ clear: 'both' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
            <span>BAYAR :</span>
            <span style={{ float: 'right' }}>{formatIDR(Number(activeReceipt.bayar))}</span>
          </div>
          <div style={{ clear: 'both' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontWeight: 'bold' }}>
            <span>KEMBALI :</span>
            <span style={{ float: 'right' }}>{formatIDR(Number(activeReceipt.kembalian))}</span>
          </div>
          <div style={{ clear: 'both' }}></div>
          
          <div style={{ marginTop: '15px', textAlign: 'center' }}>--------------------</div>
          <div style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '5px' }}>Terima Kasih</div>
          <div style={{ textAlign: 'center', fontSize: '10px', color: 'gray' }}>Silakan Datang Kembali</div>
          <div style={{ marginTop: '10px' }}>====================</div>
        </div>
      )}

    </div>
  );
}

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'zh-TW' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  'zh-TW': {
    // Navigation
    'nav.home': '首頁',
    'nav.products': '產品',
    'nav.about': '關於我們',
    'nav.contact': '聯絡我們',
    'nav.cart': '購物車',
    'nav.account': '我的帳戶',
    'nav.admin': '管理後台',
    'nav.login': '登入',
    'nav.logout': '登出',
    
    // Home Page
    'home.hero.title': '探索生活美學',
    'home.hero.subtitle': '精選優質商品，為您的生活增添品味',
    'home.hero.cta': '立即選購',
    'home.featured.title': '精選商品',
    'home.collections.title': '商品系列',
    'home.collections.viewAll': '查看全部',
    
    // Product
    'product.addToCart': '加入購物車',
    'product.outOfStock': '缺貨中',
    'product.price': '價格',
    'product.description': '商品描述',
    'product.quantity': '數量',
    
    // Cart
    'cart.title': '購物車',
    'cart.empty': '購物車是空的',
    'cart.continueShopping': '繼續購物',
    'cart.checkout': '結帳',
    'cart.subtotal': '小計',
    'cart.total': '總計',
    'cart.remove': '移除',
    'cart.items': '件商品',
    
    // Checkout
    'checkout.title': '結帳',
    'checkout.orderSummary': '訂單摘要',
    'checkout.paymentMethod': '支付方式',
    'checkout.selectPayment': '選擇支付方式',
    'checkout.proceedToPayment': '前往支付',
    'checkout.processing': '處理中...',
    'checkout.backToCart': '返回購物車',
    'checkout.shipping': '運費',
    'checkout.toBeCalculated': '待計算',
    'checkout.amountDetails': '金額明細',
    'checkout.confirmationNote': '支付完成後，您將收到訂單確認郵件',
    
    // Payment
    'payment.creditCard': '信用卡',
    'payment.atm': 'ATM 轉賬',
    'payment.cvs': '超商代碼',
    'payment.barcode': '超商條碼',
    'payment.newebpay': '藍新金流 (NewebPay)',
    'payment.ecpay': '綠界科技 (ECPay)',
    'payment.creditCard.desc': '支持 Visa、Mastercard、JCB',
    'payment.atm.desc': '虛擬帳號轉賬，3天內完成',
    'payment.cvs.desc': '7-11、全家、萊爾富',
    'payment.barcode.desc': '超商掃碼支付',
    
    // Account
    'account.title': '我的帳戶',
    'account.orders': '我的訂單',
    'account.profile': '個人資料',
    'account.addresses': '收貨地址',
    'account.orderHistory': '訂單記錄',
    'account.orderNumber': '訂單編號',
    'account.date': '日期',
    'account.status': '狀態',
    'account.amount': '金額',
    'account.viewDetails': '查看詳情',
    
    // Order Status
    'order.status.pending': '待處理',
    'order.status.paid': '已付款',
    'order.status.processing': '處理中',
    'order.status.shipped': '已出貨',
    'order.status.delivered': '已送達',
    'order.status.cancelled': '已取消',
    'order.status.refunded': '已退款',
    
    // Auth
    'auth.login': '登入',
    'auth.register': '註冊',
    'auth.email': '電子郵件',
    'auth.password': '密碼',
    'auth.confirmPassword': '確認密碼',
    'auth.forgotPassword': '忘記密碼？',
    'auth.noAccount': '還沒有帳戶？',
    'auth.hasAccount': '已有帳戶？',
    'auth.signUp': '註冊',
    'auth.signIn': '登入',
    
    // Common
    'common.loading': '載入中...',
    'common.error': '錯誤',
    'common.success': '成功',
    'common.cancel': '取消',
    'common.confirm': '確認',
    'common.save': '儲存',
    'common.edit': '編輯',
    'common.delete': '刪除',
    'common.search': '搜尋',
    'common.filter': '篩選',
    'common.sort': '排序',
    'common.viewMore': '查看更多',
    'common.backToTop': '回到頂部',
    
    // Footer
    'footer.company': '公司資訊',
    'footer.about': '關於我們',
    'footer.careers': '人才招募',
    'footer.press': '媒體中心',
    'footer.support': '客戶支持',
    'footer.help': '幫助中心',
    'footer.shipping': '配送資訊',
    'footer.returns': '退換貨政策',
    'footer.contact': '聯絡我們',
    'footer.social': '關注我們',
    'footer.newsletter': '訂閱電子報',
    'footer.newsletterDesc': '訂閱以獲取最新優惠和產品資訊',
    'footer.subscribe': '訂閱',
    'footer.copyright': '© 2024 時光科技. 版權所有.',
    
    // Login/Register
    'login.title': '登入',
    'login.subtitle': '登入您的帳戶',
    'login.submit': '登入',
    'login.noAccount': '還沒有帳戶？',
    'login.createAccount': '建立帳戶',
    'register.title': '註冊',
    'register.subtitle': '建立新帳戶',
    'register.submit': '註冊',
    'register.hasAccount': '已有帳戶？',
    'register.signIn': '登入',
    
    // Account Page
    'account.welcome': '歡迎回來',
    'account.recentOrders': '最近訂單',
    'account.noOrders': '您還沒有任何訂單',
    'account.startShopping': '開始購物',
    'account.viewAll': '查看全部',
    'account.orderDetails': '訂單詳情',
    'account.payNow': '立即支付',
    
    // Product Pages
    'product.relatedProducts': '相關商品',
    'product.specifications': '規格',
    'product.reviews': '評價',
    'product.inStock': '有貨',
    'product.limitedStock': '庫存有限',
    
    // About & Contact
    'about.title': '關於我們',
    'contact.title': '聯絡我們',
    'contact.name': '姓名',
    'contact.message': '訊息',
    'contact.send': '發送',
    'contact.success': '訊息已發送',
  },
  'en': {
    // Navigation
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.cart': 'Cart',
    'nav.account': 'Account',
    'nav.admin': 'Admin',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    
    // Home Page
    'home.hero.title': 'Discover Life Aesthetics',
    'home.hero.subtitle': 'Curated quality products to enhance your lifestyle',
    'home.hero.cta': 'Shop Now',
    'home.featured.title': 'Featured Products',
    'home.collections.title': 'Collections',
    'home.collections.viewAll': 'View All',
    
    // Product
    'product.addToCart': 'Add to Cart',
    'product.outOfStock': 'Out of Stock',
    'product.price': 'Price',
    'product.description': 'Description',
    'product.quantity': 'Quantity',
    
    // Cart
    'cart.title': 'Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.continueShopping': 'Continue Shopping',
    'cart.checkout': 'Checkout',
    'cart.subtotal': 'Subtotal',
    'cart.total': 'Total',
    'cart.remove': 'Remove',
    'cart.items': 'items',
    
    // Checkout
    'checkout.title': 'Checkout',
    'checkout.orderSummary': 'Order Summary',
    'checkout.paymentMethod': 'Payment Method',
    'checkout.selectPayment': 'Select Payment Method',
    'checkout.proceedToPayment': 'Proceed to Payment',
    'checkout.processing': 'Processing...',
    'checkout.backToCart': 'Back to Cart',
    'checkout.shipping': 'Shipping',
    'checkout.toBeCalculated': 'To be calculated',
    'checkout.amountDetails': 'Amount Details',
    'checkout.confirmationNote': 'You will receive an order confirmation email after payment',
    
    // Payment
    'payment.creditCard': 'Credit Card',
    'payment.atm': 'ATM Transfer',
    'payment.cvs': 'CVS Code',
    'payment.barcode': 'CVS Barcode',
    'payment.newebpay': 'NewebPay',
    'payment.ecpay': 'ECPay',
    'payment.creditCard.desc': 'Visa, Mastercard, JCB',
    'payment.atm.desc': 'Virtual account, complete within 3 days',
    'payment.cvs.desc': '7-11, FamilyMart, Hi-Life',
    'payment.barcode.desc': 'Scan at convenience store',
    
    // Account
    'account.title': 'My Account',
    'account.orders': 'My Orders',
    'account.profile': 'Profile',
    'account.addresses': 'Addresses',
    'account.orderHistory': 'Order History',
    'account.orderNumber': 'Order Number',
    'account.date': 'Date',
    'account.status': 'Status',
    'account.amount': 'Amount',
    'account.viewDetails': 'View Details',
    
    // Order Status
    'order.status.pending': 'Pending',
    'order.status.paid': 'Paid',
    'order.status.processing': 'Processing',
    'order.status.shipped': 'Shipped',
    'order.status.delivered': 'Delivered',
    'order.status.cancelled': 'Cancelled',
    'order.status.refunded': 'Refunded',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.signUp': 'Sign Up',
    'auth.signIn': 'Sign In',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.viewMore': 'View More',
    'common.backToTop': 'Back to Top',
    
    // Footer
    'footer.company': 'Company',
    'footer.about': 'About Us',
    'footer.careers': 'Careers',
    'footer.press': 'Press',
    'footer.support': 'Support',
    'footer.help': 'Help Center',
    'footer.shipping': 'Shipping Info',
    'footer.returns': 'Returns Policy',
    'footer.contact': 'Contact Us',
    'footer.social': 'Follow Us',
    'footer.newsletter': 'Newsletter',
    'footer.newsletterDesc': 'Subscribe for latest offers and updates',
    'footer.subscribe': 'Subscribe',
    'footer.copyright': '© 2024 Seedlight Tech. All rights reserved.',
    
    // Login/Register
    'login.title': 'Login',
    'login.subtitle': 'Sign in to your account',
    'login.submit': 'Sign In',
    'login.noAccount': "Don't have an account?",
    'login.createAccount': 'Create Account',
    'register.title': 'Register',
    'register.subtitle': 'Create a new account',
    'register.submit': 'Register',
    'register.hasAccount': 'Already have an account?',
    'register.signIn': 'Sign In',
    
    // Account Page
    'account.welcome': 'Welcome back',
    'account.recentOrders': 'Recent Orders',
    'account.noOrders': 'You have no orders yet',
    'account.startShopping': 'Start Shopping',
    'account.viewAll': 'View All',
    'account.orderDetails': 'Order Details',
    'account.payNow': 'Pay Now',
    
    // Product Pages
    'product.relatedProducts': 'Related Products',
    'product.specifications': 'Specifications',
    'product.reviews': 'Reviews',
    'product.inStock': 'In Stock',
    'product.limitedStock': 'Limited Stock',
    
    // About & Contact
    'about.title': 'About Us',
    'contact.title': 'Contact Us',
    'contact.name': 'Name',
    'contact.message': 'Message',
    'contact.send': 'Send',
    'contact.success': 'Message sent',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'zh-TW') ? saved : 'zh-TW';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CompanyProfile, Service, Quotation, InvoiceItem } from '../types';
import { 
  ShoppingBag, 
  Settings, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  Send, 
  Search, 
  ChevronRight, 
  X, 
  Sparkles, 
  Check, 
  Percent, 
  FileText, 
  MessageSquare,
  HelpCircle,
  Menu,
  Sun,
  Moon,
  ChevronLeft,
  Briefcase,
  Sliders,
  Shield,
  Star,
  Info,
  LogIn
} from 'lucide-react';

interface PublicStorefrontProps {
  profile: CompanyProfile;
  products: Product[];
  merchantUid: string;
  onOpenLogin: () => void;
  onSubmitQuote: (quotation: Quotation) => Promise<void>;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export default function PublicStorefront({
  profile,
  products,
  merchantUid,
  onOpenLogin,
  onSubmitQuote,
  darkMode,
  setDarkMode
}: PublicStorefrontProps) {
  // Navigation active tab: 'home' | 'products' | 'services' | 'about' | 'contact' | 'quote'
  const [activePage, setActivePage] = useState<'home' | 'products' | 'services' | 'about' | 'contact' | 'quote'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'priceLow' | 'priceHigh' | 'best'>('newest');
  const [priceRange, setPriceRange] = useState<number>(1000000); // high default

  // Selected Product for details view
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Quote cart states
  const [quoteItems, setQuoteItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [quoteName, setQuoteName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Slides data for slideshow - showcasing products or premium tech slides
  const slides = useMemo(() => {
    // 1. Get products that have images
    const productsWithImages = products.filter(p => p.images && p.images.length > 0 && p.isAvailable !== false && p.showInStorefront !== false);
    
    if (productsWithImages.length > 0) {
      return productsWithImages.slice(0, 5).map((p, idx) => ({
        id: p.id,
        title: p.name,
        subtitle: `${p.brand || 'Premium Brand'} | ${p.model || 'Genuine Product'}`,
        description: p.shortDescription || 'Experience unmatched hardware performance and official warranty backing.',
        image: p.images ? p.images[0] : '',
        badge: 'Featured Hardware',
        product: p
      }));
    }
    
    // 2. Fallback beautiful slides if no products have images
    return [
      {
        id: 'slide-1',
        title: 'High-End Hardware Solutions',
        subtitle: 'Enterprise Systems & Sealed Components',
        description: 'Explore our curated collection of high-performance custom computing setups, motherboards, GPUs, and laptop spares directly imported with brand seals.',
        image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1200&auto=format&fit=crop',
        badge: 'Genuine Imports',
        product: undefined
      },
      {
        id: 'slide-2',
        title: 'Direct Corporate Backup',
        subtitle: 'Official Manufacturer Claims & Support',
        description: 'Enjoy absolute peace of mind with 100% official brand backing and robust local hardware claim support. We process all replacement requests directly through official global partners.',
        image: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=1200&auto=format&fit=crop',
        badge: 'Official Warranty',
        product: undefined
      },
      {
        id: 'slide-3',
        title: 'Custom PC Optimization',
        subtitle: 'Precision Built by Certified Experts',
        description: 'Tell us your operations budget and performance targets, and our showroom team will configure, assemble, and optimize a robust workstation or gaming rig for your needs.',
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1200&auto=format&fit=crop',
        badge: 'Tailored Builds',
        product: undefined
      }
    ];
  }, [products]);

  // Slideshow auto-rotation timer
  React.useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Compile dynamic categories and brands for filtering
  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter((c): c is string => !!c);
    return ['All', ...Array.from(new Set(cats))].sort();
  }, [products]);

  const brands = useMemo(() => {
    const bnds = products.map(p => p.brand).filter((b): b is string => !!b);
    return ['All', ...Array.from(new Set(bnds))].sort();
  }, [products]);

  // Max price of available items
  const maxProductPrice = useMemo(() => {
    if (products.length === 0) return 100000;
    return Math.max(...products.map(p => p.price));
  }, [products]);

  // Handle setting initial max price
  React.useEffect(() => {
    if (maxProductPrice > 0) {
      setPriceRange(maxProductPrice);
    }
  }, [maxProductPrice]);

  // Filtered and Sorted catalog items
  const sortedAndFilteredProducts = useMemo(() => {
    let result = products.filter(p => {
      if (p.showInStorefront === false) return false;
      const actualPrice = p.discountedPrice || p.price;
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.shortDescription || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
      const matchesPrice = actualPrice <= priceRange;

      return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
    });

    // Sorting logic
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdTime || '').getTime() - new Date(a.createdTime || '').getTime());
    } else if (sortBy === 'priceLow') {
      result.sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
    } else if (sortBy === 'priceHigh') {
      result.sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
    } else if (sortBy === 'best') {
      result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedBrand, sortBy, priceRange]);

  // Best seller items
  const bestSellers = useMemo(() => {
    return products.filter(p => p.isBestSeller && p.isAvailable !== false && p.showInStorefront !== false).slice(0, 4);
  }, [products]);

  // Selected/Featured products from Admin or general fallback
  const featuredProducts = useMemo(() => {
    const fromAdmin = products.filter(p => p.isBestSeller && p.isAvailable !== false && p.showInStorefront !== false);
    if (fromAdmin.length > 0) return fromAdmin.slice(0, 8);
    return products.filter(p => p.isAvailable !== false && p.showInStorefront !== false).slice(0, 8);
  }, [products]);

  // Default Services in case none configured
  const defaultServices: Service[] = [
    {
      id: 's1',
      title: 'Premium Showroom Sales',
      description: 'Explore the latest state-of-the-art computers, hardware components, and mobile products directly sourced from verified company channels with robust warranty seals.',
      iconName: 'ShoppingBag',
      priceInfo: 'Genuine Products Only'
    },
    {
      id: 's2',
      title: 'Hardware Optimization & Custom Builds',
      description: 'Expert diagnostics, custom water-cooling loop assembly, workstation scaling, and high-performance gaming PC hardware configurations tailored precisely for your budget.',
      iconName: 'Settings',
      priceInfo: 'Consultation Free'
    },
    {
      id: 's3',
      title: 'Full Brand Warranty Support',
      description: 'Hassle-free brand warranty processing, official replacements, and dedicated troubleshooting from certified technicians who ensure minimum downtime for your operations.',
      iconName: 'Award',
      priceInfo: '100% Guaranteed'
    }
  ];

  const servicesList = profile.servicesList && profile.servicesList.length > 0 
    ? profile.servicesList 
    : defaultServices;

  // Render proper icon based on name
  const renderServiceIcon = (name?: string) => {
    switch (name) {
      case 'ShoppingBag': return <ShoppingBag className="text-indigo-600 dark:text-indigo-400" size={24} />;
      case 'Settings': return <Settings className="text-indigo-600 dark:text-indigo-400" size={24} />;
      case 'Award': return <Award className="text-indigo-600 dark:text-indigo-400" size={24} />;
      case 'Briefcase': return <Briefcase className="text-indigo-600 dark:text-indigo-400" size={24} />;
      case 'MapPin': return <MapPin className="text-indigo-600 dark:text-indigo-400" size={24} />;
      case 'Sliders': return <Sliders className="text-indigo-600 dark:text-indigo-400" size={24} />;
      case 'Shield': return <Shield className="text-indigo-600 dark:text-indigo-400" size={24} />;
      default: return <Settings className="text-indigo-600 dark:text-indigo-400" size={24} />;
    }
  };

  // Add Item to Quotation cart
  const handleAddToQuote = (product: Product) => {
    const existing = quoteItems.find(item => item.product.id === product.id);
    if (existing) {
      setQuoteItems(quoteItems.map(item => 
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setQuoteItems([...quoteItems, { product, quantity: 1 }]);
    }
    setSelectedProduct(null); // close detail modal if open
    setActivePage('quote'); // direct to quotation tab
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateQuoteQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setQuoteItems(quoteItems.filter(item => item.product.id !== productId));
    } else {
      setQuoteItems(quoteItems.map(item => 
        item.product.id === productId ? { ...item, quantity: qty } : item
      ));
    }
  };

  // Generate WhatsApp inquiry link
  const getWhatsAppInquiryUrl = (product: Product) => {
    const baseNum = profile.whatsappNumber || '94771234567';
    const text = encodeURIComponent(`Hello ${profile.name || 'Store'} team, I am interested in inquiring about the "${product.name}" (Model: ${product.model || 'N/A'}, Code: ${product.code}). Is it currently available for showroom delivery?`);
    return `https://wa.me/${baseNum}?text=${text}`;
  };

  // Submit Quotation Compilation
  const handleFormSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteItems.length === 0) return;
    setIsSubmittingQuote(true);

    // Compute standard quotation subtotal
    const items: InvoiceItem[] = quoteItems.map((item, idx) => {
      const activePrice = item.product.discountedPrice || item.product.price;
      return {
        id: crypto.randomUUID(),
        productId: item.product.id,
        productName: item.product.name,
        productCode: item.product.code,
        price: activePrice,
        selectedColor: 'Standard',
        quantity: item.quantity,
        customFields: item.product.customFields || []
      };
    });

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const rawQuotation: Quotation = {
      id: crypto.randomUUID(),
      quotationNumber: `${profile.quotationPrefix || 'QT'}-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      customerName: quoteName.trim(),
      customerPhone: quotePhone.trim(),
      customerAddress: '',
      customerEmail: quoteEmail.trim() || undefined,
      items,
      subtotal,
      discountType: 'fixed',
      discountValue: 0,
      discountAmount: 0,
      deliveryCharges: 0,
      total: subtotal,
      status: 'draft', // Saved as draft for operator review
      customFields: [],
      notes: quoteNotes.trim() || undefined,
    };

    try {
      await onSubmitQuote(rawQuotation);
      setQuoteSuccess(true);
      setQuoteItems([]);
      setQuoteName('');
      setQuotePhone('');
      setQuoteEmail('');
      setQuoteNotes('');
    } catch (err) {
      alert("Failed to register your quotation request. Please try again or WhatsApp us directly.");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactName('');
    setContactEmail('');
    setContactMessage('');
    setTimeout(() => setContactSuccess(false), 6000);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-200 antialiased font-sans`}>
      
      {/* 1. PUBLIC HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-850 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActivePage('home')}>
            <div className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-display font-extrabold text-lg shadow-md shadow-indigo-100 dark:shadow-none">
              {profile.name ? profile.name.charAt(0) : 'B'}
            </div>
            <div className="flex flex-col items-start">
              <span className="font-display font-black text-slate-900 dark:text-white tracking-tight text-base leading-none">
                {profile.name || 'Biyanka Store'}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono font-bold mt-0.5">
                {profile.experience || 'Premium Hardware Vendor'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {[
              { id: 'home', label: 'Home' },
              { id: 'products', label: 'Products' },
              { id: 'services', label: 'Services' },
              { id: 'about', label: 'About Us' },
              { id: 'contact', label: 'Contact' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id as any)}
                className={`relative px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  activePage === item.id 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {activePage === item.id && (
                  <motion.div 
                    layoutId="activePublicTabIndicator" 
                    className="absolute inset-0 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span>{item.label}</span>
              </button>
            ))}

            {/* Request a Quote Button with dynamic badge */}
            <button
              onClick={() => setActivePage('quote')}
              className={`relative px-4 py-2 ml-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activePage === 'quote'
                  ? 'bg-indigo-650 text-white'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100'
              }`}
            >
              <span>Request Quote</span>
              {quoteItems.length > 0 && (
                <span className="bg-rose-500 text-white font-mono text-[9px] font-black rounded-full px-1.5 py-0.2 min-w-4 text-center animate-pulse">
                  {quoteItems.length}
                </span>
              )}
            </button>
          </nav>

          {/* Control Utilities */}
          <div className="flex items-center gap-2">
            
            {/* Dark Mode switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Portal login gateway link */}
            <button
              onClick={onOpenLogin}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition duration-150 cursor-pointer h-7"
            >
              <LogIn size={11} strokeWidth={2.5} />
              <span>Login</span>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl cursor-pointer"
            >
              <Menu size={18} />
            </button>

          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-250 dark:border-slate-850 px-4 py-4 space-y-2 text-left"
          >
            {[
              { id: 'home', label: 'Home' },
              { id: 'products', label: 'Products' },
              { id: 'services', label: 'Services' },
              { id: 'about', label: 'About Us' },
              { id: 'contact', label: 'Contact Us' },
              { id: 'quote', label: 'Request a Quote' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex justify-between items-center ${
                  activePage === item.id
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-850'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'quote' && quoteItems.length > 0 && (
                  <span className="bg-rose-500 text-white font-mono text-[9px] rounded-full px-1.5 py-0.2">
                    {quoteItems.length}
                  </span>
                )}
              </button>
            ))}
            
            <button
              onClick={() => {
                onOpenLogin();
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold mt-2"
            >
              Portal Login
            </button>
          </motion.div>
        )}
      </AnimatePresence>


      {/* 2. MAIN PAGES VIEW CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            
            {/* ==================== HOME PAGE ==================== */}
            {activePage === 'home' && (
              <div className="space-y-16">
                
                {/* Slideshow/Carousel at the very top */}
                <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white h-[260px] sm:h-[400px] flex items-center premium-shadow group">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 w-full h-full"
                    >
                      {/* Background Image with dark overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/65 to-transparent z-10" />
                      <img 
                        src={slides[currentSlide].image} 
                        alt={slides[currentSlide].title} 
                        className="w-full h-full object-cover object-center"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Slide Info */}
                      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-16 z-20 max-w-xl text-left space-y-3 sm:space-y-4">
                        <span className="inline-flex items-center gap-1 self-start px-2.5 py-0.5 bg-indigo-600/85 text-white rounded-full text-[9px] font-black uppercase tracking-widest font-mono">
                          {slides[currentSlide].badge}
                        </span>
                        <h1 className="text-xl sm:text-4xl font-display font-black tracking-tight leading-tight">
                          {slides[currentSlide].title}
                        </h1>
                        <p className="text-[10px] sm:text-xs text-indigo-300 font-bold font-mono tracking-wider">
                          {slides[currentSlide].subtitle}
                        </p>
                        <p className="text-[11px] sm:text-sm text-slate-350 leading-relaxed line-clamp-2 sm:line-clamp-3">
                          {slides[currentSlide].description}
                        </p>
                        
                        <div className="pt-2">
                          {slides[currentSlide].product ? (
                            <button
                              onClick={() => setSelectedProduct(slides[currentSlide].product as Product)}
                              className="px-4 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-950 border-none"
                            >
                              <span>View Product Details</span>
                              <ChevronRight size={12} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setActivePage('products')}
                              className="px-4 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-950 border-none"
                            >
                              <span>Explore Our Catalog</span>
                              <ChevronRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Arrow Navigations */}
                  {slides.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
                        className="absolute left-4 z-25 p-2 bg-slate-900/40 hover:bg-slate-900/70 border border-white/10 text-white rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
                        className="absolute right-4 z-25 p-2 bg-slate-900/40 hover:bg-slate-900/70 border border-white/10 text-white rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </>
                  )}

                  {/* Navigation dots */}
                  {slides.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-25 flex gap-1.5 bg-slate-950/40 px-3 py-1.5 rounded-full border border-white/5">
                      {slides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentSlide(i)}
                          className={`w-1.5 h-1.5 rounded-full transition duration-200 cursor-pointer ${currentSlide === i ? 'w-3.5 bg-white' : 'bg-white/40 hover:bg-white/75'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Home Page Search Bar */}
                <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl premium-shadow space-y-2 text-center">
                  <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Search Our Showroom Catalog</h3>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setActivePage('products');
                    }}
                    className="relative flex items-center"
                  >
                    <Search size={14} className="absolute left-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search CPUs, GPUs, gaming laptops, brand names..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 dark:text-slate-100 text-xs font-semibold outline-none transition"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 px-4 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer border-none shadow-sm"
                    >
                      Search
                    </button>
                  </form>
                </div>

                {/* Featured Products showcase section */}
                {featuredProducts.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center gap-2">
                      <div className="text-left">
                        <span className="text-[9px] text-indigo-650 dark:text-indigo-400 font-bold uppercase tracking-widest font-mono">Showroom Picks</span>
                        <h2 className="text-xl font-display font-black text-slate-900 dark:text-white mt-0.5">Featured Products</h2>
                      </div>
                      <button
                        onClick={() => setActivePage('products')}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        View All →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {featuredProducts.map(product => {
                        const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
                        const discPct = hasDiscount ? Math.round(((product.price - (product.discountedPrice || 0)) / product.price) * 100) : 0;
                        
                        return (
                          <div 
                            key={product.id} 
                            onClick={() => setSelectedProduct(product)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-900/60 transition group flex flex-col justify-between"
                          >
                            <div>
                              {/* Product Image */}
                              <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
                                {product.images && product.images.length > 0 ? (
                                  <img 
                                    src={product.images[0]} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <ShoppingBag className="text-slate-300 dark:text-slate-650" size={24} />
                                )}
                                
                                {product.isBestSeller && (
                                  <span className="absolute top-2 left-2 bg-amber-500 text-white text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Star size={7} className="fill-white stroke-none" />
                                    <span>Featured</span>
                                  </span>
                                )}

                                {hasDiscount && (
                                  <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                                    {discPct}% OFF
                                  </span>
                                )}
                              </div>

                              {/* Brand Slogan */}
                              <div className="text-left mt-2.5">
                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{product.brand || 'Premium Brand'}</span>
                                <h3 className="font-bold text-slate-850 dark:text-slate-200 text-xs mt-0.5 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">{product.name}</h3>
                                {product.model && <p className="text-[9px] text-slate-400 mt-0.5">Model: {product.model}</p>}
                              </div>
                            </div>

                            {/* Pricing & details button */}
                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                              <div className="text-left flex flex-col">
                                {hasDiscount ? (
                                  <>
                                    <span className="line-through text-slate-400 font-mono text-[8px]">
                                      LKR {product.price.toLocaleString('en-US')}
                                    </span>
                                    <span className="font-mono text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 leading-tight">
                                      LKR {product.discountedPrice?.toLocaleString('en-US')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="font-mono text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                                    LKR {product.price.toLocaleString('en-US')}
                                  </span>
                                )}
                              </div>

                              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-0.5">
                                <span>Details</span>
                                <ChevronRight size={8} />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Slogan & core values statement section */}
                <div className="bg-slate-100 dark:bg-slate-900/40 rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-6">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">Uncompromising Values</span>
                  <h3 className="text-xl sm:text-3xl font-display font-black leading-tight text-slate-900 dark:text-white">
                    "Delivering high-performance hardware and seamless local support built on 15 years of customer trust."
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-left">
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-slate-850 dark:text-slate-200 flex items-center gap-2">
                        <Check className="text-indigo-600" size={15} />
                        <span>Genuine Seal Backup</span>
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Every purchase includes genuine manufacturer specifications with company claiming support.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-slate-850 dark:text-slate-200 flex items-center gap-2">
                        <Check className="text-indigo-600" size={15} />
                        <span>Instant Quotation Billing</span>
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Pick components, submit quote requests, and receive certified invoices immediately.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-slate-850 dark:text-slate-200 flex items-center gap-2">
                        <Check className="text-indigo-600" size={15} />
                        <span>Sri Lanka Showroom Inquire</span>
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Direct WhatsApp coordination, on-site setup, and customized technical repair.</p>
                    </div>
                  </div>
                </div>

              </div>
            )}


            {/* ==================== PRODUCTS CATALOG PAGE ==================== */}
            {activePage === 'products' && (
              <div className="space-y-8 text-left">
                
                {/* Header title */}
                <div>
                  <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white">Our Product Catalog</h1>
                  <p className="text-sm text-slate-500 mt-1">Browse, search, and filter our genuine inventory. Request quotations or directly inquire on WhatsApp.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                   {/* Left filter drawer column */}
                  <div className="lg:col-span-3 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl premium-shadow">
                    
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Search & Filters</span>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                          setSelectedBrand('All');
                          setSortBy('newest');
                          setPriceRange(maxProductPrice);
                        }}
                        className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                      >
                        Reset All
                      </button>
                    </div>

                    {/* Search query input */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Live search</label>
                      <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search CPU, SKU, name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-7.5 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 dark:text-slate-100 text-[11px] outline-none"
                        />
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                      <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              selectedCategory === cat
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brand Filter */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Brand</label>
                      <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                        {brands.map(brand => (
                          <button
                            key={brand}
                            onClick={() => setSelectedBrand(brand)}
                            className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              selectedBrand === brand
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>Max Price</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">LKR {priceRange.toLocaleString('en-US')}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={maxProductPrice > 0 ? maxProductPrice : 1000000}
                        step="500"
                        value={priceRange}
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1 rounded-lg cursor-pointer bg-slate-200 dark:bg-slate-800"
                      />
                    </div>

                  </div>

                  {/* Right product listings grid column */}
                  <div className="lg:col-span-9 space-y-4">
                    
                    {/* Catalog sorting controls */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-3 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 premium-shadow">
                      <span className="text-[11px] font-bold text-slate-400">
                        Showing <strong className="text-slate-800 dark:text-slate-200">{sortedAndFilteredProducts.length}</strong> available items
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">Sort:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-100 text-[11px] font-semibold outline-none focus:border-indigo-500"
                        >
                          <option value="newest">Newest</option>
                          <option value="priceLow">Price (Low-High)</option>
                          <option value="priceHigh">Price (High-Low)</option>
                          <option value="best">Best Selling</option>
                        </select>
                      </div>
                    </div>

                    {/* Products Grid */}
                    {sortedAndFilteredProducts.length === 0 ? (
                      <div className="text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-12 rounded-2xl premium-shadow space-y-3">
                        <HelpCircle size={32} className="mx-auto text-indigo-500 opacity-40 animate-pulse" />
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No Catalog Products Found</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">No genuine showroom products match your current search constraints. Try resetting the filters.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {sortedAndFilteredProducts.map(product => {
                          const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
                          const discPct = hasDiscount ? Math.round(((product.price - (product.discountedPrice || 0)) / product.price) * 100) : 0;
                          const isOOS = product.isAvailable === false;

                          return (
                            <div
                              key={product.id}
                              onClick={() => setSelectedProduct(product)}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-900/60 transition group flex flex-col justify-between"
                            >
                              <div>
                                {/* Product Image area */}
                                <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
                                  {product.images && product.images.length > 0 ? (
                                    <img 
                                      src={product.images[0]} 
                                      alt={product.name} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <ShoppingBag className="text-slate-300 dark:text-slate-650" size={24} />
                                  )}

                                  {/* Availability tag */}
                                  {isOOS ? (
                                    <span className="absolute top-1.5 left-1.5 bg-slate-100 text-slate-500 text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-slate-200">
                                      OOS
                                    </span>
                                  ) : (
                                    <span className="absolute top-1.5 left-1.5 bg-teal-50 text-teal-700 text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-teal-250">
                                      In Stock
                                    </span>
                                  )}

                                  {hasDiscount && (
                                    <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                                      {discPct}% OFF
                                    </span>
                                  )}
                                </div>

                                {/* Catalog item description details */}
                                <div className="text-left mt-2.5 space-y-1">
                                  <div className="flex justify-between items-center gap-1.5">
                                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate max-w-[60%]">{product.brand || 'Genuine Stock'}</span>
                                    {product.category && (
                                      <span className="text-[7px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 px-1.5 py-0.2 rounded font-mono truncate max-w-[40%]">
                                        {product.category}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="font-bold text-slate-850 dark:text-slate-200 text-xs leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate mt-0.5">{product.name}</h3>
                                  {product.model && <p className="text-[9px] text-slate-400 truncate">Model: <strong className="font-bold">{product.model}</strong></p>}
                                  {product.shortDescription && (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5 leading-snug">
                                      {product.shortDescription}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Price block & view details row */}
                              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                                <div className="text-left flex flex-col">
                                  {hasDiscount ? (
                                    <>
                                      <span className="line-through text-slate-400 font-mono text-[8px]">
                                        LKR {product.price.toLocaleString('en-US')}
                                      </span>
                                      <span className="font-mono text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 leading-tight">
                                        LKR {product.discountedPrice?.toLocaleString('en-US')}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="font-mono text-[11px] font-extrabold text-slate-850 dark:text-slate-100">
                                      LKR {product.price.toLocaleString('en-US')}
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  className="px-2 py-1 bg-indigo-55 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 font-bold rounded-lg text-[9px] flex items-center gap-0.5 border-none cursor-pointer"
                                >
                                  <span>Specs</span>
                                  <ChevronRight size={8} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>

                </div>

              </div>
            )}


            {/* ==================== SERVICES PAGE ==================== */}
            {activePage === 'services' && (
              <div className="space-y-12 text-left">
                
                <div className="max-w-xl">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest font-mono">Expert Solutions</span>
                  <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white mt-1">Our Showroom Services</h1>
                  <p className="text-sm text-slate-500 mt-1">We don't just sell components; we provide end-to-end configuration, corporate optimization support, and technical diagnostics backup.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {servicesList.map((service, index) => (
                    <div 
                      key={service.id || index} 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 sm:p-8 space-y-4 premium-shadow flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center">
                          {renderServiceIcon(service.iconName)}
                        </div>
                        <h3 className="text-lg font-display font-bold text-slate-850 dark:text-slate-100">{service.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{service.description}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">PRICE INFO</span>
                        <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
                          {service.priceInfo || 'Inquire'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* FAQ section */}
                <div className="bg-slate-100 dark:bg-slate-900/40 rounded-3xl p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
                  <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 border-b border-slate-250 pb-2">Frequently Asked Services Questions</h3>
                  
                  <div className="space-y-4 text-xs leading-relaxed">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 dark:text-white">How long do diagnostics or claims take?</h4>
                      <p className="text-slate-500">Normally standard diagnostics are completed on-site within 24 hours. Warranty claim replacements coordinate through official distributors and might take 3-7 business days depending on part availability.</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 dark:text-white">Do you build custom gaming workstations?</h4>
                      <p className="text-slate-500">Yes! We specialize in tailored hardware builds. You can select individual components from our Products catalog, compile a Quotation cart, or directly chat with us on WhatsApp to define customized cooling and specifications.</p>
                    </div>
                  </div>
                </div>

              </div>
            )}


            {/* ==================== ABOUT US PAGE ==================== */}
            {activePage === 'about' && (
              <div className="space-y-12 text-left max-w-4xl mx-auto">
                
                {/* Intro */}
                <div className="space-y-4">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest font-mono">Our Narrative</span>
                  <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white">About Our Enterprise</h1>
                  <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                    {profile.introduction || "Founded on principles of technical honesty and genuine hardware distribution, we have grown into Sri Lanka's leading independent computer catalog. We maintain high standards in sourcing laptops, custom gaming components, and high-performance server accessories directly from official manufacturing channels."}
                  </p>
                </div>

                {/* Slogan details and Experience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 sm:p-8 rounded-2xl premium-shadow space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Award size={16} />
                      <span>Experience Record</span>
                    </h3>
                    <p className="text-sm font-extrabold text-slate-850 dark:text-slate-200 leading-snug">
                      {profile.experience || "Over 15+ years of trusted hardware sales and on-site repair configurations in Sri Lanka."}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">We support local corporates, academic institutions, and independent creators with highly durable computer architectures backed by genuine warranty support.</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 sm:p-8 rounded-2xl premium-shadow space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Star size={16} className="fill-indigo-600 dark:fill-indigo-400 stroke-none" />
                      <span>Uncompromising Slogan</span>
                    </h3>
                    <p className="text-sm font-extrabold text-slate-850 dark:text-slate-200 leading-snug">
                      "{profile.slogan || 'Your premium hardware vendor in Sri Lanka'}"
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">True customer trust is built by delivering exactly what we promise. No refurbished compromises, no counterfeit parts. Just sheer high-performance setups.</p>
                  </div>
                </div>

                {/* Vision & Mission bento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-indigo-900 text-white p-6 sm:p-10 rounded-3xl space-y-3 text-left relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-indigo-500/10 rounded-full blur-2xl" />
                    <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-300 font-extrabold">01 / OUR VISION</span>
                    <h3 className="text-xl font-display font-bold">To Pioneer Hardware Trust</h3>
                    <p className="text-xs text-slate-350 leading-relaxed">
                      {profile.vision || "To become Sri Lanka's most trusted premium computer catalog and component distributor, acknowledged for our uncompromising genuine products policy and instant corporate quotation billing."}
                    </p>
                  </div>

                  <div className="bg-slate-900 text-white p-6 sm:p-10 rounded-3xl space-y-3 text-left relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-indigo-500/10 rounded-full blur-2xl" />
                    <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-extrabold">02 / OUR MISSION</span>
                    <h3 className="text-xl font-display font-bold">Empowering Operations with Tech</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {profile.mission || "To deliver top-tier computing parts, laptops, and custom diagnostic solutions while enabling corporate operators to compile and verify transaction records with real-time speed."}
                    </p>
                  </div>
                </div>

              </div>
            )}


            {/* ==================== CONTACT US PAGE ==================== */}
            {activePage === 'contact' && (
              <div className="space-y-12 text-left">
                
                <div className="max-w-xl">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest font-mono">Get In Touch</span>
                  <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white mt-1">Contact Showroom</h1>
                  <p className="text-sm text-slate-500 mt-1">Visit our physical store for custom builds, claim claims directly, or message our managers on WhatsApp.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Form */}
                  <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 sm:p-8 rounded-2xl premium-shadow">
                    
                    {contactSuccess ? (
                      <div className="py-12 text-center space-y-3 animate-fadeIn">
                        <Check className="mx-auto text-emerald-600 h-10 w-10 bg-emerald-50 rounded-full p-2" />
                        <h4 className="font-bold text-slate-850 dark:text-slate-100">Message Dispatched Successfully</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">Thank you for your showroom enquiry. Our hardware managers will review your details and phone you within 2-3 hours.</p>
                        <button
                          onClick={() => setContactSuccess(false)}
                          className="px-4 py-2 text-xs font-bold text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-50/50 mt-2 bg-transparent cursor-pointer"
                        >
                          Send Another Message
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono mb-2">Showroom Inquiry Form</span>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Your Name</label>
                            <input
                              type="text"
                              required
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              placeholder="e.g. Kosala Herath"
                              className="w-full px-3.5 py-2 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-100 text-xs outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Your Email</label>
                            <input
                              type="email"
                              required
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              placeholder="e.g. customer@gmail.com"
                              className="w-full px-3.5 py-2 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-100 text-xs outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase">Enquiry Message</label>
                          <textarea
                            required
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            placeholder="Detail your computer upgrade, corporate pricing request, or hardware claims inquiry here..."
                            rows={4}
                            className="w-full px-3.5 py-2 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-100 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm"
                        >
                          <Send size={13} />
                          <span>Dispatch Enquiry Form</span>
                        </button>
                      </form>
                    )}

                  </div>

                  {/* Info details */}
                  <div className="md:col-span-5 space-y-6">
                    
                    {/* Visual maps card */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
                      <span className="text-[10px] text-indigo-400 font-mono font-bold tracking-wider uppercase">Showroom Location</span>
                      <h4 className="font-bold text-sm">Colombo Physical Store</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {profile.address || "102, Galle Road, Colombo 03, Sri Lanka"}
                      </p>
                      
                      {/* Show map illustration vector */}
                      <div className="h-28 bg-slate-850 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden p-4 text-center">
                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        <div className="space-y-1">
                          <MapPin size={18} className="text-indigo-400 mx-auto" />
                          <span className="text-[10px] block font-mono text-slate-400">Map coordinate pinpoint:</span>
                          <span className="text-[9px] block text-slate-500">6.9142° N, 79.8488° E</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick contacts */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl premium-shadow space-y-4">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Showroom Directory</span>
                      
                      <div className="space-y-3.5 text-xs text-slate-650 dark:text-slate-300">
                        <div className="flex items-center gap-3">
                          <Phone className="text-indigo-600 dark:text-indigo-400" size={16} />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Phone Hotline</span>
                            <span className="font-semibold">{profile.phone || '+94 11 234 5678'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Mail className="text-indigo-600 dark:text-indigo-400" size={16} />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Direct Email</span>
                            <span className="font-semibold">{profile.email || 'orders@apexhub.lk'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-850">
                          <MessageSquare className="text-indigo-600 dark:text-indigo-400 shrink-0" size={16} />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Direct WhatsApp Link</span>
                            <a
                              href={`https://wa.me/${profile.whatsappNumber || '94771234567'}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                            >
                              Open WhatsApp Chat →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}


            {/* ==================== COMPILING QUOTATION REQUEST CART ==================== */}
            {activePage === 'quote' && (
              <div className="space-y-12 text-left">
                
                <div className="max-w-xl">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest font-mono">Interactive Quotation cart</span>
                  <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white mt-1">Compile Quote Request</h1>
                  <p className="text-sm text-slate-500 mt-1">Pick hardware items directly from our catalog directory, set specific quantities, and submit your request directly to our secure ledger database.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Cart and compilation list */}
                  <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 sm:p-8 rounded-2xl premium-shadow space-y-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Quotation Items List</span>
                    
                    {quoteItems.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <ShoppingBag size={32} className="mx-auto text-slate-300 dark:text-slate-750" />
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">Your Quotation Cart is Empty</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">Browse our showroom catalog directory and click "Request a Quote" on any item to load it into this compilation cart.</p>
                        <button
                          onClick={() => setActivePage('products')}
                          className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl border-none cursor-pointer shadow-sm"
                        >
                          Explore Products Catalog
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="divide-y divide-slate-100 dark:divide-slate-850">
                          {quoteItems.map((item) => {
                            const activePrice = item.product.discountedPrice || item.product.price;
                            const total = activePrice * item.quantity;
                            
                            return (
                              <div key={item.product.id} className="py-3.5 flex justify-between items-start gap-4">
                                <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 flex items-center justify-center shrink-0">
                                  {item.product.images && item.product.images.length > 0 ? (
                                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <ShoppingBag size={15} className="text-slate-400" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <h4 className="font-bold text-xs text-slate-850 dark:text-slate-100 truncate">{item.product.name}</h4>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    <span>Code: {item.product.code}</span>
                                    {item.product.brand && <span className="ml-2">Brand: {item.product.brand}</span>}
                                  </div>
                                  <div className="text-[11px] font-mono font-semibold text-slate-500">
                                    LKR {activePrice.toLocaleString('en-US')} × {item.quantity}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-7 bg-slate-50 dark:bg-slate-800">
                                    <button 
                                      type="button"
                                      onClick={() => handleUpdateQuoteQty(item.product.id, item.quantity - 1)}
                                      className="px-2 font-bold hover:bg-slate-150 text-slate-500 h-full border-none cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="px-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{item.quantity}</span>
                                    <button 
                                      type="button"
                                      onClick={() => handleUpdateQuoteQty(item.product.id, item.quantity + 1)}
                                      className="px-2 font-bold hover:bg-slate-150 text-slate-500 h-full border-none cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>

                                  <div className="text-right min-w-20">
                                    <span className="font-mono text-xs font-black text-slate-850 dark:text-slate-100">
                                      LKR {total.toLocaleString('en-US')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Sum block */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">Estimated Subtotal (LKR)</span>
                          <span className="font-mono text-base font-black text-indigo-650 dark:text-indigo-400">
                            LKR {quoteItems.reduce((sum, item) => sum + ((item.product.discountedPrice || item.product.price) * item.quantity), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Submission Form Column */}
                  <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl premium-shadow text-left">
                    
                    {quoteSuccess ? (
                      <div className="py-8 text-center space-y-4 animate-fadeIn">
                        <Check className="mx-auto text-emerald-600 h-12 w-12 bg-emerald-50 rounded-full p-2.5 animate-pulse" />
                        <h4 className="font-bold text-slate-850 dark:text-slate-100">Quote Submitted Successfully!</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Your quote request has been uploaded directly to our cloud ledger database. One of our showroom staff operators will coordinate your components and send you a certified PDF quotation via email and WhatsApp.
                        </p>
                        <div className="flex flex-col gap-2 pt-2">
                          <button
                            onClick={() => {
                              setQuoteSuccess(false);
                              setActivePage('products');
                            }}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold border-none cursor-pointer"
                          >
                            Explore More Hardware
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleFormSubmitQuote} className="space-y-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Quotation Customer Details</span>
                        
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase">Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ruwan Sanjaya"
                            value={quoteName}
                            onChange={(e) => setQuoteName(e.target.value)}
                            className="w-full px-3 py-2 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-100 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase">Contact Phone Number *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. +94 77 123 4567"
                            value={quotePhone}
                            onChange={(e) => setQuotePhone(e.target.value)}
                            className="w-full px-3 py-2 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-100 text-xs font-mono outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase">Email Address (Optional)</label>
                          <input
                            type="email"
                            placeholder="e.g. srilanka@gmail.com"
                            value={quoteEmail}
                            onChange={(e) => setQuoteEmail(e.target.value)}
                            className="w-full px-3 py-2 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-100 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-indigo-650 dark:text-indigo-450 uppercase">Other Services & Additional Requirements (Custom Requests)</label>
                          <textarea
                            placeholder="Add other services and other things you want here. Our team will prepare and add them to your final quotation..."
                            value={quoteNotes}
                            onChange={(e) => setQuoteNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-100 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={quoteItems.length === 0 || isSubmittingQuote}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                          <FileText size={13} />
                          <span>{isSubmittingQuote ? 'Registering Quotation...' : 'Submit Quotation Request'}</span>
                        </button>
                      </form>
                    )}

                  </div>

                </div>

              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>


      {/* 3. PRODUCT DETAILS MODAL VIEW */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in text-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-8"
            >
              
              {/* Header */}
              <div className="p-4 sm:px-6 border-b border-slate-150 dark:border-slate-850 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded uppercase">
                    SKU: {selectedProduct.code}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setActiveImageIndex(0);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition bg-transparent border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
                
                {/* Images Column */}
                <div className="md:col-span-5 space-y-4">
                  {/* Primary view */}
                  <div className="aspect-square bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <img 
                        src={selectedProduct.images[activeImageIndex] || selectedProduct.images[0]} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ShoppingBag size={48} className="text-slate-300" />
                    )}

                    {selectedProduct.isBestSeller && (
                      <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Best Seller
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                      {selectedProduct.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIndex(i)}
                          className={`h-11 w-11 shrink-0 rounded-lg overflow-hidden border bg-white dark:bg-slate-800 cursor-pointer p-0 ${
                            activeImageIndex === i 
                              ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <img src={img} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Direct Contact info */}
                  <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed">
                    <p className="font-bold flex items-center gap-1 mb-1">
                      <Info size={13} className="shrink-0" />
                      <span>Direct Warranty claims Support</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">All laptop modules include full brand company backing coordination with claim replacements directly handled by Colombo offices.</p>
                  </div>
                </div>

                {/* Details Column */}
                <div className="md:col-span-7 space-y-5">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 tracking-widest block">{selectedProduct.category || 'Genuine Showroom stock'}</span>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-slate-850 dark:text-white leading-tight">{selectedProduct.name}</h2>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      {selectedProduct.brand && (
                        <span className="font-semibold text-slate-500">
                          Brand: <strong className="text-slate-800 dark:text-slate-200">{selectedProduct.brand}</strong>
                        </span>
                      )}
                      {selectedProduct.model && (
                        <span className="font-semibold text-slate-500 border-l border-slate-200 pl-2">
                          Model: <strong className="text-slate-800 dark:text-slate-200">{selectedProduct.model}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & availability */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Showroom Pricing</span>
                      <div className="flex items-center gap-2">
                        {selectedProduct.discountedPrice && selectedProduct.discountedPrice < selectedProduct.price ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">
                              LKR {selectedProduct.discountedPrice.toLocaleString('en-US')}
                            </span>
                            <span className="line-through text-xs font-mono text-slate-400">
                              LKR {selectedProduct.price.toLocaleString('en-US')}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-base font-black text-slate-850 dark:text-slate-100">
                            LKR {selectedProduct.price.toLocaleString('en-US')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                      {selectedProduct.isAvailable !== false ? (
                        <span className="text-[10px] bg-teal-50 text-teal-700 font-extrabold px-2.5 py-0.5 rounded-full border border-teal-200 uppercase font-mono">
                          In Stock
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-400 font-extrabold px-2.5 py-0.5 rounded-full border border-slate-200 uppercase font-mono">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Slogan & Descriptions */}
                  {selectedProduct.shortDescription && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Overview</span>
                      <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed">
                        {selectedProduct.shortDescription}
                      </p>
                    </div>
                  )}

                  {/* Specifications grid derived from customFields */}
                  {selectedProduct.customFields && selectedProduct.customFields.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Technical Specifications</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/50 dark:bg-slate-800/10 border border-slate-150 dark:border-slate-800 p-3.5 rounded-xl">
                        {selectedProduct.customFields.map((f) => (
                          <div key={f.id} className="text-xs flex gap-2 border-b border-slate-100 dark:border-slate-850/50 pb-1.5 justify-between">
                            <span className="text-slate-400 font-bold uppercase text-[9px]">{f.name}:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warranty and Package inclusions info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {selectedProduct.warranty && (
                      <div className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Official Warranty</span>
                        <strong className="text-slate-800 dark:text-slate-200 block mt-1">{selectedProduct.warranty}</strong>
                      </div>
                    )}
                    {selectedProduct.packageIncludes && (
                      <div className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Package Contains</span>
                        <strong className="text-slate-800 dark:text-slate-200 block mt-1">{selectedProduct.packageIncludes}</strong>
                      </div>
                    )}
                  </div>

                  {/* Interactive actions */}
                  <div className="pt-4 border-t border-slate-150 dark:border-slate-850 grid grid-cols-2 gap-3.5">
                    {/* Quotation Compile */}
                    <button
                      onClick={() => handleAddToQuote(selectedProduct)}
                      disabled={selectedProduct.isAvailable === false}
                      className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText size={13} />
                      <span>Request Quote</span>
                    </button>

                    {/* WhatsApp Coordinate enquiry */}
                    <a
                      href={getWhatsAppInquiryUrl(selectedProduct)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-750 dark:text-indigo-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-center"
                    >
                      <MessageSquare size={13} />
                      <span>Inquire on WhatsApp</span>
                    </a>
                  </div>

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. PUBLIC FOOTER */}
      <footer className="bg-slate-900 text-white mt-16 border-t border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-left text-xs text-slate-400">
          
          <div className="space-y-3 md:col-span-1">
            <h4 className="font-display font-black text-sm text-white">{profile.name || 'Biyanka Store'}</h4>
            <p className="leading-relaxed text-[11px]">
              {profile.slogan || 'Premium computer and technology components directory.'}
            </p>
            <p className="font-mono text-[10px] text-slate-500">© 2026 Enterprise. All Rights Reserved.</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider text-[10px] text-indigo-400">Explore Storefront</h4>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setActivePage('home'); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-left hover:text-white cursor-pointer bg-transparent border-none p-0">Home Landing</button>
              <button onClick={() => { setActivePage('products'); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-left hover:text-white cursor-pointer bg-transparent border-none p-0">Hardware Directory</button>
              <button onClick={() => { setActivePage('services'); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-left hover:text-white cursor-pointer bg-transparent border-none p-0">Specialist Services</button>
              <button onClick={() => { setActivePage('about'); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-left hover:text-white cursor-pointer bg-transparent border-none p-0">Vision & Mission</button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider text-[10px] text-indigo-400">Colombo Showroom</h4>
            <p className="leading-relaxed text-[11px] font-sans">
              {profile.address || "102, Galle Road, Colombo 03, Sri Lanka"}
            </p>
            <p className="font-semibold text-white">Hotline: {profile.phone || '+94 11 234 5678'}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider text-[10px] text-indigo-400">Secured Ledger</h4>
            <p className="leading-relaxed text-[11px]">
              Our quotations and invoices undergo rigorous cloud transaction verification directly through centralized ledger databases.
            </p>
            <button
              onClick={onOpenLogin}
              className="text-xs font-bold text-white hover:underline block text-left bg-transparent border-none cursor-pointer p-0"
            >
              Operator Control login →
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
}

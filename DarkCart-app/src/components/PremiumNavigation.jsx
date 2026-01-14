import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const PremiumNavigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Shop', href: '/shop' },
    { name: 'Collections', href: '/collections' },
    { name: 'Lookbook', href: '/lookbook' },
    { name: 'About', href: '/about' },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-black/80 backdrop-blur-md border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="text-white text-2xl font-light tracking-widest uppercase"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <span className="group-hover:tracking-wider transition-all duration-300">
                Casual
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  to={item.href}
                  className={`relative text-sm tracking-wider uppercase transition-all duration-300 group ${
                    location.pathname === item.href
                      ? 'text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <span className="group-hover:tracking-widest transition-all duration-300">
                    {item.name}
                  </span>
                  
                  {/* Underline Animation */}
                  <span className={`absolute bottom-0 left-0 h-px bg-white transition-all duration-300 ${
                    location.pathname === item.href
                      ? 'w-full'
                      : 'w-0 group-hover:w-full'
                  }`} />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-white p-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default PremiumNavigation;

import React, { useState, useEffect, useRef } from "react";
import Search from "./Search";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaGift, FaPercentage, FaFire, FaLeaf, FaTshirt, FaFemale, FaChild, FaGem, FaRegHeart, FaRupeeSign, FaMapMarkerAlt } from "react-icons/fa";
import useMobile from "../hooks/useMobile";
import { BsCartCheckFill } from "react-icons/bs";
import { useSelector, useDispatch } from "react-redux";
import { GoTriangleDown, GoTriangleUp } from "react-icons/go";
import UserMenue from "./UserMenue";
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees";
import { useGlobalContext } from "../provider/GlobalProvider";
import isAdmin from "../utils/isAdmin";
import { logout } from "../store/userSlice";
import { clearCart } from "../store/cartProduct";
import men from '../assets/men.png';
import women from '../assets/women.png';
import kids from '../assets/kids.png';
import "../App.css";
import logo from "../assets/logo.png";
import AxiosTostError from "../utils/AxiosTostError";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import toast from "react-hot-toast";

const FashionLogo = () => {
  return (
    <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
      <img
        src={logo}
        alt="Logo"
        className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 xl:w-14 xl:h-14 object-contain"
      />
      <div className="flex flex-col min-w-0">
        <span 
          className="text-sm xs:text-base sm:text-lg md:text-lg lg:text-lg xl:text-xl text-black tracking-wider leading-tight truncate"
          style={{ 
            fontFamily: "'Inter', sans-serif",
            fontWeight: '300',
            letterSpacing: '0.08em',
          }}
        >
          CASUAL CLOTHINGS
        </span>
        <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-500 tracking-widest uppercase truncate"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Fashion
        </span>
      </div>
    </div>
  );
};

function Header() {
  const ismobile = useMobile();
  const location = useLocation();
  const isSearch = location.pathname === "/search";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showUserMenue, setShowUserMenue] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPrimeDealsDropdown, setShowPrimeDealsDropdown] = useState(false);
  const [showFashionDropdown, setShowFashionDropdown] = useState(false);
  const cartItem = useSelector((state) => state.cartItem.cart);
  const user = useSelector((state) => state?.user);
  const { totalPrice, totalQty, openCartSection, setOpenCartSection } = useGlobalContext();
  const userMenuRef = useRef(null);
  const userMenuButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const primeDealsRef = useRef(null);
  const fashionMenuRef = useRef(null);
  const prevPathRef = useRef(location.pathname);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showUserMenue && 
        userMenuRef.current && 
        !userMenuRef.current.contains(event.target) &&
        userMenuButtonRef.current &&
        !userMenuButtonRef.current.contains(event.target)
      ) {
        setShowUserMenue(false);
      }
    };

    const handleRouteChange = () => {
      setShowUserMenue(false);
    };

    const handleResize = () => {
      setShowUserMenue(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, [showUserMenue, location.pathname]);
  
  // Close fashion/prime deals dropdowns when route changes
  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      setShowFashionDropdown(false);
      setShowPrimeDealsDropdown(false);
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  const handleUserMenu = () => {
    setShowUserMenue(false);
  };

  const handleLogout = async() => {
      try {
            const response = await Axios({...SummaryApi.userLogOut})
            console.log("Logout Response:",response)
            if(response.data.success){
                if(close){
                    close()
                }
                toast.success("Logged out successfully")
                dispatch(logout())
                localStorage.clear()
                navigate("/")
            }
        } catch (error) {
            console.error("Logout Error:", error);
            AxiosTostError(error)       
        }
  }

  const handleLoginNavigate = () => {
    if (!user?._id) {
      navigate("/login");
      return;
    }
    navigate("/user-menu-mobile");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userMenuRef.current && 
        !userMenuRef.current.contains(event.target) && 
        !event.target.closest('.account-menu-trigger')
      ) {
        setShowUserMenue(false);
      }
      
      // Close mobile menu when clicking outside, but not when clicking on the menu itself or trigger
      if (
        mobileMenuOpen &&
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('.mobile-menu-trigger')
      ) {
        setMobileMenuOpen(false);
      }
      
      // Close Prime Deals dropdown when clicking outside
      if (
        showPrimeDealsDropdown &&
        primeDealsRef.current && 
        !primeDealsRef.current.contains(event.target) && 
        !event.target.closest('.prime-deals-trigger')
      ) {
        setShowPrimeDealsDropdown(false);
      }
      
      // Close Fashion dropdown when clicking outside
      if (
        showFashionDropdown &&
        fashionMenuRef.current && 
        !fashionMenuRef.current.contains(event.target) && 
        !event.target.closest('.fashion-menu-trigger')
      ) {
        setShowFashionDropdown(false);
      }
    };

    const handleRouteChange = () => {
      setShowUserMenue(false);
      setMobileMenuOpen(false);
      setShowPrimeDealsDropdown(false);
      setShowFashionDropdown(false);
    };

    const handleResize = () => {
      setShowUserMenue(false);
      setShowPrimeDealsDropdown(false);
      setShowFashionDropdown(false);
      // Only close mobile menu on resize if needed
      if (window.innerWidth >= 1280) { // xl breakpoint in Tailwind
        setMobileMenuOpen(false);
      }
    };

    // Add event listener with a small delay to prevent immediate closure
    const addDelayedEventListener = () => {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
    };

    addDelayedEventListener();
    window.addEventListener("resize", handleResize);
    
    // Don't close menus on component mount, only on actual route changes
    if (location.pathname !== prevPathRef.current) {
      handleRouteChange();
      prevPathRef.current = location.pathname;
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, [location.pathname, mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white shadow-sm border-b border-gray-100">
        {/* Premium Top Banner with Modern Icons */}
        {/* <div className="bg-black text-white overflow-hidden w-full relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/30 to-black/40 backdrop-blur-[0.5px]"></div>
          <div className="animate-marquee whitespace-nowrap py-1.5 md:py-2 w-full relative z-10">
            <span className="mx-6 text-xs sm:text-sm inline-flex items-center tracking-wider" style={{ fontFamily: "'Inter', sans-serif", fontWeight: '300' }}>
              <svg className="w-3.5 h-3.5 mr-2 text-white/80" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Free shipping on orders over ₹2,499
            </span>
            <span className="mx-6 text-xs sm:text-sm inline-flex items-center tracking-wider" style={{ fontFamily: "'Inter', sans-serif", fontWeight: '300' }}>
              <FaGift className="mr-2 text-white/80" size={14} />
              Easy 30-day returns
            </span>
            <span className="mx-6 text-xs sm:text-sm inline-flex items-center tracking-wider" style={{ fontFamily: "'Inter', sans-serif", fontWeight: '300' }}>
              <FaFire className="mr-2 text-white/80" size={14} />
              New arrivals every week
            </span>
            <span className="mx-6 text-xs sm:text-sm inline-flex items-center tracking-wider" style={{ fontFamily: "'Inter', sans-serif", fontWeight: '300' }}>
              <svg className="w-3.5 h-3.5 mr-2 text-white/80" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Exclusive member discounts
            </span>
          </div>
        </div> */}

        <div className="w-full px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
          <nav className="flex items-center justify-between w-full">
            {/* Premium Logo Area with Subtle Hover Effect */}
            <Link 
              to="/" 
              className="flex-shrink-0 py-2 md:py-3 lg:py-4 group relative overflow-hidden"
              onMouseEnter={() => {
                setShowPrimeDealsDropdown(false);
                setShowFashionDropdown(false);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-lg transform translate-x-full group-hover:translate-x-0"></div>
              <FashionLogo />
            </Link>

            {/* Desktop Navigation Links - Hidden below xl breakpoint, only visible on xl screens and up */}
            <div className="hidden xl:flex items-center space-x-8 xl:space-x-12 px-3 xl:px-6">
              {/* Prime Deals Dropdown */}
              <div className="relative" ref={primeDealsRef}>
                <button
                  className="nav-link py-2 px-1 border-b border-transparent hover:border-black text-gray-800 hover:text-black text-sm xl:text-base whitespace-nowrap transition-all duration-300 flex items-center prime-deals-trigger group"
                  style={{ 
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '300',
                    letterSpacing: '0.08em',
                  }}
                  onMouseEnter={() => {
                    setShowPrimeDealsDropdown(true);
                    setShowFashionDropdown(false);
                  }}
                  onClick={() => setShowPrimeDealsDropdown(!showPrimeDealsDropdown)}
                  aria-expanded={showPrimeDealsDropdown}
                  aria-haspopup="true"
                >
                  <span className="flex items-center group-hover:translate-y-[-1px] transition-transform duration-300">
                    PRIME DEALS
                  </span>
                  <svg className={`w-4 h-4 ml-1 transition-transform duration-200 ${showPrimeDealsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {/* Premium Styled Prime Deals Dropdown Menu */}
                {showPrimeDealsDropdown && (
                  <div 
                    className="absolute top-full left-0 mt-1 bg-white shadow-2xl rounded-lg w-60 py-4 z-50 border border-gray-100 animate-fadeIn"
                    style={{ backdropFilter: 'blur(10px)' }}
                    onMouseEnter={() => setShowPrimeDealsDropdown(true)}
                    onMouseLeave={() => setShowPrimeDealsDropdown(false)}
                    role="menu"
                  >
                    <div className="px-5 py-2">
                      <h3 
                        className="text-sm border-b border-gray-100 pb-2 mb-2 tracking-wider"
                        style={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: '400',
                          letterSpacing: '0.05em',
                        }}
                      >
                        MORE OFFERS
                      </h3>
                    </div>

                    <Link to="/bundle-offers" className="flex items-center px-5 py-2.5 text-gray-700 hover:bg-black hover:text-white text-sm transition-all duration-300 group">
                      <span 
                        className="group-hover:translate-x-0.5 transition-transform duration-300"
                        style={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: '300',
                          letterSpacing: '0.03em',
                        }}
                      >
                        Bundle Offers
                      </span>
                    </Link>
                    <Link to="/seasonal-sale" className="flex items-center px-5 py-2.5 text-gray-700 hover:bg-black hover:text-white text-sm transition-all duration-300 group">
                      <span 
                        className="group-hover:translate-x-0.5 transition-transform duration-300"
                        style={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: '300',
                          letterSpacing: '0.03em',
                        }}
                      >
                        Seasonal Sale
                      </span>
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Fashion Dropdown */}
              <div className="relative" ref={fashionMenuRef}>
                <button
                  className="nav-link py-2 px-1 border-b border-transparent hover:border-black text-gray-800 hover:text-black text-sm xl:text-base whitespace-nowrap transition-all duration-300 flex items-center fashion-menu-trigger group"
                  style={{ 
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '300',
                    letterSpacing: '0.08em',
                  }}
                  onMouseEnter={() => {
                    setShowFashionDropdown(true);
                    setShowPrimeDealsDropdown(false);
                  }}
                  onClick={() => setShowFashionDropdown(!showFashionDropdown)}
                  aria-expanded={showFashionDropdown}
                  aria-haspopup="true"
                >
                  <span className="flex items-center group-hover:translate-y-[-1px] transition-transform duration-300">
                    FASHION
                  </span>
                  <svg className={`w-4 h-4 ml-1 transition-transform duration-200 ${showFashionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {/* Premium Fashion Dropdown Menu */}
                {showFashionDropdown && (
                  <div 
                    className="absolute top-full left-0 mt-1 bg-white shadow-2xl rounded-lg py-4 z-50 border border-gray-100 animate-fadeIn overflow-hidden w-72"
                    style={{ backdropFilter: 'blur(10px)' }}
                    onMouseEnter={() => setShowFashionDropdown(true)}
                    onMouseLeave={() => setShowFashionDropdown(false)}
                    role="menu"
                  >
                    <div className="px-5 py-2">
                      <h3 
                        className="text-sm border-b border-gray-100 pb-2 mb-2 tracking-wider"
                        style={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: '400',
                          letterSpacing: '0.05em',
                        }}
                      >
                        SHOP BY CATEGORY
                      </h3>
                    </div>
                    <div className="px-5 py-2 grid grid-cols-3 gap-2">
                      <Link to="/search?gender=Men" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-black/5 transition-all duration-300 group">
                        <div className="w-16 h-16 overflow-hidden transition-transform duration-500 group-hover:scale-105">
                          <img 
                            src= {men} 
                            alt="Men" 
                            className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500" 
                          />
                        </div>
                        <span 
                          className="text-sm text-gray-700 group-hover:text-black transition-all duration-300"
                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.03em',
                          }}
                        >
                          Men
                        </span>
                      </Link>
                      <Link to="/search?gender=Women" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-black/5 transition-all duration-300 group">
                        <div className="w-16 h-16 overflow-hidden transition-transform duration-500 group-hover:scale-105">
                          <img 
                            src={women} 
                            alt="Women" 
                            className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500" 
                          />
                        </div>
                        <span 
                          className="text-sm text-gray-700 group-hover:text-black transition-all duration-300"
                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.03em',
                          }}
                        >
                          Women
                        </span>
                      </Link>
                      <Link to="/search?gender=Kids" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-black/5 transition-all duration-300 group">
                        <div className="w-16 h-16 overflow-hidden transition-transform duration-500 group-hover:scale-105">
                          <img 
                            src={kids} 
                            alt="Kids" 
                            className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500" 
                          />
                        </div>
                        <span 
                          className="text-sm text-gray-700 group-hover:text-black transition-all duration-300"
                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.03em',
                          }}
                        >
                          Kids
                        </span>
                      </Link>
                    </div>
                    <div className="mt-3 bg-black/5 px-5 py-2.5">
                      <Link to="/search" className="text-xs flex justify-between items-center text-gray-600 hover:text-black transition-colors duration-300">
                        <span 
                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.05em',
                          }}
                        >
                          VIEW ALL COLLECTIONS
                        </span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <Link
                to="/about"
                className="nav-link py-2 px-1 border-b border-transparent hover:border-black text-gray-800 hover:text-black text-sm xl:text-base whitespace-nowrap transition-all duration-300 group"
                style={{ 
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: '300',
                  letterSpacing: '0.08em',
                }}
                onMouseEnter={() => {
                  setShowPrimeDealsDropdown(false);
                  setShowFashionDropdown(false);
                }}
              >
                <span className="group-hover:translate-y-[-1px] transition-transform duration-300">ABOUT</span>
              </Link>
            </div>
            
            {/* Desktop Search - Innovative Glass Effect with Animation - Only on xl screens */}
            <div 
              className="hidden xl:block flex-1 min-w-[200px] w-full max-w-md xl:max-w-lg mx-2 xl:mx-6"
              onMouseEnter={() => {
                setShowPrimeDealsDropdown(false);
                setShowFashionDropdown(false);
              }}
            >
              <div className="search-container relative w-full">
                <div className="absolute inset-0 bg-white rounded-full opacity-90"></div>
                <div className="absolute inset-0 border border-gray-200 hover:border-black transition-colors duration-300 rounded-full shadow-sm"></div>
                <div className="absolute inset-[-1px] bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 search-highlight rounded-full"></div>
                <div className="relative z-10">
                  <Search />
                </div>
              </div>
            </div>

            {/* Right Actions Area with Interactions */}
            <div 
              className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6 py-3 md:py-4 flex-shrink-0"
              onMouseEnter={() => {
                setShowPrimeDealsDropdown(false);
                setShowFashionDropdown(false);
              }}
            >
              {/* Mobile & Tablet Actions - Icon Only for Cleaner Layout (visible up to xl breakpoint) */}
              <div className="xl:hidden flex items-center gap-2.5 sm:gap-3 md:gap-3.5">
                {/* Cart Button for Mobile/Tablet - Premium Styled */}
                {user?._id && (
                  <button
                    className="relative p-2.5 flex items-center justify-center border border-gray-200 hover:border-black hover:bg-black transition-all duration-300 rounded-full group"
                    onClick={() => setOpenCartSection(true)}
                    aria-label="Cart"
                  >
                    <BsCartCheckFill className="w-5 h-5 text-gray-800 group-hover:text-white transition-colors duration-300" />
                    {cartItem.length > 0 && (
                      <span 
                        className="absolute -top-1 -right-1 bg-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {cartItem.length}
                      </span>
                    )}
                  </button>
                )}

                {/* Menu Toggle for Mobile */}
                <div className="relative">
                  <button 
                    className="p-2.5 rounded-full border border-gray-200 hover:border-black hover:bg-black transition-all duration-300 mobile-menu-trigger group"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setMobileMenuOpen(!mobileMenuOpen);
                    }}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-menu"
                  >
                    {mobileMenuOpen ? (
                      <svg className="w-5 h-5 text-gray-800 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-800 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Premium Mobile Menu Dropdown */}
                  <div 
                    ref={mobileMenuRef}
                    className={`absolute top-full right-0 mt-2 bg-white shadow-2xl border border-gray-100 rounded-lg py-2 z-50 min-w-[280px] transition-all duration-300 overflow-hidden ${
                      mobileMenuOpen 
                        ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' 
                        : 'opacity-0 -translate-y-2 pointer-events-none scale-95'
                    }`}
                    style={{ 
                      visibility: mobileMenuOpen ? 'visible' : 'hidden',
                      transitionDelay: mobileMenuOpen ? '50ms' : '0ms',
                      transformOrigin: 'top right',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div className="py-2 px-5 border-b border-gray-100 mb-1">
                      <p 
                        className="text-xs text-gray-500 uppercase tracking-wider"
                        style={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: '400',
                          letterSpacing: '0.08em',
                        }}
                      >
                        Navigation
                      </p>
                    </div>

                    {/* Profile & Wishlist Section - Mobile with Premium Styling */}
                    <div className="px-3 py-2">
                      {user?.name ? (
                        <Link
                          to="/dashboard/profile"
                          className="flex items-center text-gray-700 hover:text-black hover:bg-black/5 px-4 py-3 text-sm transition-all duration-300 rounded-md group"
                          onClick={() => setTimeout(() => setMobileMenuOpen(false), 200)}
                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.03em',
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                            {user?.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="w-6 h-6 rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="bg-black flex items-center justify-center w-6 h-6 rounded-full group-hover:scale-105 transition-transform duration-300">
                                <span className="text-white text-xs uppercase">
                                  {user.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="tracking-wide">{user.name}</span>
                              <span className="text-xs text-gray-500">My Profile</span>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <Link
                          to="/login"
                          className="flex items-center text-gray-700 hover:text-black hover:bg-black/5 px-4 py-3 text-sm transition-all duration-300 rounded-md group"
                          onClick={() => setTimeout(() => setMobileMenuOpen(false), 200)}
                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.03em',
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <FaUserCircle className="w-6 h-6 text-gray-800 group-hover:scale-105 transition-transform duration-300" />
                            <span className="tracking-wide">Sign In</span>
                          </div>
                        </Link>
                      )}
                      
                      {/* Wishlist - Mobile (only when logged in) with Premium Styling */}
                      {user?.name && (
                        <div>
                           <Link
                          to="/dashboard/wishlist"
                          className="flex items-center text-gray-700 hover:text-black hover:bg-black/5 px-4 py-3 text-sm transition-all duration-300 rounded-md group"
                          onClick={() => setTimeout(() => setMobileMenuOpen(false), 200)}
                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.03em',
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                            {/* <FaRegHeart className="w-5 h-5 text-gray-800 group-hover:scale-110 transition-transform duration-300" /> */}
                            <span className="tracking-wide">My Wishlist</span>
                          </div>
                        </Link>

                         <Link
                          to="/dashboard/myorders"
                          className="flex items-center text-gray-700 hover:text-black hover:bg-black/5 px-4 py-3 text-sm transition-all duration-300 rounded-md group"
                          onClick={() => setTimeout(() => setMobileMenuOpen(false), 200)}
                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.03em',
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                            {/* <FaGift className="w-5 h-5 text-gray-800 group-hover:scale-110 transition-transform duration-300" /> */}
                            <span className="tracking-wide">My Order</span>
                          </div>
                        </Link>

                        <Link
                          to="/dashboard/address"
                          className="flex items-center text-gray-700 hover:text-black hover:bg-black/5 px-4 py-3 text-sm transition-all duration-300 rounded-md group"
                          onClick={() => setTimeout(() => setMobileMenuOpen(false), 200)}
                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.03em',
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                            {/* <FaMapMarkerAlt className="w-5 h-5 text-gray-800 group-hover:scale-110 transition-transform duration-300" /> */}
                            <span className="tracking-wide">My Address</span>
                          </div>
                        </Link>
                        
                        </div>
                      )}

                      {/* Admin Dashboard - Mobile (only for admin users) with Premium Styling */}
                      {user?.name && isAdmin(user.role) && (
                        <Link
                          to="/dashboard/admin"
                          className="flex items-center text-gray-700 hover:text-black hover:bg-black/5 px-4 py-3 text-sm transition-all duration-300 rounded-md group"
                          onClick={() => setTimeout(() => setMobileMenuOpen(false), 200)}
                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.03em',
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <svg className="w-5 h-5 text-gray-800 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <div className="flex flex-col">
                              <span className="tracking-wide">Admin Dashboard</span>
                              <span className="text-xs text-gray-500">Manage your store</span>
                            </div>
                          </div>
                        </Link>
                      )}
                      
                      {/* Logout Button - Mobile (when user is logged in) */}
                      {user?.name && (
                        <button
                          className="flex items-center text-gray-700 hover:text-black hover:bg-black/5 px-4 py-3 text-sm transition-all duration-300 rounded-md group w-full"

                          onClick={handleLogout}

                     

                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.03em',
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                           
                            <span className="tracking-wide">Logout</span>
                          </div>
                        </button>
                      )}
                    </div>

                    <div className="border-b border-gray-100 my-2"></div>
                    
                    {/* Prime Deals Section - Mobile */}
                    <div className="flex flex-col prime-deals-trigger">
                      <button
                        className="flex items-center justify-between text-gray-700 hover:text-black hover:bg-black/5 px-5 py-3 text-sm transition-all duration-300"
                        onClick={() => setShowPrimeDealsDropdown(!showPrimeDealsDropdown)}
                        aria-expanded={showPrimeDealsDropdown}
                        style={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: '300',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <div className="flex items-center">
                          <div className="flex items-center tracking-wide">
                            PRIME DEALS
                          </div>
                        </div>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-300 ${showPrimeDealsDropdown ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      
                      <div 
                        className={`overflow-hidden transition-all duration-300 ${
                          showPrimeDealsDropdown 
                          ? 'max-h-[200px] opacity-100' 
                          : 'max-h-0 opacity-0'
                        }`}
                      >

                        <Link
                          to="/bundle-offers"
                          className="flex items-center text-gray-600 hover:text-black hover:bg-black/5 pl-10 pr-5 py-2.5 text-sm transition-all duration-300"
                          onClick={() => {
                            setShowPrimeDealsDropdown(false);
                            setTimeout(() => setMobileMenuOpen(false), 200);
                          }}
                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.03em',
                          }}
                        >
                          Bundle Offers
                        </Link>
                        <Link
                          to="/seasonal-sale"
                          className="flex items-center text-gray-600 hover:text-black hover:bg-black/5 pl-10 pr-5 py-2.5 text-sm transition-all duration-300"
                          onClick={() => {
                            setShowPrimeDealsDropdown(false);
                            setTimeout(() => setMobileMenuOpen(false), 200);
                          }}
                          style={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: '300',
                            letterSpacing: '0.03em',
                          }}
                        >
                          Seasonal Sale
                        </Link>
                      </div>
                    </div>

                    {/* Fashion Section - Mobile */}
                    <div className="flex flex-col fashion-menu-trigger">
                      <button
                        className="flex items-center justify-between text-gray-700 hover:text-black hover:bg-black/5 px-5 py-3 text-sm transition-all duration-300"
                        onClick={() => setShowFashionDropdown(!showFashionDropdown)}
                        aria-expanded={showFashionDropdown}
                        style={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: '300',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <div className="flex items-center">
                          <div className="flex items-center tracking-wide">
                           
                            FASHION
                          </div>
                        </div>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-300 ${showFashionDropdown ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      
                      <div 
                        className={`overflow-hidden transition-all duration-300 ${
                          showFashionDropdown 
                          ? 'max-h-[200px] opacity-100' 
                          : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="flex flex-col px-5 py-3">
                          <Link
                            to="/search?gender=Men"
                            className="text-gray-700 hover:text-black hover:bg-black/5 py-2 px-3 rounded-md transition-all duration-300"
                            onClick={() => {
                              setShowFashionDropdown(false);
                              setTimeout(() => setMobileMenuOpen(false), 200);
                            }}
                            style={{ 
                              fontFamily: "'Inter', sans-serif",
                              fontWeight: '400',
                              letterSpacing: '0.03em',
                            }}
                          >
                            Men
                          </Link>
                          <Link
                            to="/search?gender=Women"
                            className="text-gray-700 hover:text-black hover:bg-black/5 py-2 px-3 rounded-md transition-all duration-300"
                            onClick={() => {
                              setShowFashionDropdown(false);
                              setTimeout(() => setMobileMenuOpen(false), 200);
                            }}
                            style={{ 
                              fontFamily: "'Inter', sans-serif",
                              fontWeight: '400',
                              letterSpacing: '0.03em',
                            }}
                          >
                            Women
                          </Link>
                          <Link
                            to="/search?gender=Kids"
                            className="text-gray-700 hover:text-black hover:bg-black/5 py-2 px-3 rounded-md transition-all duration-300"
                            onClick={() => {
                              setShowFashionDropdown(false);
                              setTimeout(() => setMobileMenuOpen(false), 200);
                            }}
                            style={{ 
                              fontFamily: "'Inter', sans-serif",
                              fontWeight: '400',
                              letterSpacing: '0.03em',
                            }}
                          >
                            Kids
                          </Link>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/about"
                      className="flex items-center text-gray-700 hover:text-black hover:bg-black/5 px-5 py-3 text-sm transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTimeout(() => setMobileMenuOpen(false), 200);
                      }}
                      style={{ 
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: '300',
                        letterSpacing: '0.05em',
                      }}
                    >
                      ABOUT
                    </Link>
                  </div>
                </div>
                
                {/* Using hamburger menu for all screen sizes up to xl */}
              </div>

              {/* Desktop Actions with Refined Aesthetics - Only visible on xl screens */}
              <div className="hidden xl:flex items-center gap-4 xl:gap-6">
                {/* Account/Login - Desktop - Enhanced Premium Design */}
                {user?.name ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      className="flex items-center gap-3 xl:gap-4 select-none text-gray-800 hover:text-black px-4 xl:px-5 py-2 rounded-full bg-gradient-to-r from-gray-50 via-white to-gray-50 hover:from-gray-100 hover:to-gray-50 transition-all duration-300 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md account-menu-trigger group"
                      onClick={() => setShowUserMenue((prev) => !prev)}
                    >
                      <div className="flex-shrink-0 rounded-full overflow-hidden ring-2 ring-white shadow-md">
                        {user?.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-8 h-8 xl:w-9 xl:h-9 object-cover transition-all duration-500 group-hover:scale-110"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentNode.querySelector('.default-avatar-fallback').style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center w-8 h-8 xl:w-9 xl:h-9 rounded-full default-avatar-fallback ${user?.avatar ? 'hidden' : 'flex'}`}>
                          <span className="text-white font-semibold text-sm xl:text-base uppercase">
                            {user?.name ? user.name.charAt(0) : "?"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0 items-start">
                        <span className="font-medium text-sm xl:text-base whitespace-nowrap truncate max-w-[80px] xl:max-w-[120px]">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-500 group-hover:text-black transition-colors">My Account</span>
                      </div>
                      <div className="ml-1">
                        {showUserMenue ? (
                          <GoTriangleUp className="w-4 h-4 flex-shrink-0 transition-transform duration-300" />
                        ) : (
                          <GoTriangleDown className="w-4 h-4 flex-shrink-0 transition-transform duration-300" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full"></div>
                    </button>
                    {showUserMenue && (
                      <div className="absolute top-full right-0 mt-3 bg-white/90 backdrop-blur-lg shadow-2xl rounded-2xl w-72 border border-gray-100 z-50 overflow-hidden animate-fadeIn">
                        <div className="pt-2">
                          <div className="px-5 py-3 border-b border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Signed in as</p>
                            <p className="font-medium text-gray-900 truncate">{user.email || user.name}</p>
                          </div>
                          <div className="p-4">
                            <UserMenue close={handleUserMenu} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleLoginNavigate}
                    className="relative overflow-hidden bg-black text-white px-6 py-2.5 rounded-full font-medium tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-black/20 active:scale-95 text-sm xl:text-base flex items-center gap-2 group"
                  >
                    <FaUserCircle className="w-4 h-4" />
                    <span>Sign In</span>
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform translate-x-[-100%] group-hover:translate-x-full"></div>
                  </button>
                )}

                {/* Wishlist Icon - Only when user is logged in */}
                {user?.name && (
                  <Link
                    to="/dashboard/wishlist"
                    className="relative p-2.5 flex items-center justify-center border border-gray-200 hover:border-black hover:bg-black transition-all duration-300 rounded-full group"
                    aria-label="Wishlist"
                  >
                    <FaRegHeart className="w-5 h-5 text-gray-800 group-hover:text-white transition-colors duration-300" />
                  </Link>
                )}

                {user?._id && (
                  <button
                    className="relative p-2.5 flex items-center justify-center border border-gray-200 hover:border-black hover:bg-black transition-all duration-300 rounded-full group"
                    onClick={() => setOpenCartSection(true)}
                    aria-label="Cart"
                  >
                    <BsCartCheckFill className="w-5 h-5 text-gray-800 group-hover:text-white transition-colors duration-300" />
                    {cartItem.length > 0 && (
                      <span 
                        className="absolute -top-1 -right-1 bg-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {cartItem.length}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </nav>

          {/* Mobile/Tablet Search with Premium Styling - Shown on everything below xl */}
          <div className="xl:hidden pb-3 w-full">
            <div className="search-container-mobile relative w-full">
              <div className="absolute inset-0 bg-white rounded-full opacity-90"></div>
              <div className="absolute inset-0 border border-gray-200 hover:border-black transition-colors duration-300 rounded-full shadow-sm"></div>
              <div className="absolute inset-[-1px] bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 search-highlight-mobile rounded-full"></div>
              <div className="relative z-10 w-full">
                <Search />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Add styles for the animated marquee and menu stability */}
      <style jsx="true">{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .search-container:hover .search-highlight,
        .search-container-mobile:hover .search-highlight-mobile,
        .search-container:focus-within .search-highlight,
        .search-container-mobile:focus-within .search-highlight-mobile {
          opacity: 0.5;
          animation: searchGlow 2s ease-in-out infinite;
        }
        
        @keyframes searchGlow {
          0% { opacity: 0; }
          50% { opacity: 0.2; }
          100% { opacity: 0; }
        }
        
        .search-container:focus-within,
        .search-container-mobile:focus-within {
          transform: scale(1.02);
          transition: transform 0.3s ease;
        }
        
        .search-container,
        .search-container-mobile {
          transition: transform 0.3s ease;
        }
        
        /* Mobile menu stability styles */
        .mobile-menu-trigger {
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        /* Ensure mobile menu stays visible when interacting */
        .mobile-menu-trigger:focus + div,
        .mobile-menu-trigger:active + div {
          opacity: 1;
          pointer-events: auto;
          visibility: visible;
        }
        
        /* Enhanced mobile navigation styling */
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        /* Individual dropdown menu item animation */
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
        
        /* Subtle hover effects for menu items */
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(0,0,0,0.1); }
          70% { box-shadow: 0 0 0 10px rgba(0,0,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
        }
        
        .prime-deals-trigger:hover span,
        .fashion-menu-trigger:hover span {
          transform: translateY(-2px);
          transition: transform 0.3s ease;
        }
        
        .prime-deals-trigger span,
        .fashion-menu-trigger span {
          transition: transform 0.3s ease;
        }
        
        /* Enhanced mobile menu item animations */
        .mobile-menu-trigger + div a,
        .mobile-menu-trigger + div div {
          animation: fadeSlideIn 0.3s ease-out forwards;
          animation-delay: calc(var(--index) * 0.05s);
          opacity: 0;
        }
        
        .mobile-menu-trigger + div div:first-of-type { --index: 1; }
        .mobile-menu-trigger + div div:nth-of-type(2) { --index: 2; }
        .mobile-menu-trigger + div a:last-child { --index: 3; }
        
        /* Subtle hover animations for improved UX */
        .nav-link {
          position: relative;
          overflow: hidden;
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background-color: black;
          transition: all 0.3s ease;
        }
        
        .nav-link:hover::after {
          width: 80%;
          left: 10%;
        }
        
        /* Button press effect for better tactile feedback */
        button:active {
          transform: scale(0.97);
        }
        
        /* Smooth slide-in animation for dropdowns */
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideInDown {
          animation: slideInDown 0.25s ease-out forwards;
        }
      `}</style>

    </>
  );
}

export default Header;

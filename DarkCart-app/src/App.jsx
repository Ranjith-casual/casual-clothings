import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';
import fetchUserDetails from './utils/FetchUserInfo';
import { setUserDetails } from './store/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import SummaryApi from './common/SummaryApi';
import { setAllCategory, setLoadingCategory } from './store/productSlice';
import Axios from './utils/Axios';
import GlobalProvider, { useGlobalContext } from './provider/GlobalProvider';
import CartMobileLink from './components/CartMobile';
import DisplayCartItem from './components/DisplayCartItem';
import ScrollToTop from './components/ScrollToTop';

function AppContent() {
  const location = useLocation();
  const { openCartSection, setOpenCartSection } = useGlobalContext();
  const user = useSelector((state) => state?.user);

  return (
    <>
      <Header/>
      <main className='min-h-[78vh]'>
        <ScrollToTop/>
        <Outlet/>
      </main>
      <Footer/>
      <Toaster/>
      {
        location.pathname !== '/checkout' && (
          <CartMobileLink/>
        )
      }
      {/* Cart Sidebar */}
      {openCartSection && user?._id && (
        <DisplayCartItem close={() => setOpenCartSection(false)} />
      )}
    </>
  );
}

export default function App() {
  const dispatch = useDispatch();

  const fetchUser = async () => {
    const userData = await fetchUserDetails();
    dispatch(setUserDetails(userData.data));
  };

  const fetchCategory = async () => {
    try {
      dispatch(setLoadingCategory(true));
      const response = await Axios({
        ...SummaryApi.getCategory
      });
      const { data: responseData } = response;
      if (responseData.success) {
        dispatch(setAllCategory(responseData.data.sort((a, b) => a.name.localeCompare(b.name))));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      dispatch(setLoadingCategory(false));
    }
  };

  useEffect(() => {
    fetchUser();
    fetchCategory();
  }, []);

  return (
    <GlobalProvider>
      <AppContent />
    </GlobalProvider>
  );
}

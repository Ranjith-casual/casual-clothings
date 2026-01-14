import React, { useState } from 'react'
import UserMenue from '../components/UserMenue'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Dashboard=() => {
  const user =useSelector(state => state.user)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // console.log("user dashboard ",user)
  return (
    <section className='bg-white min-h-screen'>
      <div className="flex h-screen">
        {/* Fixed Sidebar - Hidden on mobile, shown on lg+ screens */}
        <div className='hidden lg:flex lg:flex-shrink-0'>
          <div className='flex flex-col w-80 bg-white border-r border-gray-200 shadow-sm'>
            {/* Sidebar Header */}
            <div className='flex-shrink-0 px-6 py-4 border-b border-gray-200'>
              <h2 className='text-lg font-semibold text-gray-900'>Dashboard</h2>
              <p className='text-sm text-gray-600'>Welcome, {user?.name}</p>
            </div>
            
            {/* Sidebar Content - Scrollable */}
            <div className='flex-1 overflow-y-auto custom-scrollbar'>
              <div className='px-4 py-6'>
                <UserMenue/>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className='flex-1 flex flex-col overflow-hidden'>
          {/* Mobile Header - Only shown on mobile */}
          <div className='lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>Dashboard</h2>
              <p className='text-sm text-gray-600'>Welcome, {user?.name}</p>
            </div>
            <button 
              onClick={toggleMobileMenu}
              className='p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors'
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          {/* Page Content - Scrollable */}
          <main className='flex-1 overflow-y-auto bg-gray-50 custom-scrollbar'>
            <div className='p-4 lg:p-6 xl:p-8'>
              <div className='max-w-7xl mx-auto'>
                <Outlet/>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className='lg:hidden fixed inset-0 z-50 flex'>
          {/* Overlay */}
          <div 
            className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
            onClick={closeMobileMenu}
          ></div>
          
          {/* Mobile Menu */}
          <div className='relative flex flex-col w-80 max-w-xs bg-white shadow-xl'>
            {/* Mobile Menu Header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
              <div>
                <h2 className='text-lg font-semibold text-gray-900'>Dashboard</h2>
                <p className='text-sm text-gray-600'>Welcome, {user?.name}</p>
              </div>
              <button 
                onClick={closeMobileMenu}
                className='p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors'
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Mobile Menu Content */}
            <div className='flex-1 overflow-y-auto custom-scrollbar'>
              <div className='px-4 py-6'>
                <UserMenue close={closeMobileMenu}/>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Dashboard
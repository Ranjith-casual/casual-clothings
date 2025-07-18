import React, { useState } from 'react'
import UserMenue from '../components/UserMenue'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { IoMenuOutline, IoCloseOutline } from 'react-icons/io5'

const Dashboard=() => {
  const user = useSelector(state => state.user)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu)
  }

  return (
    <section className='bg-white min-h-screen font-sans'>
      {/* Mobile Menu Toggle Button */}
      <div className="lg:hidden fixed bottom-5 right-5 z-30">
        <button 
          onClick={toggleMobileMenu}
          className="bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label={showMobileMenu ? "Close menu" : "Open menu"}
        >
          {showMobileMenu ? <IoCloseOutline size={24} /> : <IoMenuOutline size={24} />}
        </button>
      </div>

      <div className="container mx-auto p-2 xs:p-3 sm:p-4 flex flex-col lg:flex-row relative">
        {/* Mobile Menu Overlay */}
        <div className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-20 transition-opacity duration-300 lg:hidden
          ${showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `} onClick={toggleMobileMenu}></div>
        
        {/* Menu - Desktop (side) and Mobile (slide-in) */}
        <div className={`
          py-4 px-3 xs:px-5 sm:px-7 fixed lg:sticky top-0 lg:top-24 right-0 lg:left-0 
          h-full lg:max-h-[calc(100vh-96px)] lg:h-auto w-[250px] xs:w-[280px] sm:w-[320px] lg:w-auto
          overflow-y-auto z-20 bg-white lg:bg-transparent lg:block shadow-xl lg:shadow-none
          border-l lg:border-l-0 lg:border-r transition-transform duration-300
          ${showMobileMenu ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="lg:hidden flex justify-between items-center mb-6 pb-2 border-b">
            <h2 className="font-semibold text-xl tracking-wide">Menu</h2>
            <button onClick={toggleMobileMenu} className="p-2" aria-label="Close menu">
              <IoCloseOutline size={24} />
            </button>
          </div>
          <UserMenue/>
        </div>

        {/* Content area */}
        <div className='bg-white flex-grow min-h-[75vh] p-2 xs:p-4 sm:px-7 overflow-x-hidden'>
          <Outlet/>
        </div>
      </div>
    </section>
  )
}

export default Dashboard
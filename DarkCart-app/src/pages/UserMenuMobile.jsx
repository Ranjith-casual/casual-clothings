import React, { useState } from 'react'
import UserMenue from '../components/UserMenue'
import { IoClose } from "react-icons/io5";

function UserMenuMobile() {

  const [openUserMenu,setOpenUserMenu] = useState()

  const handleClose = ()=>{
    setOpenUserMenu(false);
  }

  return (
     <section className='bg-gray-50 min-h-screen'>
      <div className='bg-white shadow-sm border-b border-gray-200 p-4 flex justify-end sticky top-0 z-10'>
        <button 
          onClick={() => window.history.back()}
          className='p-2 hover:bg-gray-100 rounded-full transition-colors'
        >
          <IoClose size={24} className='text-gray-600 hover:text-gray-900'/>
        </button>
      </div>
      <div className='container mx-auto p-6'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <UserMenue close={handleClose}/>
        </div>
      </div>
    </section>
  )
}

export default UserMenuMobile
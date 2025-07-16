import React from 'react'
import UserMenue from '../components/UserMenue'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Dashboard=() => {
  const user =useSelector(state => state.user)

  // console.log("user dashboard ",user)
  return (
    <section className='bg-white'>
      <div className="container mx-auto p-3 flex ">
        {/* Menu */}
        <div  className='py-4 px-7 sticky top-24 max-h-[100vh] overflow-y-auto hidden lg:block border-r'>
          <UserMenue/>
        </div>

        {/* content */}
        <div className='bg-white flex-grow min-h[75vh] px-7'>
          <Outlet/>
        </div>
      </div>
    </section>
  )
}

export default Dashboard
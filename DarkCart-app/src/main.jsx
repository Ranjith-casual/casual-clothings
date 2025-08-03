import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import router from './route/index.jsx'
import { store } from './store/store.js'
import { Provider } from 'react-redux'
import { setupAxiosInterceptors } from './utils/axiosConfig.js'

// Set up Axios interceptors for global authentication
setupAxiosInterceptors()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router}/>
    </Provider>
  </StrictMode>,
)

import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin as Admin } from '../middleware/Admin.js'
import { 
    getAllUsers,
    getUserDetails,
    getUserOrderHistory,
    toggleUserStatus,
    updateUserRole,
    updateUserDetails,
    deleteUser,
    getUserStats
} from '../controllers/userManagement.controller.js'

const userManagementRouter = Router()

// Get all users with pagination and filters (Admin only)
userManagementRouter.post('/get-all-users', auth, Admin, getAllUsers)

// Get user details by ID (Admin only)
userManagementRouter.post('/get-user-details', auth, Admin, getUserDetails)

// Get user order history (Admin only)
userManagementRouter.post('/get-user-order-history', auth, Admin, getUserOrderHistory)

// Toggle user status (block/unblock) (Admin only)
userManagementRouter.post('/toggle-user-status', auth, Admin, toggleUserStatus)

// Update user role (Admin only)
userManagementRouter.post('/update-user-role', auth, Admin, updateUserRole)

// Update user details (Admin only)
userManagementRouter.post('/update-user-details', auth, Admin, updateUserDetails)

// Delete user (soft delete) (Admin only)
userManagementRouter.post('/delete-user', auth, Admin, deleteUser)

// Get user statistics (Admin only)
userManagementRouter.get('/user-stats', auth, Admin, getUserStats)

export default userManagementRouter

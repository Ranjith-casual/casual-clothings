const isAdmin = (role) => {
    // Check if role exists and normalize to uppercase for case-insensitive comparison
    if (!role) {
        console.log("No role provided to isAdmin check");
        return false;
    }
    
    const normalizedRole = role.toUpperCase();
    console.log("Normalized role for admin check:", normalizedRole);
    
    // Check for various possible admin role values
    const adminRoles = ['ADMIN', 'ADMINISTRATOR', 'SUPERADMIN', 'SUPER_ADMIN', 'SUPER-ADMIN', 'admin'];
    
    return adminRoles.includes(normalizedRole);
}

export default isAdmin
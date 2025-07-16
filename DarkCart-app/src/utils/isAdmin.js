const isAdmin = (s)=>{
    // Case-insensitive comparison for admin role check
    if(s && s.toUpperCase() === 'ADMIN'){
        return true
    }

    return false
}

export default isAdmin
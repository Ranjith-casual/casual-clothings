import FetchUserInfo from './FetchUserInfo';

/**
 * Ensures that the userId is stored in localStorage if a user is logged in
 * @returns {Promise<string|null>} The userId if available, or null if not logged in
 */
const ensureUserId = async () => {
    try {
        // Check if userId is already in localStorage
        let userId = localStorage.getItem('userId');
        
        // If we don't have userId but have an access token, try to fetch user info
        if (!userId && localStorage.getItem('accessToken')) {
            console.log('No userId in localStorage, but access token exists. Attempting to fetch user info...');
            const userData = await FetchUserInfo();
            
            if (userData && userData.success && userData.data && userData.data._id) {
                userId = userData.data._id;
                console.log('Successfully retrieved userId from API:', userId);
                localStorage.setItem('userId', userId);
            } else {
                console.warn('Could not retrieve user ID from API');
            }
        } else if (!localStorage.getItem('accessToken')) {
            console.warn('No access token found, user is likely not logged in');
        }
        
        return userId;
    } catch (error) {
        console.error('Error in ensureUserId:', error);
        return null;
    }
};

export default ensureUserId;

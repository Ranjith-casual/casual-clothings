import Axios from './Axios';
import SummaryApi from '../common/SummaryApi';

const FetchUserInfo = async () => {
    try {
        const response = await Axios({
            ...SummaryApi.userDetails
        });
        return response.data;
    } catch (error) {
        console.log('Failed to fetch user info:', error);
        // Return null or empty data structure on error
        return { success: false, data: null };
    }
}

export default FetchUserInfo;
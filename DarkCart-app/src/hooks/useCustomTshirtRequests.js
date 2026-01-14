import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

export const useCustomTshirtRequests = () => {
  const [hasCustomRequests, setHasCustomRequests] = useState(false)
  const [loading, setLoading] = useState(true)
  const user = useSelector(state => state.user)

  useEffect(() => {
    const checkCustomRequests = async () => {
      if (!user?._id) {
        setLoading(false)
        return
      }

      try {
        const response = await Axios({
          ...SummaryApi.getUserCustomTshirtRequests
        })

        if (response.data.success) {
          setHasCustomRequests(response.data.data && response.data.data.length > 0)
        }
      } catch (error) {
        console.error('Error checking custom requests:', error)
        setHasCustomRequests(false)
      } finally {
        setLoading(false)
      }
    }

    checkCustomRequests()
  }, [user?._id])

  return { hasCustomRequests, loading }
}

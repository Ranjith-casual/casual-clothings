    import React, { useState } from 'react';

    const DeliveryChargeCalculator = () => {
    const [fromDistrict, setFromDistrict] = useState('');
    const [toDistrict, setToDistrict] = useState('');
    const [distance, setDistance] = useState(null);
    const [charge, setCharge] = useState(null);
    const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const GEOCODING_API_KEY = "038cafabde4449718e8dc2303a78956f";

  // Calculate road distance using multiple APIs for better accuracy
  const getRoadDistance = async (fromLocation, toLocation) => {
    try {
      // Get coordinates using your geocoding API
      const fromCoords = await getCoordinates(fromLocation);
      const toCoords = await getCoordinates(toLocation);

      // Method 1: Use OSRM (Open Source Routing Machine) - most accurate
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromCoords.lon},${fromCoords.lat};${toCoords.lon},${toCoords.lat}?overview=false&alternatives=false&steps=false`;
      
      try {
        const response = await fetch(osrmUrl);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const distanceInMeters = data.routes[0].distance;
          return distanceInMeters / 1000; // Convert to kilometers
        }
      } catch (err) {
        console.log("OSRM failed, trying GraphHopper...");
      }

      // Method 2: Try GraphHopper API as fallback
      const graphHopperUrl = `https://graphhopper.com/api/1/route?point=${fromCoords.lat},${fromCoords.lon}&point=${toCoords.lat},${toCoords.lon}&vehicle=car&locale=en&calc_points=false&key=`;
      
      try {
        const response = await fetch(graphHopperUrl);
        const data = await response.json();
        
        if (data.paths && data.paths.length > 0) {
          const distanceInMeters = data.paths[0].distance;
          return distanceInMeters / 1000; // Convert to kilometers
        }
      } catch (err) {
        console.log("GraphHopper failed, using fallback calculation...");
      }

      // Method 3: Fallback with adjusted straight-line distance
      const straightDistance = getStraightLineDistance(fromCoords.lat, fromCoords.lon, toCoords.lat, toCoords.lon);
      // Apply a road factor of 1.4 to approximate road distance from straight-line
      return straightDistance * 1.4;
      
    } catch (err) {
      throw new Error(`Unable to calculate distance: ${err.message}`);
    }
  };

  const getCoordinates = async (address) => {
    try {
      // Use OpenCage Geocoding API with your API key
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address + ', India')}&key=${GEOCODING_API_KEY}&limit=1&countrycode=in&language=en`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.lat,
          lon: result.geometry.lng,
          display_name: result.formatted,
          confidence: result.confidence
        };
      } else {
        throw new Error(`Location not found: ${address}`);
      }
    } catch (err) {
      // Fallback to Nominatim if OpenCage fails
      console.warn("OpenCage geocoding failed, using Nominatim fallback:", err.message);
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}, India&limit=1&countrycodes=in&addressdetails=1`;
      const response = await fetch(fallbackUrl);
      const data = await response.json();
      
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name,
          confidence: 5 // Lower confidence for fallback
        };
      } else {
        throw new Error(`Location not found: ${address}`);
      }
    }
  };

    const getStraightLineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Enhanced delivery charge calculation based on road distance
    const getDeliveryCharge = (distance) => {
        if (distance <= 10) return 0; // Free delivery within 10km
        else if (distance <= 25) return 50; // ₹50 for 10-25km
        else if (distance <= 50) return 100; // ₹100 for 25-50km
        else if (distance <= 100) return 200; // ₹200 for 50-100km
        else if (distance <= 200) return 400; // ₹400 for 100-200km
        else return 600; // ₹600 for 200km+
    };

    const handleCalculate = async () => {
        if (!fromDistrict.trim() || !toDistrict.trim()) {
        setError('Please enter both districts');
        return;
        }

        setError('');
        setDistance(null);
        setCharge(null);
        setLoading(true);

        try {
        const roadDistance = await getRoadDistance(fromDistrict, toDistrict);
        const deliveryCharge = getDeliveryCharge(roadDistance);
        
        setDistance(roadDistance.toFixed(2));
        setCharge(deliveryCharge);
        } catch (err) {
        setError(`Error: ${err.message}`);
        } finally {
        setLoading(false);
        }
    };

    const popularDistricts = [
        'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
        'Tirunelveli', 'Vellore', 'Erode', 'Thanjavur', 'Dindigul',
        'Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Kochi',
        'Thiruvananthapuram', 'Hyderabad', 'Vijayawada', 'Visakhapatnam'
    ];

    return (
        <div style={{ 
        padding: '2rem', 
        maxWidth: '600px', 
        margin: 'auto',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
        <h2 style={{ 
            textAlign: 'center', 
            color: '#2c2c2c',
            marginBottom: '2rem',
            fontSize: '1.8rem'
        }}>
            🚚 Inter-District Delivery Calculator
        </h2>
        
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            From District:
            </label>
            <input
            type="text"
            value={fromDistrict}
            onChange={(e) => setFromDistrict(e.target.value)}
            placeholder="e.g., Chennai, Coimbatore, Bangalore"
            list="districts-from"
            style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
            <datalist id="districts-from">
            {popularDistricts.map(district => (
                <option key={district} value={district} />
            ))}
            </datalist>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            To District:
            </label>
            <input
            type="text"
            value={toDistrict}
            onChange={(e) => setToDistrict(e.target.value)}
            placeholder="e.g., Madurai, Salem, Mysore"
            list="districts-to"
            style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
            <datalist id="districts-to">
            {popularDistricts.map(district => (
                <option key={district} value={district} />
            ))}
            </datalist>
        </div>

        <button 
            onClick={handleCalculate} 
            disabled={loading}
            style={{ 
            width: '100%',
            padding: '12px 20px',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
            }}
        >
            {loading ? '🔄 Calculating...' : '📊 Calculate Distance & Charge'}
        </button>

        {error && (
            <div style={{ 
            color: '#dc3545', 
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '1rem',
            fontSize: '0.9rem'
            }}>
            ⚠️ {error}
            </div>
        )}

        {distance && charge !== null && (
            <div style={{ 
            marginTop: '1.5rem',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '12px',
            padding: '20px'
            }}>
            <h3 style={{ 
                margin: '0 0 1rem 0', 
                color: '#155724',
                fontSize: '1.2rem'
            }}>
                � Delivery Details
            </h3>
            
            <div style={{ 
                display: 'grid', 
                gap: '12px',
                fontSize: '1rem'
            }}>
                <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #c3e6cb'
                }}>
                <span><strong>🗺️ Road Distance:</strong></span>
                <span style={{ color: '#155724', fontWeight: '600' }}>{distance} km</span>
                </div>
                
                <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #c3e6cb'
                }}>
                <span><strong>🚚 Delivery Charge:</strong></span>
                <span style={{ 
                    color: charge === 0 ? '#28a745' : '#155724', 
                    fontWeight: '700',
                    fontSize: '1.1rem'
                }}>
                    {charge === 0 ? 'FREE' : `₹${charge}`}
                </span>
                </div>
                
                <div style={{ 
                marginTop: '8px',
                fontSize: '0.85rem',
                color: '#6c757d',
                fontStyle: 'italic'
                }}>
                💡 Using OpenCage Geocoding API + OSRM routing for accurate distances
                </div>
            </div>
            </div>
        )}

        <div style={{ 
            marginTop: '2rem',
            padding: '16px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #bbdefb',
            borderRadius: '8px',
            fontSize: '0.9rem'
        }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1565c0' }}>💰 Delivery Charges:</h4>
            <ul style={{ margin: '0', paddingLeft: '1.2rem', color: '#424242' }}>
            <li>Within 10km: <strong>FREE</strong></li>
            <li>10-25km: ₹50</li>
            <li>25-50km: ₹100</li>
            <li>50-100km: ₹200</li>
            <li>100-200km: ₹400</li>
            <li>200km+: ₹600</li>
            </ul>
        </div>
        </div>
    );
    };

    export default DeliveryChargeCalculator;

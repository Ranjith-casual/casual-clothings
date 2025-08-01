// Indian Location Controller - Provides complete Indian states and districts data
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read JSON data synchronously
const indianLocationData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/indianStatesDistricts.json'), 'utf8')
);

// Get all Indian states
const getIndianStates = async (req, res) => {
    try {
        const states = Object.keys(indianLocationData).map(state => ({
            name: state,
            code: state.replace(/\s+/g, '_').toUpperCase()
        }));

        res.status(200).json({
            success: true,
            message: "Indian states retrieved successfully",
            data: states
        });
    } catch (error) {
        console.error("Error getting Indian states:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve Indian states",
            error: error.message
        });
    }
};

// Get districts for a specific state
const getDistrictsByState = async (req, res) => {
    try {
        const { stateName } = req.params;
        
        if (!stateName) {
            return res.status(400).json({
                success: false,
                message: "State name is required"
            });
        }

        // Find the state (case-insensitive)
        const state = Object.keys(indianLocationData).find(
            key => key.toLowerCase() === stateName.toLowerCase()
        );

        if (!state) {
            return res.status(404).json({
                success: false,
                message: "State not found"
            });
        }

        const districts = indianLocationData[state].map((district, index) => ({
            name: district,
            code: district.replace(/\s+/g, '_').toUpperCase(),
            id: index + 1
        }));

        res.status(200).json({
            success: true,
            message: `Districts for ${state} retrieved successfully`,
            data: {
                state: state,
                districts: districts,
                count: districts.length
            }
        });
    } catch (error) {
        console.error("Error getting districts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve districts",
            error: error.message
        });
    }
};

// Get all states with their districts
const getAllStatesWithDistricts = async (req, res) => {
    try {
        const formattedData = {};
        
        Object.keys(indianLocationData).forEach(state => {
            formattedData[state] = {
                name: state,
                code: state.replace(/\s+/g, '_').toUpperCase(),
                districts: indianLocationData[state].map((district, index) => ({
                    name: district,
                    code: district.replace(/\s+/g, '_').toUpperCase(),
                    id: index + 1
                })),
                districtCount: indianLocationData[state].length
            };
        });

        res.status(200).json({
            success: true,
            message: "All Indian states and districts retrieved successfully",
            data: formattedData,
            totalStates: Object.keys(formattedData).length,
            totalDistricts: Object.values(indianLocationData).flat().length
        });
    } catch (error) {
        console.error("Error getting all states with districts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve states and districts",
            error: error.message
        });
    }
};

// Search districts across all states
const searchDistricts = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Search query must be at least 2 characters long"
            });
        }

        const results = [];
        const searchTerm = query.toLowerCase();

        Object.keys(indianLocationData).forEach(state => {
            indianLocationData[state].forEach((district, index) => {
                if (district.toLowerCase().includes(searchTerm)) {
                    results.push({
                        district: district,
                        state: state,
                        districtCode: district.replace(/\s+/g, '_').toUpperCase(),
                        stateCode: state.replace(/\s+/g, '_').toUpperCase(),
                        id: `${state}_${index + 1}`
                    });
                }
            });
        });

        res.status(200).json({
            success: true,
            message: `Found ${results.length} districts matching "${query}"`,
            data: results,
            query: query,
            count: results.length
        });
    } catch (error) {
        console.error("Error searching districts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to search districts",
            error: error.message
        });
    }
};

export {
    getIndianStates,
    getDistrictsByState,
    getAllStatesWithDistricts,
    searchDistricts
};

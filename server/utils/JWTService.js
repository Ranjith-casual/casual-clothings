/**
 * JWT Service - Centralized JWT token management
 * This service handles all token-related operations for consistent
 * token generation, validation, and refresh mechanisms.
 */

import jwt from 'jsonwebtoken';
import Logger from './logger.js';
import UserModel from '../models/users.model.js';

export class JWTService {
  // Default token expiration times
  static ACCESS_TOKEN_EXPIRY = '6h';
  static REFRESH_TOKEN_EXPIRY = '7d';

  /**
   * Generate an access token
   * @param {string} userId - User ID to include in the token
   * @param {Object} additionalData - Any additional data to include in the token
   * @param {string} expiry - Optional custom expiration time
   * @returns {Promise<string>} The generated token
   */
  static async generateAccessToken(userId, additionalData = {}, expiry = this.ACCESS_TOKEN_EXPIRY) {
    try {
      const token = await jwt.sign(
        { id: userId, ...additionalData },
        process.env.SECRET_KEY_ACCESS_TOKEN,
        { expiresIn: expiry }
      );
      return token;
    } catch (error) {
      Logger.error('Failed to generate access token', { userId, error: error.message });
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate a refresh token and store it in the user record
   * @param {string} userId - User ID to include in the token
   * @param {string} expiry - Optional custom expiration time
   * @returns {Promise<string>} The generated token
   */
  static async generateRefreshToken(userId, expiry = this.REFRESH_TOKEN_EXPIRY) {
    try {
      const token = await jwt.sign(
        { id: userId },
        process.env.SECRET_KEY_REFRESH_TOKEN,
        { expiresIn: expiry }
      );
      
      // Store the token in the user record
      await UserModel.updateOne(
        { _id: userId }, 
        { 
          refresh_token: token,
          token_issued_at: new Date()
        }
      );
      
      return token;
    } catch (error) {
      Logger.error('Failed to generate refresh token', { userId, error: error.message });
      throw new Error('Refresh token generation failed');
    }
  }

  /**
   * Verify a JWT token
   * @param {string} token - The token to verify
   * @param {string} secretKey - Secret key to use for verification
   * @returns {Object|null} The decoded token or null if invalid
   */
  static async verifyToken(token, secretKey) {
    try {
      const decoded = jwt.verify(token, secretKey);
      return decoded;
    } catch (error) {
      Logger.debug('Token verification failed', { error: error.message });
      return null;
    }
  }

  /**
   * Verify an access token
   * @param {string} token - The token to verify
   * @returns {Object|null} The decoded token or null if invalid
   */
  static async verifyAccessToken(token) {
    return this.verifyToken(token, process.env.SECRET_KEY_ACCESS_TOKEN);
  }

  /**
   * Verify a refresh token and check if it matches the stored token
   * @param {string} token - The token to verify
   * @returns {Object|null} The decoded token and user info, or null if invalid
   */
  static async verifyRefreshToken(token) {
    try {
      const decoded = await this.verifyToken(token, process.env.SECRET_KEY_REFRESH_TOKEN);
      
      if (!decoded) return null;
      
      // Check if token exists in database and matches this user
      const user = await UserModel.findOne({ 
        _id: decoded.id,
        refresh_token: token
      });
      
      if (!user) {
        Logger.warn('Refresh token not found in database', { userId: decoded.id });
        return null;
      }
      
      return { decoded, user };
    } catch (error) {
      Logger.error('Error verifying refresh token', { error: error.message });
      return null;
    }
  }

  /**
   * Invalidate all tokens for a user
   * @param {string} userId - The user ID whose tokens should be invalidated
   */
  static async invalidateAllTokens(userId) {
    try {
      await UserModel.updateOne(
        { _id: userId },
        { refresh_token: "", token_issued_at: new Date() }
      );
      Logger.info('All tokens invalidated for user', { userId });
    } catch (error) {
      Logger.error('Failed to invalidate tokens', { userId, error: error.message });
      throw new Error('Token invalidation failed');
    }
  }

  /**
   * Set token cookies on response object
   * @param {Object} res - Express response object
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   */
  static setTokenCookies(res, accessToken, refreshToken) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None'
    };
    
    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);
  }

  /**
   * Clear token cookies on response object
   * @param {Object} res - Express response object
   */
  static clearTokenCookies(res) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None'
    };
    
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
  }

  /**
   * Extract token from request
   * @param {Object} req - Express request object
   * @param {string} cookieName - Name of the cookie to check
   * @returns {string|null} The token or null if not found
   */
  static getTokenFromRequest(req, cookieName) {
    return (
      req.cookies?.[cookieName] ||
      (req?.headers?.authorization?.startsWith('Bearer ') 
        ? req.headers.authorization.split(" ")[1] 
        : null)
    );
  }
}

export default JWTService;

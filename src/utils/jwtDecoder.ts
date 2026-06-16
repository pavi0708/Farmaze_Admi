/**
 * JWT Token Decoder Utility
 * Decodes JWT tokens to extract user information
 */

export interface DecodedJWT {
  username: string;
  client_id: string;
  user_id: string;
  role: string;
  exp: number;
  iat?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  client_id: string;
}

/**
 * Decode JWT token without verification (client-side only)
 * Note: This is for extracting user info, not for security validation
 */
export function decodeJWT(token: string): DecodedJWT | null {
  try {
    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    const parsedPayload = JSON.parse(decodedPayload);
    
    return parsedPayload as DecodedJWT;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Convert decoded JWT to AuthUser format
 */
export function jwtToAuthUser(decodedJWT: DecodedJWT): AuthUser {
  return {
    id: decodedJWT.user_id,
    email: decodedJWT.username,
    username: decodedJWT.username,
    role: decodedJWT.role,
    client_id: decodedJWT.client_id
  };
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJWT(token);
    if (!decoded) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * Extract user info from JWT token
 */
export function getUserFromToken(token: string): AuthUser | null {
  try {
    const decoded = decodeJWT(token);
    if (!decoded) return null;
    
    return jwtToAuthUser(decoded);
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
}

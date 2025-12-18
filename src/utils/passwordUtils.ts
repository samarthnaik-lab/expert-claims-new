/**
 * Password Utilities
 * 
 * IMPORTANT: For security, passwords should be sent as plain text over HTTPS
 * and hashed on the backend. However, this utility provides bcrypt hashing
 * for cases where frontend hashing is required (e.g., during migration).
 * 
 * Best Practice: Send plain passwords and let backend hash them.
 */

/**
 * Hash password using bcryptjs (for frontend hashing if needed)
 * Note: This should only be used if backend requires pre-hashed passwords.
 * Otherwise, send plain password and let backend hash it.
 */
export const hashPasswordWithBcrypt = async (password: string): Promise<string> => {
  // Dynamic import to avoid bundling bcryptjs if not needed
  const bcrypt = await import('bcryptjs');
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Get plain password (for sending to backend)
 * Backend will hash it properly using bcrypt
 */
export const getPlainPassword = (password: string): string => {
  return password; // Send plain password - backend will hash it
};



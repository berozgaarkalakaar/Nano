import db from './db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 10;

export async function createUser(email: string, password: string) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    try {
        const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
        const info = stmt.run(email, hash);

        // Initialize credits
        const creditStmt = db.prepare('INSERT INTO credits (user_id, amount, last_refill_date) VALUES (?, ?, ?)');
        creditStmt.run(info.lastInsertRowid, 10, new Date().toISOString().split('T')[0]);

        return info.lastInsertRowid;
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new Error('Email already exists');
        }
        throw error;
    }
}

export async function verifyUser(email: string, password: string) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as any;

    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;

    return user;
}

export function createSession(userId: number) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const stmt = db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)');
    stmt.run(token, userId, expiresAt.toISOString());

    return token;
}

export function getUserFromSession(token: string) {
    const stmt = db.prepare(`
    SELECT u.* 
    FROM users u
    JOIN sessions s ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > ?
  `);
    return stmt.get(token, new Date().toISOString()) as any;
}

export function deleteSession(token: string) {
    const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
    stmt.run(token);
}

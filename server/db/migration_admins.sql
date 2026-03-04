-- Admin Users Table
CREATE TABLE IF NOT EXISTS zz_admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

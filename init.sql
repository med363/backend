-- Initialize database with required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if not exists (TypeORM will handle this, but just in case)
-- This file will run when the PostgreSQL container starts for the first time

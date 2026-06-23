-- Migration 003: Add shading and environment columns to user_inputs table
ALTER TABLE user_inputs ADD COLUMN IF NOT EXISTS shading TEXT DEFAULT 'none';
ALTER TABLE user_inputs ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'clean';

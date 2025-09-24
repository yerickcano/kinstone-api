-- Kinstone Fusion Game Database Schema
-- PostgreSQL implementation with transactional safety and performance indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums for type safety
CREATE TYPE piece_half AS ENUM ('A', 'B');
CREATE TYPE piece_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE inventory_entry_provenance AS ENUM ('drop', 'reward', 'grant', 'admin');
CREATE TYPE reward_type AS ENUM ('points', 'coins', 'cosmetic', 'lootbox', 'event_trigger');
CREATE TYPE reward_status AS ENUM ('pending', 'claimed', 'consumed');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handle VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Inventory table (one-to-one with users)
CREATE TABLE inventories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    capacity INTEGER NOT NULL DEFAULT 50,
    current_usage INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_inventory UNIQUE(user_id),
    CONSTRAINT valid_capacity CHECK (capacity > 0),
    CONSTRAINT valid_usage CHECK (current_usage >= 0 AND current_usage <= capacity)
);

-- Piece catalog (immutable archetypes)
CREATE TABLE pieces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shape_family VARCHAR(50) NOT NULL,
    half piece_half NOT NULL,
    rarity piece_rarity NOT NULL DEFAULT 'common',
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tags TEXT[], -- Array of tags for themes/events
    is_active BOOLEAN DEFAULT true, -- For retiring pieces
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_shape_half UNIQUE(shape_family, half)
);

-- Inventory entries (user-owned piece instances)
CREATE TABLE inventory_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
    piece_id UUID NOT NULL REFERENCES pieces(id),
    provenance inventory_entry_provenance NOT NULL DEFAULT 'drop',
    is_locked BOOLEAN DEFAULT false, -- For cooldowns or special states
    serial_number BIGSERIAL, -- Unique instance identifier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes will be created separately below
);

-- Fusion transaction log
CREATE TABLE fusions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    input_piece_1_id UUID NOT NULL, -- References inventory_entries.id (before deletion)
    input_piece_2_id UUID NOT NULL, -- References inventory_entries.id (before deletion)
    input_piece_1_catalog_id UUID NOT NULL REFERENCES pieces(id), -- Catalog reference for history
    input_piece_2_catalog_id UUID NOT NULL REFERENCES pieces(id), -- Catalog reference for history
    shape_family VARCHAR(50) NOT NULL, -- Derived from inputs
    is_success BOOLEAN NOT NULL,
    score_value INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure different input pieces
    CONSTRAINT different_input_pieces CHECK (input_piece_1_id != input_piece_2_id),
    
    -- Indexes will be created separately below
);

-- Rewards table (optional for v1)
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fusion_id UUID NOT NULL REFERENCES fusions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    reward_type reward_type NOT NULL,
    reward_value JSONB, -- Flexible storage for different reward types
    status reward_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes will be created separately below
);

-- Drop/Spawn ruleset (optional, for future events)
CREATE TABLE drop_rulesets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    probability_weights JSONB NOT NULL, -- JSON object with piece_id -> weight mapping
    cooldown_seconds INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure valid time range
    CONSTRAINT valid_time_range CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at)
);

-- Triggers for maintaining inventory current_usage
CREATE OR REPLACE FUNCTION update_inventory_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE inventories 
        SET current_usage = current_usage + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.inventory_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE inventories 
        SET current_usage = current_usage - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.inventory_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_usage_insert
    AFTER INSERT ON inventory_entries
    FOR EACH ROW EXECUTE FUNCTION update_inventory_usage();

CREATE TRIGGER trigger_inventory_usage_delete
    AFTER DELETE ON inventory_entries
    FOR EACH ROW EXECUTE FUNCTION update_inventory_usage();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_inventories_updated_at
    BEFORE UPDATE ON inventories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for foreign key relationships and common queries
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_inventories_user_id ON inventories(user_id);
CREATE INDEX idx_pieces_shape_family ON pieces(shape_family);
CREATE INDEX idx_pieces_rarity ON pieces(rarity);
CREATE INDEX idx_pieces_is_active ON pieces(is_active);

-- Inventory entries indexes
CREATE INDEX idx_inventory_entries_inventory_id ON inventory_entries(inventory_id);
CREATE INDEX idx_inventory_entries_piece_id ON inventory_entries(piece_id);
CREATE INDEX idx_inventory_entries_created_at ON inventory_entries(created_at);

-- Fusions indexes
CREATE INDEX idx_fusions_user_id ON fusions(user_id);
CREATE INDEX idx_fusions_created_at ON fusions(created_at);
CREATE INDEX idx_fusions_success ON fusions(is_success);
CREATE INDEX idx_fusions_shape_family ON fusions(shape_family);

-- Rewards indexes
CREATE INDEX idx_rewards_user_id ON rewards(user_id);
CREATE INDEX idx_rewards_fusion_id ON rewards(fusion_id);
CREATE INDEX idx_rewards_status ON rewards(status);
CREATE INDEX idx_rewards_created_at ON rewards(created_at);

-- Comments for documentation
COMMENT ON TABLE users IS 'Game users with optional display information';
COMMENT ON TABLE inventories IS 'User inventories with capacity management';
COMMENT ON TABLE pieces IS 'Immutable catalog of piece archetypes';
COMMENT ON TABLE inventory_entries IS 'User-owned instances of pieces';
COMMENT ON TABLE fusions IS 'Transaction log of all fusion attempts';
COMMENT ON TABLE rewards IS 'Rewards granted from successful fusions';
COMMENT ON TABLE drop_rulesets IS 'Configurable drop probability rules';

COMMENT ON COLUMN inventory_entries.serial_number IS 'Unique instance identifier for piece tracking';
COMMENT ON COLUMN fusions.input_piece_1_id IS 'Original inventory entry ID (may be deleted)';
COMMENT ON COLUMN fusions.input_piece_2_id IS 'Original inventory entry ID (may be deleted)';
COMMENT ON COLUMN fusions.input_piece_1_catalog_id IS 'Piece catalog reference for historical data';
COMMENT ON COLUMN fusions.input_piece_2_catalog_id IS 'Piece catalog reference for historical data';

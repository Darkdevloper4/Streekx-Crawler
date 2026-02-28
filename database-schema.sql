-- ==========================================
-- STREEKX SEARCH ENGINE - MASTER SCHEMA
-- ==========================================

-- 1. UUID Extension (For unique IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Master Index Table (Google-Level Data Storage)
CREATE TABLE IF NOT EXISTS streekx_index (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- URL & Domain Details
    url TEXT UNIQUE NOT NULL,
    domain TEXT NOT NULL,
    base_url TEXT,
    
    -- Content & Metadata (For Search Snippets)
    title TEXT,
    meta_description TEXT,
    raw_content TEXT, -- Stores full page text for deep search
    language VARCHAR(10) DEFAULT 'en',
    
    -- Visual & Branding (Rich Results)
    favicon TEXT, -- Site icon URL
    og_image TEXT, -- Social preview image URL
    
    -- Multimedia Data (For Image/Video Filters)
    images JSONB DEFAULT '[]'::jsonb, -- Stores: [{url: "...", alt: "..."}]
    videos JSONB DEFAULT '[]'::jsonb, -- Stores: [url1, url2]
    
    -- Connectivity & Ranking Data
    discovered_links JSONB DEFAULT '[]'::jsonb,
    outlinks_count INTEGER DEFAULT 0,
    
    -- Technical Data
    status_code INTEGER,
    page_size_kb FLOAT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_crawled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- POWERFUL: Full-Text Search Vector (Google-style fast search)
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(meta_description, '') || ' ' || coalesce(raw_content, ''))
    ) STORED
);

-- 3. Crawl Queue Table (Managing the Crawling Flow)
CREATE TABLE IF NOT EXISTS streekx_crawl_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    priority INTEGER DEFAULT 0,
    is_crawled BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Speed Optimization Indexes
-- Search index (Lightning fast text search)
CREATE INDEX IF NOT EXISTS idx_streekx_search_vector ON streekx_index USING GIN (search_vector);

-- Filtering indexes
CREATE INDEX IF NOT EXISTS idx_streekx_domain ON streekx_index (domain);
CREATE INDEX IF NOT EXISTS idx_streekx_url ON streekx_index (url);
CREATE INDEX IF NOT EXISTS idx_queue_unprocessed ON streekx_crawl_queue (is_crawled) WHERE is_crawled = FALSE;


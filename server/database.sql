CREATE DATABASE lost_found_db;

\c lost_found_db;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' -- 'user', 'admin'
);

CREATE TABLE lost_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    category VARCHAR(100) NOT NULL, -- Bag, Phone, ID, Keys, Pet, Other
    color VARCHAR(100), -- Multi-select stored as comma-separated or JSON
    material VARCHAR(100), -- Leather, Plastic, Metal, etc.
    location_lost VARCHAR(255) NOT NULL,
    map_lat DECIMAL(10, 8),
    map_lng DECIMAL(11, 8),
    date_lost TIMESTAMP NOT NULL,
    unique_marks TEXT, -- Scratches, stickers
    description TEXT,
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'lost', -- 'lost', 'found', 'returned'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE found_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    category VARCHAR(100) NOT NULL,
    location_found VARCHAR(255) NOT NULL,
    map_lat DECIMAL(10, 8),
    map_lng DECIMAL(11, 8),
    date_found TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    condition VARCHAR(50), -- New, Damaged, Wet
    storage_location VARCHAR(255), -- Where is it kept?
    finder_preference VARCHAR(50), -- 'meet', 'police', 'courier'
    image_url TEXT NOT NULL, -- Mandatory
    status VARCHAR(50) DEFAULT 'found', -- 'found', 'claimed', 'returned'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    lost_item_id INTEGER REFERENCES lost_items(id),
    found_item_id INTEGER REFERENCES found_items(id),
    confidence_score INTEGER, -- 0-100
    match_details JSONB, -- Explainability: { "visual": 80, "location": 90, "total": 85 }
    is_viewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE claims (
    id SERIAL PRIMARY KEY,
    lost_item_id INTEGER REFERENCES lost_items(id),
    found_item_id INTEGER REFERENCES found_items(id),
    finder_id INTEGER REFERENCES users(id),
    claimer_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verification_answers JSONB, -- Answers to private questions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

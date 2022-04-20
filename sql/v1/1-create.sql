CREATE TABLE IF NOT EXISTS entity_v1(
    uid TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    logoImageUrl TEXT NOT NULL,
    created DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review_v1(
    uid TEXT NOT NULL PRIMARY KEY,
    entityUid TEXT NOT NULL,
    userAddress TEXT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    approved INT DEFAULT 0,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entityUid) REFERENCES entity_v1(uid),
    FOREIGN KEY (userAddress) REFERENCES user_v1(address),
    UNIQUE(entityUid, userAddress) ON CONFLICT ABORT
);

CREATE TABLE IF NOT EXISTS user_v1(
    address TEXT NOT NULL PRIMARY KEY,
    admin INT DEFAULT 0,
    created DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nft_project_v1(
    entityUid TEXT NOT NULL PRIMARY KEY,
    featuredImageUrl TEXT,
    bannerImageUrl TEXT,
    websiteUrl TEXT,
    openSeaUrl TEXT,
    twitterUrl TEXT,
    discordUrl TEXT,
    description TEXT,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entityUid) REFERENCES entity_v1(uid)
);

CREATE TABLE IF NOT EXISTS nft_project_review_rating_v1(
    reviewUid TEXT NOT NULL PRIMARY KEY,
    entityUid TEXT NOT NULL,
    communityRating INT DEFAULT NULL, 
    originalityRating INT DEFAULT NULL,
    communicationRating INT DEFAULT NULL,
    consistencyRating INT DEFAULT NULL,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entityUid) REFERENCES entity_v1(uid),
    FOREIGN KEY (reviewUid) REFERENCES review_v1(uid)
);

CREATE TABLE IF NOT EXISTS nft_project_rating_history_v1(
    uid TEXT NOT NULL PRIMARY KEY,
    entityUid TEXT NOT NULL,
    totalRating REAL DEFAULT 0,
    rating REAL DEFAULT 0,
    ratingCount INT DEFAULT 0,
    communityRating REAL DEFAULT 0,
    communityRatingCount INT DEFAULT 0,
    originalityRating REAL DEFAULT 0,
    originalityRatingCount INT DEFAULT 0,
    communicationRating REAL DEFAULT 0,
    communicationRatingCount INT DEFAULT 0,
    consistencyRating REAL DEFAULT 0,
    consistencyRatingCount INT DEFAULT 0,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entityUid) REFERENCES entity_v1(uid)
);
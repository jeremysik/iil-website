CREATE TABLE IF NOT EXISTS entity_v1(
    uid TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    rating REAL DEFAULT 0,
    reviewCount INT DEFAULT 0,
    created DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review_v1(
    uid TEXT NOT NULL PRIMARY KEY,
    entityUid TEXT NOT NULL,
    userUid TEXT NOT NULL UNIQUE,
    comment TEXT,
    approved INT DEFAULT 0,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entityUid) REFERENCES entity_v1(uid),
    FOREIGN KEY (userUid) REFERENCES user_v1(uid)
);

CREATE TABLE IF NOT EXISTS nft_project_v1(
    uid TEXT NOT NULL PRIMARY KEY,
    entityUid TEXT NOT NULL,
    logoImageUrl TEXT NOT NULL,
    featuredImageUrl TEXT NOT NULL,
    bannerImageUrl TEXT NOT NULL,
    websiteUrl TEXT,
    openSeaUrl TEXT,
    twitterUrl TEXT,
    discordUrl TEXT,
    description TEXT,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entityUid) REFERENCES entity_v1(uid)
);

CREATE TABLE IF NOT EXISTS nft_project_rating_v1(
    uid TEXT NOT NULL PRIMARY KEY,
    entityUid TEXT NOT NULL,
    reviewUid TEXT NOT NULL,
    communityRating INT NOT NULL,
    originalityRating INT NOT NULL,
    communicationRating INT NOT NULL,
    consistencyRating INT NOT NULL,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entityUid) REFERENCES entity_v1(uid),
    FOREIGN KEY (reviewUid) REFERENCES review_v1(uid)
);

CREATE TABLE IF NOT EXISTS user_v1(
    uid TEXT NOT NULL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    admin INT DEFAULT 0,
    tokenBalance INT DEFAULT 0,
    tokenTotal INT DEFAULT 0,
    created DATETIME DEFAULT CURRENT_TIMESTAMP
);
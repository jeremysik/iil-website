CREATE TABLE IF NOT EXISTS entity_v1(
    uid TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    created DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nft_collection_v1(
    uid TEXT NOT NULL PRIMARY KEY,
    entityUid TEXT NOT NULL,
    bannerImageUrl TEXT NOT NULL,
    websiteUrl TEXT,
    openSeaUrl TEXT,
    twitterUrl TEXT,
    discordUrl TEXT,
    description TEXT,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entityUid) REFERENCES entity_v1(uid)
);

CREATE TABLE IF NOT EXISTS review_v1(
    uid TEXT NOT NULL PRIMARY KEY,
    entityUid TEXT NOT NULL,
    username TEXT NOT NULL,
    rating INT NOT NULL,
    review TEXT NOT NULL,
    approved INT DEFAULT 0,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entityUid) REFERENCES entity_v1(uid),
    FOREIGN KEY (username) REFERENCES user_v1(username)
);

CREATE TABLE IF NOT EXISTS user_v1(
    username TEXT NOT NULL PRIMARY KEY,
    password TEXT NOT NULL,
    admin INT DEFAULT 0,
    tokenBalance INT DEFAULT 0,
    tokenTotal INT DEFAULT 0,
    created DATETIME DEFAULT CURRENT_TIMESTAMP
);
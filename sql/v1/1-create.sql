CREATE TABLE IF NOT EXISTS entity_v1(
    uid TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nft_collection_v1(
    uid TEXT NOT NULL,
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
    uid TEXT NOT NULL,
    entityUid TEXT NOT NULL,
    name TEXT NOT NULL,
    rating INT NOT NULL,
    comment TEXT NOT NULL,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entityUid) REFERENCES entity_v1(uid)
);
const { faker }     = require('@faker-js/faker');
const betterSqlite3 = require('better-sqlite3');

// Load database
const config = require(`${process.cwd()}/config.json`);
const db     = new betterSqlite3(`${process.cwd()}${config.database.path}`);

// Create admin user
const insertAdminUserStmt = db.prepare(`INSERT INTO user_v1(address, admin) VALUES(?, ?)`);
insertAdminUserStmt.run(
    '0x1E3C24edcF3D775310413C2f18f9BA9ee092072C',
    1
);

console.log(`Inserted admin user`);

// Create NFT Projects
let entityUids  = [];
let entityCount = faker.datatype.number({min: 20, max: 100});
for(let i = 0; i < entityCount; i++) {
    const transaction = db.transaction(() => {
        const entityUid = faker.datatype.uuid();
        entityUids.push(entityUid);

        const insertEntityStmt = db.prepare(`INSERT INTO entity_v1(uid, name, type, logoImageUrl) VALUES(?, ?, ?, ?)`);
        insertEntityStmt.run(
            entityUid, 
            `${faker.company.companyName()} ${faker.animal.type()} ${faker.music.genre()} ${faker.name.firstName()}`,
            'nft_project',
            'https://lh3.googleusercontent.com/b0fSnR5cPyzYKx2udZGTS_KANhr8RxvsgfrPiZ9atdc9nMB7qSGHnoXyLt9DJG_QuqfZaBSet3bp8NjeaC0gfG7CVAZ_w8mLeIQm=h232'
        );

        const insertNftStmt = db.prepare(`INSERT INTO nft_project_v1(entityUid, featuredImageUrl, bannerImageUrl, description, websiteUrl, twitterUrl, discordUrl, openSeaUrl) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`);
        insertNftStmt.run(
            entityUid,
            'https://lh3.googleusercontent.com/b0fSnR5cPyzYKx2udZGTS_KANhr8RxvsgfrPiZ9atdc9nMB7qSGHnoXyLt9DJG_QuqfZaBSet3bp8NjeaC0gfG7CVAZ_w8mLeIQm=h400',
            'https://lh3.googleusercontent.com/b0fSnR5cPyzYKx2udZGTS_KANhr8RxvsgfrPiZ9atdc9nMB7qSGHnoXyLt9DJG_QuqfZaBSet3bp8NjeaC0gfG7CVAZ_w8mLeIQm=h400',
            faker.lorem.paragraph(),
            faker.internet.url(),
            faker.internet.url(),
            faker.internet.url(),
            faker.internet.url()
        );
    });

    try {
        transaction();
        entityCount--;
    }
    catch(err) {
        console.error(`Failed to insert NFT project: ${err}`);
    }   
}

console.log(`Inserted ${entityCount} entities`);

// Add reviews
let totalReviewCount = 0;
entityUids.forEach((entityUid) => {
    let reviewCount = faker.datatype.number({min: 10, max: 250});
    for(let i = 0; i < reviewCount; i++) {
        const transaction = db.transaction(() => {
            const userAddress    = faker.datatype.uuid();
            const insertUserStmt = db.prepare(`INSERT INTO user_v1(address) VALUES(?)`);
            insertUserStmt.run(userAddress);
    
            const reviewUid        = faker.datatype.uuid();
            const insertReviewStmt = db.prepare(`INSERT INTO review_v1(uid, entityUid, userAddress, rating, comment, approved) VALUES(?, ?, ?, ?, ?, ?)`);
            insertReviewStmt.run(
                reviewUid,
                entityUid,
                userAddress,
                faker.datatype.number({min: 1, max: 5}),
                faker.datatype.boolean() ? faker.lorem.paragraph() : null,
                faker.datatype.float({min: 0, max: 1}) > 0.8 ? 0 : 1
            );

            const insertRatingStmt = db.prepare(`INSERT INTO nft_project_rating_v1(reviewUid, entityUid, communityRating, originalityRating, communicationRating, consistencyRating) VALUES(?, ?, ?, ?, ?, ?)`);
            insertRatingStmt.run(
                reviewUid,
                entityUid,
                faker.datatype.boolean() ? null : faker.datatype.number({min: 1, max: 5}),
                faker.datatype.boolean() ? null : faker.datatype.number({min: 1, max: 5}),
                faker.datatype.boolean() ? null : faker.datatype.number({min: 1, max: 5}),
                faker.datatype.boolean() ? null : faker.datatype.number({min: 1, max: 5})
            );
        });
    
        try {
            transaction();
            reviewCount--;
        }
        catch(err) {
            console.error(`Failed to insert review: ${err}`);
        }    
    }

    console.log(`Inserted ${reviewCount} reviews for entity ${entityUid}`);
    totalReviewCount += reviewCount;
});

console.log(`Inserted ${totalReviewCount} reviews in total`);

// Update ratings
entityUids.forEach((entityUid) => {
    let ratings = {};
    const transaction = db.transaction(() => {
        const ratingSumStmt = db.prepare(`SELECT CAST(SUM(rating) AS REAL) / COUNT(*) AS rating, COUNT(*) AS count FROM review_v1 WHERE entityUid = ?`);
        ratings.rating      = ratingSumStmt.get(entityUid);

        const communitySumStmt = db.prepare(`SELECT CAST(SUM(communityRating) AS REAL) / COUNT(*) AS rating, COUNT(*) AS count FROM nft_project_rating_v1 WHERE communityRating NOT NULL AND entityUid = ?`);
        ratings.community      = communitySumStmt.get(entityUid);
        
        const originalitySumStmt = db.prepare(`SELECT CAST(SUM(originalityRating) AS REAL) / COUNT(*) AS rating, COUNT(*) AS count FROM nft_project_rating_v1 WHERE originalityRating NOT NULL AND entityUid = ?`);
        ratings.originality      = originalitySumStmt.get(entityUid);

        const communicationSumStmt = db.prepare(`SELECT CAST(SUM(communicationRating) AS REAL) / COUNT(*) AS rating, COUNT(*) AS count FROM nft_project_rating_v1 WHERE communicationRating NOT NULL AND entityUid = ?`);
        ratings.communication      = communicationSumStmt.get(entityUid);

        const consistencySumStmt = db.prepare(`SELECT CAST(SUM(consistencyRating) AS REAL) / COUNT(*) AS rating, COUNT(*) AS count FROM nft_project_rating_v1 WHERE consistencyRating NOT NULL AND entityUid = ?`);
        ratings.consistency      = consistencySumStmt.get(entityUid);

        ratings.total = (ratings.rating.rating + ratings.community.rating + ratings.originality.rating + ratings.communication.rating + ratings.consistency.rating) / 5;

        const updateEntityStmt = db.prepare(`UPDATE entity_v1 SET rating = ?, reviewCount = (SELECT count(*) FROM review_v1 WHERE entityUid = ?) WHERE uid = ?`);
        updateEntityStmt.run(
            ratings.total,
            entityUid,
            entityUid
        );

        const updateNFTProjectStmt = db.prepare(`UPDATE nft_project_v1 SET communityRating = ?, originalityRating = ?, communicationRating = ?, consistencyRating = ? WHERE entityUid = ?`);
        updateNFTProjectStmt.run(
            ratings.community.rating,
            ratings.originality.rating,
            ratings.communication.rating,
            ratings.consistency.rating,
            entityUid
        );
    });

    try {
        transaction();
        console.log(
            `Updated rating for entity ${entityUid}.
    Rating: ${ratings.rating.rating} (${ratings.rating.count})
    Community: ${ratings.community.rating} (${ratings.community.count})
    Originality: ${ratings.originality.rating} (${ratings.originality.count})
    Communication: ${ratings.communication.rating} (${ratings.communication.count})
    Consistency: ${ratings.consistency.rating} (${ratings.consistency.count})`
        );
    }
    catch(err) {
        console.error(`Failed to insert review: ${err}`);
    }
});
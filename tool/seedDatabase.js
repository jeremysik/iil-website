const { faker }     = require('@faker-js/faker');
const betterSqlite3 = require('better-sqlite3');

// Load database
const config = require(`${process.cwd()}/config.json`);
const db     = new betterSqlite3(`${process.cwd()}${config.database.path}`);

// Create admin user
const insertAdminUserStmt = db.prepare(`INSERT INTO user_v1(uid, username, password, admin) VALUES(?, ?, ?, ?)`);
insertAdminUserStmt.run(
    faker.datatype.uuid(),
    'johndoe',
    '$2b$10$c9IeAfg4r3E/f6sH/eQ5/uZr6ZXmRt.VSVn7U.GukT4RunesCTAx2', // '111'
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
            const userUid        = faker.datatype.uuid();
            const insertUserStmt = db.prepare(`INSERT INTO user_v1(uid, username, password) VALUES(?, ?, ?)`);
            insertUserStmt.run(
                userUid,
                `${faker.name.firstName()}${faker.name.lastName()}${userUid}`,
                '$2b$10$c9IeAfg4r3E/f6sH/eQ5/uZr6ZXmRt.VSVn7U.GukT4RunesCTAx2', // '111'
            );
    
            const reviewUid        = faker.datatype.uuid();
            const insertReviewStmt = db.prepare(`INSERT INTO review_v1(uid, entityUid, userUid, comment, approved) VALUES(?, ?, ?, ?, ?)`);
            insertReviewStmt.run(
                reviewUid,
                entityUid,
                userUid,
                faker.datatype.boolean() ? faker.lorem.paragraph() : null,
                faker.datatype.float({min: 0, max: 1}) > 0.8 ? 0 : 1
            );

            const insertRatingStmt = db.prepare(`INSERT INTO nft_project_rating_v1(reviewUid, entityUid, communityRating, originalityRating, communicationRating) VALUES(?, ?, ?, ?, ?)`);
            insertRatingStmt.run(
                reviewUid,
                entityUid,
                faker.datatype.number({min: 1, max: 5}),
                faker.datatype.number({min: 1, max: 5}),
                faker.datatype.number({min: 1, max: 5})
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
    let ratings = null;
    const transaction = db.transaction(() => {
        const selectSumStmt = db.prepare(`
            SELECT CAST(SUM(communityRating) AS REAL) / COUNT(*) AS communityRating,
                CAST(SUM(originalityRating) AS REAL) / COUNT(*) AS originalityRating,
                CAST(SUM(communicationRating) AS REAL) / COUNT(*) AS communicationRating
            FROM nft_project_rating_v1 WHERE entityUid = ?
        `);
        ratings        = selectSumStmt.get(entityUid);
        ratings.rating = (ratings.communityRating + ratings.originalityRating + ratings.communicationRating) / 3;

        const updateEntityStmt = db.prepare(`UPDATE entity_v1 SET rating = ?, reviewCount = (SELECT count(*) FROM review_v1 WHERE entityUid = ?) WHERE uid = ?`);
        updateEntityStmt.run(
            ratings.rating,
            entityUid,
            entityUid
        );

        const updateNFTProjectStmt = db.prepare(`UPDATE nft_project_v1 SET communityRating = ?, originalityRating = ?, communicationRating = ? WHERE entityUid = ?`);
        updateNFTProjectStmt.run(
            ratings.communityRating,
            ratings.originalityRating,
            ratings.communicationRating,
            entityUid
        );
    });

    try {
        transaction();
        console.log(`Updated rating for entity ${entityUid}. Rating: ${ratings.rating}, community: ${ratings.communityRating}, originality: ${ratings.originalityRating}, communication: ${ratings.communicationRating}`);
    }
    catch(err) {
        console.error(`Failed to insert review: ${err}`);
    }

});
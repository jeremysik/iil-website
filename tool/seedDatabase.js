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
let entityCount = 0;
for(let i = 0; i < faker.datatype.number({min: 20, max: 100}); i++) {
    const transaction = db.transaction(() => {
        const entityUid = faker.datatype.uuid();
        entityUids.push(entityUid);

        const insertEntityStmt = db.prepare(`INSERT INTO entity_v1(uid, name, type) VALUES(?, ?, 'nft_project')`);
        insertEntityStmt.run(entityUid, `${faker.company.companyName()} ${faker.animal.type()} ${faker.music.genre()} ${faker.name.firstName()}`);

        const insertNftStmt = db.prepare(`INSERT INTO nft_project_v1(uid, entityUid, logoImageUrl, featuredImageUrl, bannerImageUrl, description) VALUES(?, ?, ?, ?, ?, ?)`);
        insertNftStmt.run(
            faker.datatype.uuid(), 
            entityUid,
            'https://lh3.googleusercontent.com/b0fSnR5cPyzYKx2udZGTS_KANhr8RxvsgfrPiZ9atdc9nMB7qSGHnoXyLt9DJG_QuqfZaBSet3bp8NjeaC0gfG7CVAZ_w8mLeIQm=h232',
            'https://lh3.googleusercontent.com/b0fSnR5cPyzYKx2udZGTS_KANhr8RxvsgfrPiZ9atdc9nMB7qSGHnoXyLt9DJG_QuqfZaBSet3bp8NjeaC0gfG7CVAZ_w8mLeIQm=h232',
            'https://lh3.googleusercontent.com/b0fSnR5cPyzYKx2udZGTS_KANhr8RxvsgfrPiZ9atdc9nMB7qSGHnoXyLt9DJG_QuqfZaBSet3bp8NjeaC0gfG7CVAZ_w8mLeIQm=h232',
            faker.lorem.paragraph()
        );
    });

    try {
        transaction();
        entityCount++;
    }
    catch(err) {
        console.error(`Failed to insert NFT project: ${err}`);
    }   
}

console.log(`Inserted ${entityCount} entities`);

// Add reviews
let totalReviewCount = 0;
entityUids.forEach((entityUid) => {
    let reviewCount = 0;
    for(let i = 0; i < faker.datatype.number({max: 2500}); i++) {
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

            const insertRatingStmt = db.prepare(`INSERT INTO nft_project_rating_v1(uid, entityUid, reviewUid, communityRating, originalityRating, communicationRating, consistencyRating) VALUES(?, ?, ?, ?, ?, ?, ?)`);
            insertRatingStmt.run(
                faker.datatype.uuid(),
                entityUid,
                reviewUid,
                faker.datatype.number({min: 1, max: 5}),
                faker.datatype.number({min: 1, max: 5}),
                faker.datatype.number({min: 1, max: 5}),
                faker.datatype.number({min: 1, max: 5})
            );
        });
    
        try {
            transaction();
            reviewCount++;
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
    let rating = null;
    const transaction = db.transaction(() => {
        const selectSumStmt = db.prepare(`SELECT SUM((communityRating + originalityRating + communicationRating + consistencyRating) / 4.0) / COUNT(*) AS rating FROM nft_project_rating_v1 WHERE entityUid = ?`);
        rating              = selectSumStmt.get(entityUid).rating;

        const updateEntityStmt = db.prepare(`UPDATE entity_v1 SET rating = ?, reviewCount = (SELECT count(*) FROM review_v1 WHERE entityUid = ?) WHERE uid = ?`);
        updateEntityStmt.run(
            rating,
            entityUid,
            entityUid
        );
    });

    try {
        transaction();
        console.log(`Updated rating for entity ${entityUid}: ${rating}`);
    }
    catch(err) {
        console.error(`Failed to insert review: ${err}`);
    }

});
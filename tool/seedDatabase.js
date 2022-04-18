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
    const entityUid = faker.datatype.uuid();
    entityUids.push(entityUid);

    const transaction = db.transaction(() => {
        const insertEntityStmt = db.prepare(`INSERT INTO entity_v1(uid, name, type, logoImageUrl) VALUES(?, ?, ?, ?)`);
        insertEntityStmt.run(
            entityUid, 
            `${faker.company.companyName()} ${faker.animal.type()} ${faker.music.genre()} ${faker.name.firstName()}`,
            'nft_project',
            'https://lh3.googleusercontent.com/b0fSnR5cPyzYKx2udZGTS_KANhr8RxvsgfrPiZ9atdc9nMB7qSGHnoXyLt9DJG_QuqfZaBSet3bp8NjeaC0gfG7CVAZ_w8mLeIQm'
        );

        const insertNftStmt = db.prepare(`INSERT INTO nft_project_v1(entityUid, featuredImageUrl, bannerImageUrl, description, websiteUrl, twitterUrl, discordUrl, openSeaUrl) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`);
        insertNftStmt.run(
            entityUid,
            'https://lh3.googleusercontent.com/b0fSnR5cPyzYKx2udZGTS_KANhr8RxvsgfrPiZ9atdc9nMB7qSGHnoXyLt9DJG_QuqfZaBSet3bp8NjeaC0gfG7CVAZ_w8mLeIQm',
            'https://lh3.googleusercontent.com/b0fSnR5cPyzYKx2udZGTS_KANhr8RxvsgfrPiZ9atdc9nMB7qSGHnoXyLt9DJG_QuqfZaBSet3bp8NjeaC0gfG7CVAZ_w8mLeIQm',
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
        const userAddress = faker.datatype.uuid();
        const reviewUid   = faker.datatype.uuid();

        const rating              = faker.datatype.number({min: 1, max: 5});
        const communityRating     = faker.datatype.boolean() ? null : faker.datatype.number({min: 1, max: 5});
        const originalityRating   = faker.datatype.boolean() ? null : faker.datatype.number({min: 1, max: 5});
        const communicationRating = faker.datatype.boolean() ? null : faker.datatype.number({min: 1, max: 5});
        const consistencyRating   = faker.datatype.boolean() ? null : faker.datatype.number({min: 1, max: 5});

        const transaction = db.transaction(() => {
            const insertUserStmt = db.prepare(`INSERT INTO user_v1(address) VALUES(?)`);
            insertUserStmt.run(userAddress);
            
            const insertReviewStmt = db.prepare(`INSERT INTO review_v1(uid, entityUid, userAddress, rating, comment, approved) VALUES(?, ?, ?, ?, ?, ?)`);
            insertReviewStmt.run(
                reviewUid,
                entityUid,
                userAddress,
                rating,
                faker.datatype.boolean() ? faker.lorem.paragraph() : null,
                faker.datatype.float({min: 0, max: 1}) > 0.8 ? 0 : 1
            );

            const insertRatingStmt = db.prepare(`INSERT INTO nft_project_review_rating_v1(reviewUid, entityUid, communityRating, originalityRating, communicationRating, consistencyRating) VALUES(?, ?, ?, ?, ?, ?)`);
            insertRatingStmt.run(
                reviewUid,
                entityUid,
                communityRating,
                originalityRating,
                communicationRating,
                consistencyRating
            );

            const ratingHistoryStmt = db.prepare(`SELECT * FROM nft_project_rating_history_v1 WHERE entityUid = ? ORDER BY ratingCount DESC LIMIT 1`);
            const ratingHistoryRow  = ratingHistoryStmt.get(entityUid);

            const insertRatingHistoryStmt = db.prepare(`
                INSERT INTO
                    nft_project_rating_history_v1(
                        uid, entityUid, rating, ratingCount, communityRating, communityRatingCount, originalityRating, originalityRatingCount, communicationRating,
                        communicationRatingCount, consistencyRating, consistencyRatingCount, totalRating
                    )
                VALUES(
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            `);

            if(!ratingHistoryRow) {
                let totalRating        = Number.parseFloat(rating);
                let totalRatingDivider = 1;
                if(communityRating) {
                    totalRatingDivider++;
                    totalRating += Number.parseFloat(communityRating);
                }     
                if(originalityRating) {
                    totalRatingDivider++;
                    totalRating += Number.parseFloat(originalityRating);
                }
                if(communicationRating) {
                    totalRatingDivider++;
                    totalRating += Number.parseFloat(communicationRating);
                } 
                if(consistencyRating) {
                    totalRatingDivider++;
                    totalRating += Number.parseFloat(consistencyRating);
                }

                insertRatingHistoryStmt.run(
                    faker.datatype.uuid(),
                    entityUid,
                    rating,
                    1,
                    communityRating,
                    communityRating     ? 1 : 0,
                    originalityRating,
                    originalityRating   ? 1 : 0,
                    communicationRating,
                    communicationRating ? 1 : 0,
                    consistencyRating,
                    consistencyRating   ? 1 : 0,
                    totalRating / totalRatingDivider
                );
                return;
            }

            let newAverage  = [faker.datatype.uuid(), entityUid];
            let ratingTypes = [
                {
                    next:    rating,
                    average: ratingHistoryRow.rating,
                    count:   ratingHistoryRow.ratingCount
                },
                {
                    next:    communityRating,
                    average: ratingHistoryRow.communityRating,
                    count:   ratingHistoryRow.communityRatingCount
                },
                {
                    next:    originalityRating,
                    average: ratingHistoryRow.originalityRating,
                    count:   ratingHistoryRow.originalityRatingCount
                },
                {
                    next:    communicationRating,
                    average: ratingHistoryRow.communicationRating,
                    count:   ratingHistoryRow.communicationRatingCount
                },
                {
                    next:    consistencyRating,
                    average: ratingHistoryRow.consistencyRating,
                    count:   ratingHistoryRow.consistencyRatingCount
                }
            ];

            let totalRatingDivider = 0;
            let totalRating        = 0;
            ratingTypes.forEach((ratingType) => {
                let newCount  = ratingType.next ? ratingType.count + 1 : ratingType.count;
                let newRating = ratingType.next ? ratingType.average + ((ratingType.next - ratingType.average) / newCount) : ratingType.average;
                
                if(newRating) totalRatingDivider++;
                totalRating += newRating;

                newAverage.push(newRating);
                newAverage.push(newCount);
            });

            newAverage.push(totalRating / totalRatingDivider);

            insertRatingHistoryStmt.run(newAverage);
        });
    
        try {
            transaction();
        }
        catch(err) {
            reviewCount--;
            console.error(`Failed to insert review: ${err}`);
        }    
    }

    console.log(`\nInserted reviews for entity ${entityUid}`);

    const ratingHistoryStmt = db.prepare(`SELECT * FROM nft_project_rating_history_v1 WHERE entityUid = ? ORDER BY ratingCount DESC LIMIT 1`);
    const ratingHistoryRow  = ratingHistoryStmt.get(entityUid);

    console.log(`Total Rating:         ${ratingHistoryRow.totalRating}`);
    console.log(`Rating:               ${ratingHistoryRow.rating} (${ratingHistoryRow.ratingCount})`);
    console.log(`Community Rating:     ${ratingHistoryRow.communityRating} (${ratingHistoryRow.communityRatingCount})`);
    console.log(`Originality Rating:   ${ratingHistoryRow.originalityRating} (${ratingHistoryRow.originalityRatingCount})`);
    console.log(`Communication Rating: ${ratingHistoryRow.communicationRating} (${ratingHistoryRow.communicationRatingCount})`);
    console.log(`Consistency Rating:   ${ratingHistoryRow.consistencyRating} (${ratingHistoryRow.consistencyRatingCount})`);

    totalReviewCount += reviewCount;
});

console.log(`\nInserted ${totalReviewCount} reviews in total`);
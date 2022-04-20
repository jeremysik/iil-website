const fs            = require('fs');
const glob          = require('glob');
const path          = require('path');
const betterSqlite3 = require('better-sqlite3');
const axios         = require('axios');
const { v4: uuid }  = require('uuid');

// Used to scrape the slugs off collection page on OpenSea
/*

let slugs = [];

[].forEach.call(document.querySelectorAll('a.bLnGLm'), (element) => {
    let slug = element.href.split('/collection/')[1];
    if(!slugs.includes(slug)) slugs.push(slug);
});

*/

const update = process.argv[2] && process.argv[2] == 'update' ? true : false;
const src    = `${process.cwd()}/tool/openSeaProjectSlugs`;

// Get DB
let config = require(`${process.cwd()}/config.json`);

// Update paths in config
function updatePaths(parent) {
    (Object.keys(parent)).forEach(key => {
        if(key == 'path') {
            parent[key] = path.normalize(`${global.rootPath}/../${parent[key]}`);
        } else if (typeof parent[key] == 'object') {
            updatePaths(parent[key]);
        }
    });

}
updatePaths(config);

const db = new betterSqlite3(config.database.path);

// Load em up!
let slugs     = [];
let slugFiles = glob.sync(`${src}/*.json`);
slugFiles.forEach((slugFile) => {
    const contents = fs.readFileSync(slugFile, 'utf8');
    slugs = slugs.concat(JSON.parse(contents));
});

console.log(`Running in ${update ? 'update' : 'insert'} mode!\n`);

async function processName(position) {
    let slug = slugs[position];

    if(!slug) {
        console.log('\nDone!');
        return;
    }

    const stmt = db.prepare(`SELECT * FROM nft_project_v1 WHERE openSeaUrl = ?`);
    const row  = stmt.get(`https://opensea.io/collection/${slug}`);

    if(row && !update) {
        console.log(`${slug} exists, skipping.`);
        processName(position + 1);
        return;
    }

    const response = await axios({
        method: 'get',
        url:    `https://api.opensea.io/api/v1/collection/${slug}`
    });

    if(!response || !response.data) {
        console.warn(`${slug} couldn't get response.data, skipping.`);
        processName(position + 1);
        return;
    }


    if(response.data.collection.stats.total_volume < 0.1) {
        console.warn(`${slug} volume too low (<0.1), skipping.`);
        processName(position + 1);
        return;
    }

    if(response.data.collection.stats.num_owners < 5) {
        console.warn(`${slug} number of owners too low (<5), skipping.`);
        processName(position + 1);
        return;
    }

    if(!response.data.collection.image_url) {
        console.warn(`${slug} no logo image, skipping.`);
        processName(position + 1);
        return;
    }

    if(!response.data.collection.name) {
        console.warn(`${slug} no name, skipping.`);
        processName(position + 1);
        return;
    }

    const logoImageUrl     = response.data.collection.image_url.split('=')[0];
    const bannerImageUrl   = response.data.collection.banner_image_url   ? response.data.collection.banner_image_url.split('=')[0]   : null;
    const featuredImageUrl = response.data.collection.featured_image_url ? response.data.collection.featured_image_url.split('=')[0] : null;
    const largeImageUrl    = response.data.collection.large_image_url    ? response.data.collection.large_image_url.split('=')[0]    : null;

    if(row && update) {
        const transaction = db.transaction(() => {
            const insertEntityStmt = db.prepare(`UPDATE entity_v1 SET logoImageUrl = ? WHERE uid = ?`);
            insertEntityStmt.run(
                logoImageUrl,
                row.entityUid
            );
    
            const insertNftStmt = db.prepare(`UPDATE nft_project_v1 SET featuredImageUrl = ?, bannerImageUrl = ?, description = ?, websiteUrl = ?, twitterUrl = ?, discordUrl = ?, openSeaUrl = ? WHERE entityUid = ?`);
            insertNftStmt.run(
                featuredImageUrl ? featuredImageUrl : largeImageUrl ? largeImageUrl : bannerImageUrl ? bannerImageUrl          : null,
                bannerImageUrl ? bannerImageUrl : featuredImageUrl ? featuredImageUrl : largeImageUrl ? largeImageUrl          : null,
                response.data.collection.description      ? response.data.collection.description                               : null,
                response.data.collection.external_url     ? response.data.collection.external_url                              : null,
                response.data.collection.twitter_username ? `https://twitter.com/${response.data.collection.twitter_username}` : null,
                response.data.collection.discord_url      ? response.data.collection.discord_url                               : null,
                `https://opensea.io/collection/${slug}`,
                row.entityUid
            );
        });
    
        try {
            transaction();
            console.log(`${slug} successfully updated!`);
        }
        catch(err) {
            console.error(`Failed to update NFT project: ${err}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        processName(position + 1);
        return;
    }

    const entityUid   = uuid();
    const transaction = db.transaction(() => {
        const insertEntityStmt = db.prepare(`INSERT INTO entity_v1(uid, name, type, logoImageUrl) VALUES(?, ?, ?, ?)`);
        insertEntityStmt.run(
            entityUid, 
            response.data.collection.name,
            'nft_project',
            logoImageUrl
        );

        const insertNftStmt = db.prepare(`INSERT INTO nft_project_v1(entityUid, featuredImageUrl, bannerImageUrl, description, websiteUrl, twitterUrl, discordUrl, openSeaUrl) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`);
        insertNftStmt.run(
            entityUid,
            featuredImageUrl ? featuredImageUrl : largeImageUrl ? largeImageUrl : bannerImageUrl ? bannerImageUrl          : null,
                bannerImageUrl ? bannerImageUrl : featuredImageUrl ? featuredImageUrl : largeImageUrl ? largeImageUrl      : null,
            response.data.collection.description      ? response.data.collection.description                               : null,
            response.data.collection.external_url     ? response.data.collection.external_url                              : null,
            response.data.collection.twitter_username ? `https://twitter.com/${response.data.collection.twitter_username}` : null,
            response.data.collection.discord_url      ? response.data.collection.discord_url                               : null,
            `https://opensea.io/collection/${slug}`
        );
    });

    try {
        transaction();
        console.log(`${slug} successfully added!`);
    }
    catch(err) {
        console.error(`Failed to insert NFT project: ${err}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    processName(position + 1);
}

processName(0);
const fs = require("fs");
const sqlite = require('sqlite-async');
const moment = require("moment");


async function init(user) {
    const database = await sqlite.open(`./ingested-data/${user}.db`)
    await database.exec(
        `DROP TABLE IF EXISTS plays;

        CREATE TABLE plays
        (
            username TEXT NOT NULL,
            artist   TEXT NOT NULL,
            album    TEXT NOT NULL,
            title    TEXT NOT NULL,
            date     DATE NOT NULL
        );

        CREATE INDEX plays_username_idx ON plays (username);

        CREATE INDEX plays_artist_idx ON plays (artist);

        CREATE INDEX plays_album_idx ON plays (album);`)
    return database
}

async function ingest(user) {
    const database = await init(user),
        raw = fs.readdirSync("./raw-data")
            .filter(f => f.startsWith(`${user}-`) && f.endsWith('.json'));

    for (const file of raw) {
        const content = fs.readFileSync(`./raw-data/${file}`).toString(),
            {recenttracks: {track: tracks}} = JSON.parse(content);

        for (const {
            name: title,
            artist: {"#text": artist},
            album: {"#text": album},
            date: {uts: timestamp}
        } of tracks) {
            const date = moment.unix(parseInt(timestamp)).utc().toISOString()
            await database.run(
                `INSERT INTO plays(username, artist, album, title, date) 
                 VALUES (?,?,?,?,?)`,
                user, artist, album, title, date)
        }
    }
}

module.exports = ingest
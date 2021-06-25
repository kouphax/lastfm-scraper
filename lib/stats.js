const fs = require("fs");
const sqlite = require('sqlite-async');
const moment = require("moment");


async function stats(user) {
    const database = await sqlite.open(`./ingested-data/${user}.db`)
    // console.log(await database.all(
    //     `SELECT
    //         COUNT(artist) as count,
    //         artist
    //     FROM plays
    //     GROUP BY artist
    //     ORDER BY COUNT(artist) DESC`));
    //
    // console.log(await database.all(
    //     `SELECT
    //         COUNT(title) as count,
    //         title
    //     FROM plays
    //     GROUP BY artist + album + title
    //     ORDER BY COUNT(title) DESC`));

    console.log(await database.all(
        `SELECT COUNT(DISTINCT artist) as count
         FROM plays`));
}

module.exports = stats
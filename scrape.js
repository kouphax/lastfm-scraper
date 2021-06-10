#!/usr/bin/env node

const axios = require("axios");
const argv = require("yargs/yargs")(process.argv.slice(2)).argv._;
const fs = require("fs");
const moment = require("moment");

if (argv.length < 2) {
    console.log("node scrape.js username api-key");
    process.exit(1);
}

const [user, api_key] = argv;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function recentTracksRequest(user, api_key, page) {
    return axios.get("http://ws.audioscrobbler.com/2.0/", {
        params: {
            method: "user.getrecenttracks",
            format: "json",
            limit: 200,
            extended: 0,
            user,
            api_key,
            page,
        },
    });
}

function formatDate(date) {

}

function formatTrack(track) {
    return {
        artist: track.artist["#text"],
        album: track.album["#text"],
        title: track.name,
        date: moment.unix(parseInt(track.date.uts)).utc().format("YYYYMMDDHHmm")
    };
}

async function main() {
    const page1 = await recentTracksRequest(user, api_key, 1);

    const { recenttracks: { track, ["@attr"]: attrs } } = page1.data,
        totalPages = parseInt(attrs.totalPages, 10),
        pages = [...Array(totalPages).keys()].slice(1);

    for (page of pages) {
        const response = await recentTracksRequest(user, api_key, page)

        try {
            const { data: { recenttracks: { track } } } = response,
            latestDate = formatTrack(track[0]).date,
                earliestDate = formatTrack(track[track.length - 1]).date,
                content = JSON.stringify(response.data, null, 2),
                filename = `./raw-data/${user}-${latestDate}-${earliestDate}.json`
            console.log(`writing ${filename}`)
            fs.writeFileSync(filename, content)
            await sleep(500)
        } catch (error) {
            console.dir(response)
            console.error(error)
            process.exit(1)
        }
    }
}

main();
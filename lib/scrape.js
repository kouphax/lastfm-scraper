const axios = require("axios");
const fs = require("fs");
const moment = require("moment")

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatTrack(track) {
    return {
        artist: track.artist["#text"],
        album: track.album["#text"],
        title: track.name,
        date: moment.unix(parseInt(track.date.uts)).utc().format("YYYYMMDDHHmm")
    };
}

function recentTracksRequest(user, api_key, page, from) {
    return axios.get("http://ws.audioscrobbler.com/2.0/", {
        params: {
            method: "user.getrecenttracks",
            format: "json",
            limit: 200,
            extended: 0,
            user,
            api_key,
            page,
            from: from || 0
        },
    });
}

async function scrapeFrom(user, key, from) {
    const page1 = await recentTracksRequest(user, key, 1, from);
    const {recenttracks: {track, ["@attr"]: attrs}} = page1.data,
        totalPages = parseInt(attrs.totalPages, 10),
        pages = [...Array(totalPages).keys()].slice(1);

    for (let page of pages) {
        const response = await recentTracksRequest(user, key, page, from)
        try {
            const {data: {recenttracks: {track}}} = response,
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

async function scrape(user, key, latest) {
    let from = 0
    if (latest) {
        const [lastScrape] = fs.readdirSync('./raw-data').slice(-1)
        if (lastScrape) {
            const [timestamp] = lastScrape.split('-').slice(-2, -1)
            from = moment(timestamp, "YYYYMMDDHHmm").unix()
            console.log(`scraping from ${from}`)
        }
    }

    await scrapeFrom(user, key, from)
}

module.exports = scrape
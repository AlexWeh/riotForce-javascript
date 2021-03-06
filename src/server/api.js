/* eslint-disable no-unused-vars */
const fetch = require('node-fetch');
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const cors = require('cors');
const db = require('./database/sqlite');
const QueueManager = require('./QueueManager');

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors());

const HOST = process.env.API_HOST || 'localhost';
const PORT = process.env.API_PORT || 3002;

const QUERYCOUNT = 10;

let requestOptions;
let queue = new QueueManager();
let REGION;
let BASE_HTTPS = 'https://';
let BASE_URL = '.api.riotgames.com';

app.get('/api/v1/endpoint', (req, res) => {
    if (
        req.query.apiKey !== '' &&
        req.query.pName !== '' &&
        req.query.region !== ''
    ) {
        requestOptions = {
            method: 'GET',
            headers: { 'X-Riot-Token': req.query.apiKey },
            redirect: 'follow'
        };
        REGION = req.query.region;

        getPUUIDbySummonerName(req.query.pName)
            .then((result) =>
                getMatchesByPUUID(result)
                    .then((response) => {
                        res.json(response);
                        loopMatchResult(response);
                    })
                    .catch((err) => console.log(err))
            )
            .catch((error) => console.log(error));
    }
});

async function getPUUIDbySummonerName(SummonerName) {
    return fetch(
        'https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/' +
            SummonerName,
        requestOptions
    )
        .then((response) => response.json())
        .then((result) => {
            return result.puuid;
        })
        .catch((error) => console.log('error', error));
}

async function getMatchesByPUUID(SummonerPUUID) {
    return fetch(
        BASE_HTTPS +
            REGION +
            BASE_URL +
            '/tft/match/v1/matches/by-puuid/' +
            SummonerPUUID +
            '/ids?count=' +
            QUERYCOUNT,
        requestOptions
    )
        .then((response) => response.json())
        .then((result) => {
            return result;
        })
        .catch((error) => console.log('error', error));
}

async function getMatcheByID(MatchID) {
    return fetch(
        BASE_HTTPS + REGION + BASE_URL + '/tft/match/v1/matches/' + MatchID,
        requestOptions
    )
        .then((response) => response.json())
        .then((result) => {
            return result;
        })
        .catch((error) => console.log('error', error));
}

async function loopMatchResult(matchArray) {
    for await (let match_id of matchArray) {
        queue.queueUp(processMatch, match_id);
    }
}

async function processMatch(match_id) {
    getMatcheByID(match_id).then((matchObj) =>
        db.storeMatch(matchObj).catch((error) => {
            console.log(error);
        })
    );
}

db.init()
    .then(() => {
        app.listen(PORT, () => {
            console.log(
                `✅  API Server started: http://${HOST}:${PORT}/api/v1/endpoint`
            );
        });
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });

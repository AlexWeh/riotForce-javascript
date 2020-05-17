// Simple Express server setup to serve for local testing/dev API server
const fetch = require('node-fetch');
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const cors = require('cors');
const db = require('./sqlite');
//const { v4: uuid } = require('uuid');

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors());

const HOST = process.env.API_HOST || 'localhost';
const PORT = process.env.API_PORT || 3002;

let requestOptions;

let REGION;
let BASE_URL = 'https://' + REGION + '.api.riotgames.com';

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
                        processMathResponse(response);
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
        BASE_URL + '/tft/match/v1/matches/by-puuid/' + SummonerPUUID + '/ids',
        requestOptions
    )
        .then((response) => response.json())
        .then((result) => {
            return result;
        })
        .catch((error) => console.log('error', error));
}

async function getMatcheByID(MatchID) {
    return fetch(BASE_URL + '/tft/match/v1/matches/' + MatchID, requestOptions)
        .then((response) => response.json())
        .then((result) => {
            return result;
        })
        .catch((error) => console.log('error', error));
}

function processMathResponse(matchArray) {
    matchArray.forEach((match) => {
        getMatcheByID(match).then((result) => console.log(result));
    });
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

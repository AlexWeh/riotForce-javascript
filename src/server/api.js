// Simple Express server setup to serve for local testing/dev API server
const fetch = require('node-fetch');
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors());

const HOST = process.env.API_HOST || 'localhost';
const PORT = process.env.API_PORT || 3002;

let requestOptions;

app.get('/api/v1/endpoint', (req, res) => {
    console.log('Key: ' + req.query.apiKey);
    requestOptions = {
        method: 'GET',
        headers: { 'X-Riot-Token': req.query.apiKey },
        redirect: 'follow'
    };

    getPUUIDbySummonerName(req.query.pName)
        .then((result) =>
            getMatchesByPUUID(result)
                .then((response) => {
                    res.json(response);
                    console.log(response);
                })
                .catch((err) => console.log(err))
        )
        .catch((error) => console.log(error));
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
        'https://europe.api.riotgames.com/tft/match/v1/matches/by-puuid/' +
            SummonerPUUID +
            '/ids',
        requestOptions
    )
        .then((response) => response.json())
        .then((result) => {
            return result;
        })
        .catch((error) => console.log('error', error));
}

app.listen(PORT, () =>
    console.log(
        `✅  API Server started: http://${HOST}:${PORT}/api/v1/endpoint`
    )
);

// Simple Express server setup to serve for local testing/dev API server
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');

const app = express();
app.use(helmet());
app.use(compression());

const HOST = process.env.API_HOST || 'localhost';
const PORT = process.env.API_PORT || 3002;

const XHR = new XMLHttpRequest();

const API_KEY = 'RGAPI-9601fc49-0710-481b-83a5-0a1a41b3abcd';

app.get('/api/v1/endpoint', (req, res) => {
    res.json('done');
    getPUUIDbySummonerName('GeneralGorgeous')
        .then((resolve) => {
            console.log(resolve);
        })
        .catch((reject) => {
            console.log(reject);
        });
});

async function getPUUIDbySummonerName(SummonerName) {
    XHR.withCredentials = true;

    XHR.addEventListener('readystatechange', function () {
        if (this.readyState === 4) {
            console.log(this.responseText);
            return this.responseText;
        }
        return 'error';
    });

    XHR.open(
        'GET',
        'https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/' +
            SummonerName
    );
    XHR.setRequestHeader('X-Riot-Token', API_KEY);

    XHR.send();
}

/*function getMatchesByPUUID(SummonerPUUID ) {
    XHR.withCredentials = true;

    XHR.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
            return this.responseText;
        }
        return 'error';
    });

    XHR.open("GET", "https://euw1.api.riotgames.com/lol/match/v4/matchlists/by-account/Ea_iOV3_A2f_pevljK2MFMCeSaBooBJ_hOnOugQsOBL5MA?beginIndex=0" & SummonerPUUID);
    XHR.setRequestHeader("X-Riot-Token", API_KEY);

    XHR.send();
}*/

app.listen(PORT, () =>
    console.log(
        `✅  API Server started: http://${HOST}:${PORT}/api/v1/endpoint`
    )
);

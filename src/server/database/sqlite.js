/* eslint-disable no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable consistent-return */
const sqlite3 = require('sqlite3').verbose();
const { v4: uuid } = require('uuid');
const fs = require('fs');
let location = './src/server/database/match.db';
let db;

function init() {
    if (process.env.MEMORY_DB) {
        location = ':memory:';
    }

    return new Promise((acc, rej) => {
        db = new sqlite3.Database(location, (err) => {
            if (err) return rej(err);
            console.log(`Using sqlite database in ` + location);
            if (process.env.MEMORY_DB) {
                db.run(
                    'CREATE TABLE Version (version_id TEXT, start_date NUMERIC, end_date NUMERIC, PRIMARY KEY(version_id))',
                    (err) => {
                        if (err) return rej(err);
                    }
                );

                db.run('', (err) => {
                    if (err) return rej(err);
                });

                db.run('', (err) => {
                    if (err) return rej(err);
                });

                db.run('', (err) => {
                    if (err) return rej(err);
                });

                db.run('', (err) => {
                    if (err) return rej(err);
                });

                db.run('', (err) => {
                    if (err) return rej(err);
                });

                db.run('', (err) => {
                    if (err) return rej(err);
                });

                db.run('', (err) => {
                    if (err) return rej(err);
                });

                db.run('', (err) => {
                    if (err) return rej(err);
                });

                db.run(
                    'CREATE TABLE Champion (champion_id TEXT, name TEXT, version INTEGER, rarity INTEGER, tier INTEGER, cost INTEGER, PRIMARY KEY(champion_id), FOREIGN KEY(version) REFERENCES Version(version_id))',
                    (err) => {
                        if (err) return rej(err);
                    }
                );
            }
            acc();
        });
    });
}

async function teardown() {
    return new Promise((acc, rej) => {
        db.close((err) => {
            if (err) rej(err);
            else acc();
        });
    });
}

function prepareVersionNumber(versionString) {
    return versionString.split(' ')[1];
}

async function storeMatch(match) {
    console.log(match);
    console.log(match.info.participants[0]);
    let version = prepareVersionNumber(match.info.game_version);

    let match_info_data = match.metadata.match_id.split('_');
    let realm = match_info_data[0];
    let match_id = match_info_data[1];
    return new Promise((acc, rej) => {
        setVersion(version);

        match.info.participants.forEach((participant) => {
            participant.units.forEach((unit) => {
                let champsWithItems;
                unit.items.forEach((item) => {
                    champsWithItems = setChampionItem(
                        unit.character_id,
                        item.item_id
                    );
                });
            });
        });

        let dbmatch = setMatch(
            match_id,
            match.info.queue_id,
            match.info.tft_set_number,
            match.metadata.data_version,
            version,
            match.info.game_datetime,
            match.info.game_length,
            realm
        );
    });
}

/*-------------CRUD----------------*/

async function getVersion(version) {
    db.get(
        'SELECT * FROM Version WHERE (version_id)= (?)',
        [version],
        (err, row) => {
            if (err) return err;
            return row;
        }
    );
}

async function setVersion(version) {
    db.run(
        'INSERT OR IGNORE INTO Version (version_id) VALUES (?)',
        [version],
        (err) => {
            if (err) return err;
        }
    );
}

async function getChampion(params) {}

async function setChampion(params) {}

async function getItem(params) {}

async function setItem(params) {}

async function getTrait(params) {}

async function setTrait(params) {}

async function getParticipant(puuid) {
    db.get(
        'SELECT * FROM Participant WHERE (puuid)= (?)',
        [puuid],
        (err, row) => {
            if (err) return err;
            return row;
        }
    );
}

async function setParticipant(params) {}

async function getMatch(match_id) {
    db.get(
        'SELECT * FROM Match WHERE (match_id)= (?)',
        [match_id],
        (err, row) => {
            if (err) return err;
            return row;
        }
    );
}

async function setMatch(
    match_id,
    queue_id,
    tft_set_number,
    data_version,
    version,
    ame_datetime,
    game_length,
    realm
) {
    db.run(
        'INSERT OR IGNORE INTO Match (match_id, queue_id, tft_set_number, data_version, version, game_datetime, game_length, realm) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
            match_id,
            queue_id,
            tft_set_number,
            data_version,
            version,
            ame_datetime,
            game_length,
            realm
        ],
        (err) => {
            if (err) return err;
        }
    );
}

async function getMatchParticipant(params) {}

async function setMatchParticipant(params) {}

async function getParticipantChampion(params) {}

async function setParticipantChampion(params) {}

async function getChampionItem(params) {}

async function setChampionItem(champion_id, item_id) {
    db.all(
        'INSERT INTO Champion_Items (uuid, champion_id, item_id) VALUES (?, ?, ?)',
        [uuid(), champion_id, item_id],
        (err, rows) => {
            if (err) return err;
            //champsWithItems.push();
            console.log(rows);
            return rows;
        }
    );
}

async function getChampionTrait(params) {}

async function setChampionTrait(params) {}

/*---------------Static----------------*/
function loadStaticItems() {
    let data = fs.readFileSync('./src/server/database/static/items.json');
    let items = JSON.parse(data);
    items.forEach((item) => {
        db.run(
            'INSERT OR IGNORE INTO Item (item_id, item_name) VALUES (?, ?)',
            [item.id, item.name],
            (err) => {
                console.log(err);
            }
        );
    });
}

function loadStaticTraits() {
    let data = fs.readFileSync('./src/server/database/static/traits.json');
    let items = JSON.parse(data);
    items.forEach((item) => {
        db.run(
            'INSERT OR IGNORE INTO Trait (trait_id, trait_name, type) VALUES (?, ?, ?)',
            [item.key, item.name, item.type],
            (err) => {
                console.log(err);
            }
        );
    });
}

function loadStaticChampions() {
    let data = fs.readFileSync('./src/server/database/static/champions.json');
    let items = JSON.parse(data);
    items.forEach((item) => {
        db.run(
            'INSERT OR IGNORE INTO Champion (champion_id, name, cost) VALUES (?, ?, ?)',
            [item.championId, item.name, item.cost],
            (err) => {
                console.log(err);
            }
        );
    });
}

module.exports = {
    init,
    teardown,
    storeMatch,
    loadStaticItems,
    loadStaticTraits,
    loadStaticChampions
};

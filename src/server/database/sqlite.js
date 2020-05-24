/* eslint-disable no-empty-function */
/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
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

                db.run(
                    'CREATE TABLE Trait (  trait_id TEXT UNIQUE,  name TEXT,  total_number INTEGER,  type TEXT,  PRIMARY KEY(trait_id) ) ',
                    (err) => {
                        if (err) return rej(err);
                    }
                );

                db.run(
                    'CREATE TABLE Champion (  champion_id TEXT,  name TEXT,  version INTEGER,  rarity INTEGER,  tier INTEGER,  cost INTEGER,  PRIMARY KEY(champion_id),  FOREIGN KEY(version) REFERENCES Version(version_id) )',
                    (err) => {
                        if (err) return rej(err);
                    }
                );

                db.run(
                    'CREATE TABLE Item (  item_id INTEGER UNIQUE,  name TEXT,  PRIMARY KEY(item_id) ) ',
                    (err) => {
                        if (err) return rej(err);
                    }
                );

                db.run(
                    'CREATE TABLE Participant (  puuid TEXT,  gold_left INTEGER,  companion INTEGER,  last_round INTEGER,  level INTEGER,  placement INTEGER,  players_eliminated INTEGER,  time_eliminated NUMERIC,  total_damage_to_players INTEGER,  champions INTEGER,  PRIMARY KEY(puuid) ) ',
                    (err) => {
                        if (err) return rej(err);
                    }
                );

                db.run(
                    'CREATE TABLE Champion_Items (  uuid TEXT,  champion INTEGER,  item INTEGER,  FOREIGN KEY(champion) REFERENCES Champion(champion_id),  FOREIGN KEY(item) REFERENCES Item(item_id) )',
                    (err) => {
                        if (err) return rej(err);
                    }
                );

                db.run(
                    'CREATE TABLE Champion_Traits (  champion INTEGER,  trait INTEGER,  FOREIGN KEY(trait) REFERENCES Trait(trait_id),  FOREIGN KEY(champion) REFERENCES Champion(champion_id) )',
                    (err) => {
                        if (err) return rej(err);
                    }
                );

                db.run(
                    'CREATE TABLE Participant_Champions (  participant INTEGER,  champion INTEGER,  items TEXT,  uuid TEXT,  FOREIGN KEY(participant) REFERENCES Participant(puuid),  FOREIGN KEY(champion) REFERENCES Champion(champion_id),  FOREIGN KEY(items) REFERENCES Champion_Items(uuid) ) ',
                    (err) => {
                        if (err) return rej(err);
                    }
                );

                db.run(
                    'CREATE TABLE Match_Participants (  match INTEGER,  participant TEXT,  FOREIGN KEY(match) REFERENCES Match(match_id),  FOREIGN KEY(participant) REFERENCES Participant(puuid) )',
                    (err) => {
                        if (err) return rej(err);
                    }
                );

                db.run(
                    'CREATE TABLE Match (  match_id TEXT,  queue_id INTEGER,  tft_set_number INTEGER,  data_version INTEGER,  version INTEGER,  game_datetime NUMERIC,  game_length NUMERIC,  PRIMARY KEY(match_id),  FOREIGN KEY(version) REFERENCES Version(version_id) )',
                    (err) => {
                        if (err) return rej(err);
                    }
                );

                loadStaticChampions();
                loadStaticItems();
                loadStaticTraits();
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
    let version = prepareVersionNumber(match.info.game_version);

    await setMatch(
        match.metadata.match_id,
        match.info.queue_id,
        match.info.tft_set_number,
        match.metadata.data_version,
        version,
        match.info.game_datetime,
        match.info.game_length
    ).catch((error) => {
        throw error;
    });

    let matchParticipantRowId = uuid();
    await setVersion(version);

    for await (let participant of match.info.participants) {
        let participantChampionRowId = uuid();
        for await (let unit of participant.units) {
            let itemRowId = uuid();
            for await (let item of unit.items) {
                await setChampionItem(itemRowId, unit.character_id, item);
            }
            await setParticipantChampion(
                participantChampionRowId,
                participant.puuid,
                unit.character_id,
                itemRowId
            );
        }
        await setParticipant(
            participant.puuid,
            participant.gold_left,
            participant.last_round,
            participant.level,
            participant.placement,
            participant.players_eliminated,
            participant.time_eliminated,
            participant.total_damage_to_players,
            participantChampionRowId
        );
        await setMatchParticipant(
            matchParticipantRowId,
            match.metadata.match_id,
            participant.puuid
        );
    }
    return new Promise((acc, rej) => {});
}

/*-------------CRUD----------------*/

function getVersion(version) {
    db.get(
        'SELECT * FROM Version WHERE (version_id)= (?)',
        [version],
        (err, row) => {
            if (err) return console.log(err);
            return row;
        }
    );
}

async function setVersion(version) {
    db.run(
        'INSERT OR IGNORE INTO Version (version_id) VALUES (?)',
        [version],
        (err) => {
            if (err) return console.log(err);
        }
    );
}

function getChampion(champion) {
    db.get(
        'SELECT * FROM Champion WHERE (champion_id, name)= (?, ?)',
        [champion.champion_id, champion.name],
        (err, row) => {
            if (err) return console.log(err);
        }
    );
}

function setChampion(champion) {
    async function setVersion(version) {
        db.run(
            'INSERT OR IGNORE INTO Champion (version_id) VALUES (?)',
            [version],
            (err) => {
                if (err) return console.log(err);
            }
        );
    }
}

function getItem(item) {
    db.get(
        'SELECT * FROM Item WHERE (item_id)= (?)',
        [item.item_id],
        (err, row) => {
            if (err) return console.log(err);
        }
    );
}

function setItem(params) {}

function getTrait(trait_id) {
    db.get(
        'SELECT * FROM Trait WHERE (trait_id)= (?)',
        [trait_id],
        (err, row) => {
            if (err) return console.log(err);
        }
    );
}

function setTrait(params) {}

function getParticipant(puuid) {
    db.get(
        'SELECT * FROM Participant WHERE (puuid)= (?)',
        [puuid],
        (err, row) => {
            if (err) return console.log(err);
        }
    );
}

async function setParticipant(
    puuid,
    gold_left,
    last_round,
    level,
    placement,
    players_eliminated,
    time_eliminated,
    total_damage_to_players,
    champions
) {
    db.get(
        'INSERT OR IGNORE INTO Participant (puuid, gold_left, last_round, level, placement, players_eliminated, time_eliminated, total_damage_to_players, champions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            puuid,
            gold_left,
            last_round,
            level,
            placement,
            players_eliminated,
            time_eliminated,
            total_damage_to_players,
            champions
        ],
        (err, row) => {
            if (err) return console.log(err);
        }
    );
}

async function getMatch(match_id) {
    return new Promise((acc, rej) => {
        db.get(
            'SELECT * FROM Match WHERE (match_id)= (?)',
            [match_id],
            (err, row) => {
                if (err) return rej(err);
                acc(row);
            }
        );
    });
}

async function setMatch(
    match_id,
    queue_id,
    tft_set_number,
    data_version,
    version,
    game_datetime,
    game_length
) {
    return new Promise((acc, rej) => {
        db.run(
            'INSERT INTO Match (match_id, queue_id, tft_set_number, data_version, version, game_datetime, game_length) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                match_id,
                queue_id,
                tft_set_number,
                data_version,
                version,
                game_datetime,
                game_length
            ],
            (err) => {
                if (err) return rej(err);
                acc();
            }
        );
    });
}

function getMatchParticipant(params) {}

async function setMatchParticipant(uuid, match_id, participant_id) {
    db.all(
        'INSERT INTO Match_Participants (match, participant) VALUES (?, ?)',
        [match_id, participant_id],
        (err, rows) => {
            if (err) return console.log(err);
        }
    );
}

function getParticipantChampion(params) {}

async function setParticipantChampion(
    uuid,
    participant_id,
    champion_id,
    items_id
) {
    db.all(
        'INSERT INTO Participant_Champions (uuid, participant, champion, items) VALUES (?, ?, ?, ?)',
        [uuid, participant_id, champion_id, items_id],
        (err, rows) => {
            if (err) return console.log(err);
        }
    );
}

function getChampionItem(params) {}

async function setChampionItem(rowid, champion_id, item_id) {
    db.all(
        'INSERT INTO Champion_Items (uuid, champion, item) VALUES (?, ?, ?)',
        [rowid, champion_id, item_id],
        (err, rows) => {
            if (err) return console.log(err);
        }
    );
}
function getChampionTrait(params) {}

function setChampionTrait(params) {}

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
    loadStaticChampions,
    getChampion,
    setChampion,
    getChampionItem,
    setChampionItem,
    getChampionTrait,
    setChampionTrait,
    getItem,
    setItem,
    getMatch,
    setMatch,
    getMatchParticipant,
    setMatchParticipant,
    getParticipant,
    setParticipant,
    getParticipantChampion,
    setParticipantChampion,
    getTrait,
    setTrait,
    getVersion,
    setVersion
};

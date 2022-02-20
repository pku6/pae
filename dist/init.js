"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveSessions = exports.saveConfig = exports.sessions = exports.config = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
[
    '../info/',
    '../info/election-results/',
    '../info/invalid-html',
    '../info/vcode-imgs/',
].map(val => (0, path_1.join)(__dirname, val)).forEach(val => {
    if (!(0, fs_1.existsSync)(val)) {
        (0, fs_1.mkdirSync)(val);
    }
});
exports.config = {
    congestionSleep: 3,
    courses: [
        {
            title: '普通物理',
            number: 3,
            department: '数学科学学院'
        },
        {
            title: '逻辑导论'
        }
    ],
    errLimit: 100,
    errSleep: 1,
    getElectedNumProxy: 'http://host',
    getElectedNumTimeout: 3,
    logLevel: 0,
    password: '********',
    proxyDelay: 2,
    recognizeTimeout: 10,
    refreshInterval: 3,
    requestTimeout: 30,
    sessionDuration: 1800,
    studentId: '1*000*****',
    ttshitu: {
        username: '********',
        password: '********'
    }
};
exports.sessions = {
    main: [],
    others: []
};
const path0 = (0, path_1.join)(__dirname, '../config.json');
const path1 = (0, path_1.join)(__dirname, '../sessions.json');
function saveConfig() {
    (0, fs_1.writeFileSync)(path0, JSON.stringify(exports.config, undefined, 4));
}
exports.saveConfig = saveConfig;
function saveSessions() {
    (0, fs_1.writeFileSync)(path1, JSON.stringify(exports.sessions, undefined, 4));
}
exports.saveSessions = saveSessions;
if (!(0, fs_1.existsSync)(path0)) {
    saveConfig();
}
else {
    Object.assign(exports.config, JSON.parse((0, fs_1.readFileSync)(path0, { encoding: 'utf8' })));
}
if (!(0, fs_1.existsSync)(path1)) {
    saveSessions();
}
else {
    Object.assign(exports.sessions, JSON.parse((0, fs_1.readFileSync)(path1, { encoding: 'utf8' })));
}

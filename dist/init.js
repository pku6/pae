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
].map(value => (0, path_1.join)(__dirname, value)).forEach(value => {
    if (!(0, fs_1.existsSync)(value)) {
        (0, fs_1.mkdirSync)(value);
    }
});
exports.config = {
    courses: [
        {
            title: '太极拳',
            number: 2,
            department: '体育教研部'
        },
        {
            title: '非虚构'
        }
    ],
    studentId: '1*000*****',
    password: '********',
    ttshitu: {
        username: '********',
        password: '********'
    },
    refreshInterval: 3,
    refreshLimitNumInterval: 3,
    congestionSleep: 3,
    errLimit: 100,
    errSleep: 1,
    getElectedNumProxy: 'http://host',
    getElectedNumTimeout: 5,
    logLevel: 0,
    proxyDelay: .5,
    recognizeTimeout: 10,
    recognizeType: '3',
    requestTimeout: 30,
    sessionDuration: 1800
};
exports.sessions = {
    main: [],
    others: [],
    studentId: ''
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

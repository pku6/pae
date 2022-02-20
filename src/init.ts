import {existsSync, mkdirSync, writeFileSync, readFileSync} from 'fs'
import {join} from 'path'
[
    '../info/',
    '../info/election-results/',
    '../info/invalid-html',
    '../info/vcode-imgs/',
].map(val => join(__dirname, val)).forEach(val => {
    if (!existsSync(val)) {
        mkdirSync(val)
    }
})
export const config = {
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
    recognizeTimeout: 5,
    refreshInterval: 3,
    requestTimeout: 30,
    sessionDuration: 1800,
    studentId: '1*000*****',
    ttshitu: {
        username: '********',
        password: '********'
    }
}
export interface CourseInfo {
    title: string
    number: number
    department: string
    limit: number
    href: string
    index: number
    seq: string
}
export interface Session {
    cookie: string
    start: number
    courseInfoArray: CourseInfo[]
}
export const sessions = {
    main: <Session[]>[],
    others: <Session[]>[]
}
const path0 = join(__dirname, '../config.json')
const path1 = join(__dirname, '../sessions.json')
export function saveConfig() {
    writeFileSync(path0, JSON.stringify(config, undefined, 4))
}
export function saveSessions() {
    writeFileSync(path1, JSON.stringify(sessions, undefined, 4))
}
if (!existsSync(path0)) {
    saveConfig()
} else {
    Object.assign(config, JSON.parse(readFileSync(path0, {encoding: 'utf8'})))
}
if (!existsSync(path1)) {
    saveSessions()
} else {
    Object.assign(sessions, JSON.parse(readFileSync(path1, {encoding: 'utf8'})))
}
import {existsSync, mkdirSync, writeFileSync, readFileSync} from 'fs'
import {join} from 'path'
[
    '../info/',
    '../info/election-results/',
    '../info/invalid-html',
    '../info/vcode-imgs/',
].map(value => join(__dirname, value)).forEach(value => {
    if (!existsSync(value)) {
        mkdirSync(value)
    }
})
export const config = {
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
    refreshLimitNumInterval: 5,
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
    courseInfoArray: CourseInfo[]
    lastUpdate: number
    renewing: boolean
    start: number
}
export const sessions = {
    main: <Session[]>[],
    others: <Session[]>[],
    studentId: ''
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
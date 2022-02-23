import {writeFileSync} from 'fs'
import {join} from 'path'
import {JSDOM} from 'jsdom'
import {ECLIT as CLIT} from './clit'
import {config, CourseInfo, saveConfig, saveSessions, Session, sessions} from './init'
import {env} from './main'
export async function main() {
    const clit = new CLIT(__dirname, config)
    async function sleep(time: number) {
        await new Promise(resolve => {
            setTimeout(resolve, time * 1000)
        })
    }
    async function get(url: string, params?: Record<string, string>, cookie = '', referer = '', requestTimeout?: number, proxy?: string) {
        const result = await clit.request(url, {
            params,
            cookie,
            referer,
            requestTimeout,
            proxy
        })
        if (result === 408) {
            clit.out(`Timeout, fail to get ${url}`, 1)
            throw undefined
        }
        if (typeof result === 'number') {
            throw new Error(`${result}, fail to get ${url}`)
        }
        return result
    }
    async function post(url: string, form?: Record<string, string>, cookie = '', referer = '', requestTimeout?: number, proxy?: string) {
        const result = await clit.request(url, {
            form,
            cookie,
            referer,
            requestTimeout,
            proxy
        })
        if (result === 408) {
            clit.out(`Timeout, fail to post ${url}`, 1)
            throw undefined
        }
        if (typeof result === 'number') {
            throw new Error(`${result}, fail to post ${url}`)
        }
        return result
    }
    const electAndDropURL = `https://elective.pku.edu.cn/elective2008/edu/pku/stu/elective/controller/supplement/SupplyCancel.do?xh=${config.studentId}`
    const homepageURL = 'https://elective.pku.edu.cn/elective2008/edu/pku/stu/elective/controller/help/HelpController.jpf'
    async function getLoginCookie(studentId: string, password: string, appId: string, appName: string, redirectURL: string) {
        let {cookie} = await get('https://iaaa.pku.edu.cn/iaaa/oauth.jsp', {
            appID: appId,
            appName: appName,
            redirectUrl: redirectURL
        })
        const {body} = await post('https://iaaa.pku.edu.cn/iaaa/oauthlogin.do', {
            appid: appId,
            userName: studentId,
            password: password,
            randCode: '',
            smsCode: '',
            otpCode: '',
            redirUrl: redirectURL
        }, `remember=true; userName=${studentId}; ${cookie}`, 'https://iaaa.pku.edu.cn/iaaa/oauth.jsp')
        const {token} = JSON.parse(body)
        if (typeof token !== 'string') {
            throw new Error(`Fail to get login cookie of app ${appId}`)
        }
        const res = await get(redirectURL, {
            _rand: Math.random().toString(),
            token: token
        })
        let {status, headers} = res
        cookie = res.cookie
        if (status !== 301) {
            return cookie
        }
        const {location} = headers
        if (location === undefined) {
            return cookie
        }
        cookie = `${(await get(location, {}, cookie, redirectURL)).cookie}; ${cookie}`
        return cookie
    }
    async function getElectiveCookie() {
        for (let i = 0; i < config.errLimit; i++) {
            try {
                const cookie = await getLoginCookie(config.studentId, config.password, 'syllabus', '学生选课系统', 'http://elective.pku.edu.cn:80/elective2008/ssoLogin.do')
                await get(homepageURL, {}, cookie)
                return cookie
            } catch (err) {
                if (err instanceof Error) {
                    clit.out(err)
                }
            }
            await sleep(config.errSleep)
        }
        throw new Error('Fail to get elective cookie')
    }
    function htmlToCourseInfoArray(html: string) {
        const ele = Array.from(new JSDOM(html).window.document.body.querySelectorAll('table table>tbody'))
            .find(value => value.innerHTML.includes('限数/已选'))
        if (ele === undefined) {
            return 500
        }
        const courseInfoArray: CourseInfo[] = []
        for (const {children} of ele.querySelectorAll(':scope>tr:not(:first-child):not(.datagrid-footer):not(:last-child)')) {
            if (children.length !== 11) {
                return 500
            }
            const title = children[0].textContent ?? ''
            const number = Number(children[5].textContent)
            const department = children[6].textContent ?? ''
            const limit = Number((children[9].textContent ?? '').split('/')[0])
            const a = children[10].querySelector('a')
            if (
                title.length === 0
                || !isFinite(number) || number <= 0
                || department.length === 0
                || !isFinite(limit) || limit <= 0
                || a === null
            ) {
                return 500
            }
            const {href} = new URL(a.href, electAndDropURL)
            const array = (a.getAttribute('onclick') ?? '')
                .replace(/.*?\(/, '').replace(/[);\\']/g, '')
                .split(',')
            if (array.length < 9) {
                return 500
            }
            const index = Number(array[5])
            const seq = array[6]
            if (
                !isFinite(index) || index < 0
                || seq.length === 0
            ) {
                return 500
            }
            courseInfoArray.push({
                title,
                number,
                department,
                limit,
                href,
                index,
                seq,
            })
        }
        return courseInfoArray
    }
    async function getCourseInfoArray(cookie: string) {
        for (let i = 0; i < config.errLimit; i++) {
            try {
                const {body} = await get(electAndDropURL, {}, cookie, homepageURL)
                if (body.includes('会话超时') || body.includes('超时操作') || body.includes('重新登录')) {
                    clit.out('Expired')
                    return 401
                }
                const array = htmlToCourseInfoArray(body)
                if (array !== 500) {
                    return array
                }
                writeFileSync(join(__dirname, `../info/invalid-html/${CLIT.getDate()}-${CLIT.getTime().replace(/:/g, '-')}.html`), body)
                clit.out('Invalid html')
            } catch (err) {
                if (err instanceof Error) {
                    clit.out(err)
                }
            }
            await sleep(config.errSleep)
        }
        throw new Error('Fail to get course info array')
    }
    async function getElectedNum(index: number, seq: string, cookie: string) {
        try {
            const {body} = await post('https://elective.pku.edu.cn/elective2008/edu/pku/stu/elective/controller/supplement/refreshLimit.do', {
                index: index.toString(),
                seq,
                xh: config.studentId
            }, cookie, electAndDropURL, config.getElectedNumTimeout, config.getElectedNumProxy)
            if (body.includes('会话超时') || body.includes('超时操作') || body.includes('重新登录')) {
                clit.out('Expired')
                return 401
            }
            const result = JSON.parse(body).electedNum
            if (result === 'NA') {
                return 503
            }
            if (result === 'NB') {
                return 400
            }
            const data = Number(result)
            if (!isFinite(data)) {
                return 500
            }
            return {
                data
            }
        } catch (err) {
            if (err instanceof Error) {
                clit.out(err)
            }
            return 500
        }
    }
    async function getVCodeImg(cookie: string) {
        const {buffer, body} = await get(`https://elective.pku.edu.cn/elective2008/DrawServlet?Rand=${(Math.random() * 10000)}`, {}, cookie, electAndDropURL)
        if (body.includes('会话超时') || body.includes('超时操作') || body.includes('重新登录')) {
            clit.out('Expired')
            return 401
        }
        writeFileSync(join(__dirname, `../info/vcode-imgs/${CLIT.getDate()}-${CLIT.getTime().replace(/:/g, '-')}.gif`), buffer)
        return buffer.toString('base64')
    }
    async function recognizeVCodeImg(base64Img: string) {
        const {body} = await post('https://api.ttshitu.com/base64', {
            username: config.ttshitu.username,
            password: config.ttshitu.password,
            typeid: config.recognizeType,
            image: base64Img
        }, '', '', config.recognizeTimeout)
        const {success, message, data} = JSON.parse(body)
        if (!success) {
            if (typeof message === 'string') {
                clit.out(message)
            }
            return 500
        }
        const {result} = data
        if (typeof result !== 'string') {
            return 500
        }
        return result
    }
    async function verifyVCode(vcode: string, cookie: string) {
        const {body} = await post('https://elective.pku.edu.cn/elective2008/edu/pku/stu/elective/controller/supplement/validate.do', {
            xh: config.studentId,
            validCode: vcode
        }, cookie, electAndDropURL)
        const result = Number(JSON.parse(body).valid)
        if (result === 2) {
            return 200
        }
        if (result === 1) {
            return 400
        }
        return 500
    }
    async function verifySession(cookie: string) {
        for (let i = 0; i < config.errLimit; i++) {
            try {
                const img = await getVCodeImg(cookie)
                if (img === 401) {
                    return 401
                }
                const result = await recognizeVCodeImg(img)
                if (result === 500) {
                    clit.out(`Fail to recognize vcode img`)
                    await sleep(config.errSleep)
                    continue
                }
                clit.out(`Recognized as ${result}`)
                if (await verifyVCode(result, cookie) === 200) {
                    clit.out('Verified')
                    return 200
                }
            } catch (err) {
                if (err instanceof Error) {
                    clit.out(err)
                }
            }
            await sleep(config.errSleep)
        }
        throw new Error('Fail to verify session')
    }
    async function electCourse(href: string, cookie: string) {
        try {
            const {body} = await get(href, {}, cookie, electAndDropURL)
            writeFileSync(join(__dirname, `../info/election-results/${CLIT.getDate()}-${CLIT.getTime().replace(/:/g, '-')}.html`), body)
            if (body.includes('会话超时') || body.includes('超时操作') || body.includes('重新登录')) {
                clit.out('Expired')
                return 401
            }
            const ele = new JSDOM(body).window.document.body.querySelector('#msgTips')
            if (ele === null) {
                return 500
            }
            const msg = (ele.textContent ?? '').trim()
            if (msg.length === 0) {
                return 500
            }
            clit.out(msg)
            if (
                msg.includes('选课课程已失效')
                || msg.includes('您的可选列表中无此课程')
            ) {
                return 400
            }
            if (
                msg.includes('您已经选过该课程了')
                || msg.includes('上课时间冲突')
                || msg.includes('考试时间冲突')
                || msg.includes('在补退选阶段开始后的约一周开放选课')
                || msg.includes('总学分已经超过规定学分上限')
                || msg.includes('只能选')
                || msg.includes('只能修')
            ) {
                return 409
            }
            if (msg.includes('成功')) {
                return 200
            }
        } catch (err) {
            if (err instanceof Error) {
                clit.out(err)
            }
        }
        return 500
    }
    interface CourseDesc {
        title: string
        number?: number
        department?: string
    }
    function getCourseInfo(session: Session, {title, number, department}: CourseDesc) {
        for (const courseInfo of session.courseInfoArray) {
            if (
                courseInfo.title.includes(title)
                && (number === undefined || courseInfo.number === number)
                && (department === undefined || courseInfo.department.includes(department))
            ) {
                return courseInfo
            }
        }
        return undefined
    }
    async function createSession(): Promise<Session> {
        for (let i = 0; i < config.errLimit; i++) {
            const cookie = await getElectiveCookie()
            const courseInfoArray = await getCourseInfoArray(cookie)
            if (courseInfoArray !== 401) {
                clit.out('New session')
                const start = Date.now() / 1000
                return {
                    cookie,
                    courseInfoArray,
                    lastUpdate: start,
                    renewing: false,
                    start
                }
            }
            await sleep(config.errSleep)
        }
        throw new Error('Fail to create session')
    }
    async function createMainSession(): Promise<Session> {
        for (let i = 0; i < config.errLimit; i++) {
            const session = await createSession()
            if (await verifySession(session.cookie) !== 401) {
                return session
            }
            await sleep(config.errSleep)
        }
        throw new Error('Fail to create main session')
    }
    async function updateSession(session: Session) {
        const result = await getCourseInfoArray(session.cookie)
        if (result === 401) {
            return 401
        }
        session.courseInfoArray = result
        session.lastUpdate = Date.now() / 1000
        saveSessions()
        clit.out('Updated')
        return 200
    }
    let sessionIndex = -1
    async function getSession() {
        sessionIndex = (sessionIndex + 1) % (sessions.others.length + sessions.main.length)
        const now = Date.now() / 1000
        const minStart = now - config.sessionDuration + Math.random() * 300
        const minLastUpdate = now - config.refreshLimitNumInterval
        if (sessionIndex < sessions.main.length) {
            const mainIndex = sessionIndex
            const session = sessions.main[mainIndex]
            if (minLastUpdate > session.lastUpdate && await updateSession(session) === 401) {
                session.start = 0
                saveSessions()
            }
            if (!session.renewing && minStart > session.start) {
                session.renewing = true
                saveSessions()
                createMainSession().then(value => {
                    sessions.main[mainIndex] = value
                    saveSessions()
                })
            }
            return session
        }
        const othersIndex = sessionIndex - sessions.main.length
        const session = sessions.others[othersIndex]
        if (minLastUpdate > session.lastUpdate && await updateSession(session) === 401) {
            session.start = 0
            saveSessions()
        }
        if (!session.renewing && minStart > session.start) {
            session.renewing = true
            saveSessions()
            createSession().then(value => {
                sessions.others[othersIndex] = value
                saveSessions()
            })
        }
        return session
    }
    let mainSessionIndex = 0
    function getMainSession() {
        return sessions.main[mainSessionIndex++ % sessions.main.length]
    }
    const sessionNum = Math.ceil(Math.max(3, config.proxyDelay + 1) / config.refreshInterval) * config.courses.length * 2
    const minStart = Date.now() / 1000 - config.sessionDuration
    if (sessions.studentId === config.studentId) {
        sessions.main = sessions.main.filter(value => minStart <= value.start)
        sessions.others = sessions.main.slice(config.courses.length)
            .concat(sessions.others.filter(value => minStart <= value.start))
            .slice(0, sessionNum - config.courses.length)
        sessions.main = sessions.main.slice(0, config.courses.length)
        sessions.main.forEach(value => value.renewing = false)
        sessions.others.forEach(value => value.renewing = false)
    } else {
        sessions.main = []
        sessions.others = []
        sessions.studentId = config.studentId
    }
    saveSessions()
    if (sessions.main.length < config.courses.length) {
        sessions.main.push(await createMainSession())
        saveSessions()
    }
    (async () => {
        for (let i = sessions.main.length; i < config.courses.length; i++) {
            sessions.main.push(await createMainSession())
            saveSessions()
        }
    })();
    (async () => {
        for (let i = sessions.others.length + config.courses.length; i < sessionNum; i++) {
            sessions.others.push(await createSession())
            saveSessions()
        }
    })()
    let lastPromises: Promise<CourseDesc | undefined>[] = []
    const courseDescToElecting: Map<CourseDesc, true | undefined> = new Map()
    while (true) {
        const promises: Promise<CourseDesc | undefined>[] = []
        const batchSize = env.pause ? 0 : Math.floor((sessions.others.length + sessions.main.length) / 2 / config.courses.length)
        if (batchSize === 0) {
            await sleep(config.refreshInterval)
        }
        for (let i = 0; i < batchSize; i++) {
            for (const courseDesc of config.courses) {
                if (courseDescToElecting.get(courseDesc)) {
                    continue
                }
                promises.push((async () => {
                    const session = await getSession()
                    const courseInfo = getCourseInfo(session, courseDesc)
                    if (courseInfo === undefined) {
                        return courseDesc
                    }
                    if (courseDescToElecting.get(courseDesc)) {
                        return
                    }
                    const result = await getElectedNum(courseInfo.index, courseInfo.seq, session.cookie)
                    if (result === 503) {
                        clit.out('Too frequent')
                        await sleep(config.congestionSleep)
                        return
                    }
                    if (result === 401) {
                        session.start = 0
                        saveSessions()
                        return
                    }
                    if (result === 400) {
                        if (await updateSession(session) === 401) {
                            session.start = 0
                            saveSessions()
                        }
                        return
                    }
                    if (result === 500) {
                        clit.out(`Fail to get elected num`, 1)
                        return
                    }
                    const {data} = result
                    const string = `${data}/${courseInfo.limit} for ${courseInfo.title} ${courseInfo.number} of ${courseInfo.department}`
                    if (data >= courseInfo.limit) {
                        clit.out(string, 2)
                        return
                    }
                    clit.out(string)
                    if (courseDescToElecting.get(courseDesc)) {
                        return
                    }
                    courseDescToElecting.set(courseDesc, true)
                    const mainSession = getMainSession()
                    const mainCourseInfo = getCourseInfo(mainSession, courseDesc)
                    if (mainCourseInfo === undefined) {
                        clit.out('Error')
                        return
                    }
                    normal: {
                        const result = await electCourse(mainCourseInfo.href, mainSession.cookie)
                        if (result === 401 || result === 500) {
                            break normal
                        }
                        if (result === 400) {
                            if (await updateSession(mainSession) === 401) {
                                break normal
                            }
                            const mainCourseInfo = getCourseInfo(mainSession, courseDesc)
                            if (mainCourseInfo !== undefined) {
                                const result = await electCourse(mainCourseInfo.href, mainSession.cookie)
                                if (result !== 200 && result !== 409) {
                                    break normal
                                }
                            }
                        }
                        return courseDesc
                    }
                    mainSession.start = 0
                    saveSessions()
                    courseDescToElecting.set(courseDesc, undefined)
                    clit.out(`Fail to elect ${courseInfo.title} ${courseInfo.number} of ${courseInfo.department}`)
                })())
            }
            await sleep(config.refreshInterval)
        }
        const result = await Promise.all(lastPromises)
        lastPromises = promises
        if (result.find(value => value !== undefined) !== undefined) {
            config.courses = config.courses.filter(value => !result.includes(value))
            saveConfig()
        }
        if (config.courses.length === 0) {
            clit.out('Finished')
            return
        }
    }
}
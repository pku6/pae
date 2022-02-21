"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const jsdom_1 = require("jsdom");
const cli_tools_1 = require("@ddu6/cli-tools");
const init_1 = require("./init");
async function main() {
    const clit = new cli_tools_1.CLIT(__dirname, init_1.config);
    async function sleep(time) {
        await new Promise(resolve => {
            setTimeout(resolve, time * 1000);
        });
    }
    async function get(url, params, cookie = '', referer = '', requestTimeout, proxy) {
        const result = await clit.request(url, {
            params,
            cookie,
            referer,
            requestTimeout,
            proxy
        });
        if (result === 408) {
            clit.out(`Timeout, fail to get ${url}`, 1);
            throw undefined;
        }
        if (typeof result === 'number') {
            throw new Error(`${result}, fail to get ${url}`);
        }
        return result;
    }
    async function post(url, form, cookie = '', referer = '', requestTimeout, proxy) {
        const result = await clit.request(url, {
            form,
            cookie,
            referer,
            requestTimeout,
            proxy
        });
        if (result === 408) {
            clit.out(`Timeout, fail to post ${url}`, 1);
            throw undefined;
        }
        if (typeof result === 'number') {
            throw new Error(`${result}, fail to post ${url}`);
        }
        return result;
    }
    const electAndDropURL = `https://elective.pku.edu.cn/elective2008/edu/pku/stu/elective/controller/supplement/SupplyCancel.do?xh=${init_1.config.studentId}`;
    const homepageURL = 'https://elective.pku.edu.cn/elective2008/edu/pku/stu/elective/controller/help/HelpController.jpf';
    async function getLoginCookie(studentId, password, appId, appName, redirectURL) {
        let { cookie } = await get('https://iaaa.pku.edu.cn/iaaa/oauth.jsp', {
            appID: appId,
            appName: appName,
            redirectUrl: redirectURL
        });
        const { body } = await post('https://iaaa.pku.edu.cn/iaaa/oauthlogin.do', {
            appid: appId,
            userName: studentId,
            password: password,
            randCode: '',
            smsCode: '',
            otpCode: '',
            redirUrl: redirectURL
        }, `remember=true; userName=${studentId}; ${cookie}`, 'https://iaaa.pku.edu.cn/iaaa/oauth.jsp');
        const { token } = JSON.parse(body);
        if (typeof token !== 'string') {
            throw new Error(`Fail to get login cookie of app ${appId}`);
        }
        const res = await get(redirectURL, {
            _rand: Math.random().toString(),
            token: token
        });
        let { status, headers } = res;
        cookie = res.cookie;
        if (status !== 301) {
            return cookie;
        }
        const { location } = headers;
        if (location === undefined) {
            return cookie;
        }
        cookie = `${(await get(location, {}, cookie, redirectURL)).cookie}; ${cookie}`;
        return cookie;
    }
    async function getElectiveCookie() {
        for (let i = 0; i < init_1.config.errLimit; i++) {
            try {
                const cookie = await getLoginCookie(init_1.config.studentId, init_1.config.password, 'syllabus', '学生选课系统', 'http://elective.pku.edu.cn:80/elective2008/ssoLogin.do');
                await get(homepageURL, {}, cookie);
                return cookie;
            }
            catch (err) {
                if (err instanceof Error) {
                    clit.out(err);
                }
            }
            await sleep(init_1.config.errSleep);
        }
        throw new Error('Fail to get elective cookie');
    }
    function htmlToCourseInfoArray(html) {
        const ele = Array.from(new jsdom_1.JSDOM(html).window.document.body.querySelectorAll('table table>tbody'))
            .find(value => value.innerHTML.includes('限数/已选'));
        if (ele === undefined) {
            return 500;
        }
        const courseInfoArray = [];
        for (const { children } of ele.querySelectorAll(':scope>tr:not(:first-child):not(.datagrid-footer):not(:last-child)')) {
            if (children.length !== 11) {
                return 500;
            }
            const title = children[0].textContent ?? '';
            const number = Number(children[5].textContent);
            const department = children[6].textContent ?? '';
            const limit = Number((children[9].textContent ?? '').split('/')[0]);
            const a = children[10].querySelector('a');
            if (title.length === 0
                || !isFinite(number) || number <= 0
                || department.length === 0
                || !isFinite(limit) || limit <= 0
                || a === null) {
                return 500;
            }
            const { href } = new URL(a.href, electAndDropURL);
            const array = (a.getAttribute('onclick') ?? '')
                .replace(/.*?\(/, '').replace(/[);\\']/g, '')
                .split(',');
            if (array.length < 9) {
                return 500;
            }
            const index = Number(array[5]);
            const seq = array[6];
            if (!isFinite(index) || index < 0
                || seq.length === 0) {
                return 500;
            }
            courseInfoArray.push({
                title,
                number,
                department,
                limit,
                href,
                index,
                seq,
            });
        }
        return courseInfoArray;
    }
    async function getCourseInfoArray(cookie) {
        for (let i = 0; i < init_1.config.errLimit; i++) {
            try {
                const { body } = await get(electAndDropURL, {}, cookie, homepageURL);
                if (body.includes('会话超时') || body.includes('超时操作') || body.includes('重新登录')) {
                    clit.out('Expired');
                    return 401;
                }
                const array = htmlToCourseInfoArray(body);
                if (array !== 500) {
                    return array;
                }
                (0, fs_1.writeFileSync)((0, path_1.join)(__dirname, `../info/invalid-html/${cli_tools_1.CLIT.getDate()}-${cli_tools_1.CLIT.getTime().replace(/:/g, '-')}.html`), body);
                clit.out('Invalid html');
            }
            catch (err) {
                if (err instanceof Error) {
                    clit.out(err);
                }
            }
            await sleep(init_1.config.errSleep);
        }
        throw new Error('Fail to get course info array');
    }
    async function getElectedNum(index, seq, cookie) {
        try {
            const { body } = await post('https://elective.pku.edu.cn/elective2008/edu/pku/stu/elective/controller/supplement/refreshLimit.do', {
                index: index.toString(),
                seq,
                xh: init_1.config.studentId
            }, cookie, electAndDropURL, init_1.config.getElectedNumTimeout, init_1.config.getElectedNumProxy);
            if (body.includes('会话超时') || body.includes('超时操作') || body.includes('重新登录')) {
                clit.out('Expired');
                return 401;
            }
            const result = JSON.parse(body).electedNum;
            if (result === 'NA') {
                return 503;
            }
            if (result === 'NB') {
                return 400;
            }
            const data = Number(result);
            if (!isFinite(data)) {
                return 500;
            }
            return {
                data
            };
        }
        catch (err) {
            if (err instanceof Error) {
                clit.out(err);
            }
            return 500;
        }
    }
    async function getVCodeImg(cookie) {
        const { buffer, body } = await get(`https://elective.pku.edu.cn/elective2008/DrawServlet?Rand=${(Math.random() * 10000)}`, {}, cookie, electAndDropURL);
        if (body.includes('会话超时') || body.includes('超时操作') || body.includes('重新登录')) {
            clit.out('Expired');
            return 401;
        }
        (0, fs_1.writeFileSync)((0, path_1.join)(__dirname, `../info/vcode-imgs/${cli_tools_1.CLIT.getDate()}-${cli_tools_1.CLIT.getTime().replace(/:/g, '-')}.gif`), buffer);
        return buffer.toString('base64');
    }
    async function recognizeVCodeImg(base64Img) {
        const { body } = await post('https://api.ttshitu.com/base64', {
            username: init_1.config.ttshitu.username,
            password: init_1.config.ttshitu.password,
            typeid: '7',
            image: base64Img
        }, '', '', init_1.config.recognizeTimeout);
        const { success, message, data } = JSON.parse(body);
        if (!success) {
            if (typeof message === 'string') {
                clit.out(message);
            }
            return 500;
        }
        const { result } = data;
        if (typeof result !== 'string') {
            return 500;
        }
        return result;
    }
    async function verifyVCode(vcode, cookie) {
        const { body } = await post('https://elective.pku.edu.cn/elective2008/edu/pku/stu/elective/controller/supplement/validate.do', {
            xh: init_1.config.studentId,
            validCode: vcode
        }, cookie, electAndDropURL);
        const result = Number(JSON.parse(body).valid);
        if (result === 2) {
            return 200;
        }
        if (result === 1) {
            return 400;
        }
        return 500;
    }
    async function verifySession(cookie) {
        for (let i = 0; i < init_1.config.errLimit; i++) {
            try {
                const img = await getVCodeImg(cookie);
                if (img === 401) {
                    return 401;
                }
                const result = await recognizeVCodeImg(img);
                if (result === 500) {
                    clit.out(`Fail to recognize vcode img`);
                    await sleep(init_1.config.errSleep);
                    continue;
                }
                clit.out(`Recognized as ${result}`);
                if (await verifyVCode(result, cookie) === 200) {
                    clit.out('Verified');
                    return 200;
                }
            }
            catch (err) {
                if (err instanceof Error) {
                    clit.out(err);
                }
            }
            await sleep(init_1.config.errSleep);
        }
        throw new Error('Fail to verify session');
    }
    async function electCourse(href, cookie) {
        try {
            const { body } = await get(href, {}, cookie, electAndDropURL);
            (0, fs_1.writeFileSync)((0, path_1.join)(__dirname, `../info/election-results/${cli_tools_1.CLIT.getDate()}-${cli_tools_1.CLIT.getTime().replace(/:/g, '-')}.html`), body);
            if (body.includes('会话超时') || body.includes('超时操作') || body.includes('重新登录')) {
                clit.out('Expired');
                return 401;
            }
            const ele = new jsdom_1.JSDOM(body).window.document.body.querySelector('#msgTips');
            if (ele === null) {
                return 500;
            }
            const msg = (ele.textContent ?? '').trim();
            if (msg.length === 0) {
                return 500;
            }
            clit.out(msg);
            if (msg.includes('选课课程已失效')
                || msg.includes('您的可选列表中无此课程')) {
                return 400;
            }
            if (msg.includes('您已经选过该课程了')
                || msg.includes('上课时间冲突')
                || msg.includes('考试时间冲突')
                || msg.includes('在补退选阶段开始后的约一周开放选课')
                || msg.includes('总学分已经超过规定学分上限')
                || msg.includes('只能选')
                || msg.includes('只能修')) {
                return 409;
            }
            if (msg.includes('成功')) {
                return 200;
            }
        }
        catch (err) {
            if (err instanceof Error) {
                clit.out(err);
            }
        }
        return 500;
    }
    function getCourseInfo(session, { title, number, department }) {
        for (const courseInfo of session.courseInfoArray) {
            if (courseInfo.title.includes(title)
                && (number === undefined || courseInfo.number === number)
                && (department === undefined || courseInfo.department.includes(department))) {
                return courseInfo;
            }
        }
        return undefined;
    }
    async function createSession() {
        for (let i = 0; i < init_1.config.errLimit; i++) {
            const cookie = await getElectiveCookie();
            const courseInfoArray = await getCourseInfoArray(cookie);
            if (courseInfoArray !== 401) {
                clit.out('New session');
                return {
                    cookie,
                    start: Date.now() / 1000,
                    courseInfoArray,
                    renewing: false
                };
            }
            await sleep(init_1.config.errSleep);
        }
        throw new Error('Fail to create session');
    }
    async function createMainSession() {
        for (let i = 0; i < init_1.config.errLimit; i++) {
            const session = await createSession();
            if (await verifySession(session.cookie) !== 401) {
                return session;
            }
            await sleep(init_1.config.errSleep);
        }
        throw new Error('Fail to create main session');
    }
    async function updateSession(session) {
        const result = await getCourseInfoArray(session.cookie);
        if (result === 401) {
            return 401;
        }
        session.courseInfoArray = result;
        (0, init_1.saveSessions)();
        clit.out('Updated');
        return 200;
    }
    let sessionIndex = -1;
    function getSession() {
        sessionIndex = (sessionIndex + 1) % (init_1.sessions.others.length + init_1.sessions.main.length);
        const minStart = Date.now() / 1000 - init_1.config.sessionDuration + Math.random() * 300;
        if (sessionIndex < init_1.sessions.main.length) {
            const mainIndex = sessionIndex;
            const session = init_1.sessions.main[mainIndex];
            if (!session.renewing && minStart > session.start) {
                session.renewing = true;
                (0, init_1.saveSessions)();
                createMainSession().then(value => init_1.sessions.main[mainIndex] = value);
            }
            return session;
        }
        const othersIndex = sessionIndex - init_1.sessions.main.length;
        const session = init_1.sessions.others[othersIndex];
        if (!session.renewing && minStart > session.start) {
            session.renewing = true;
            (0, init_1.saveSessions)();
            createSession().then(value => init_1.sessions.others[othersIndex] = value);
        }
        return session;
    }
    let mainSessionIndex = 0;
    function getMainSession() {
        return init_1.sessions.main[mainSessionIndex++ % init_1.sessions.main.length];
    }
    const sessionNum = Math.ceil(Math.max(3, init_1.config.proxyDelay + 1) / init_1.config.refreshInterval) * init_1.config.courses.length * 2;
    init_1.sessions.main = init_1.sessions.main.filter(value => Date.now() / 1000 - init_1.config.sessionDuration + Math.random() * 300 <= value.start);
    init_1.sessions.others = init_1.sessions.main.slice(init_1.config.courses.length).concat(init_1.sessions.others.filter(value => Date.now() / 1000 - init_1.config.sessionDuration + Math.random() * 300 <= value.start)).slice(0, sessionNum - init_1.config.courses.length);
    init_1.sessions.main = init_1.sessions.main.slice(0, init_1.config.courses.length);
    init_1.sessions.main.forEach(value => value.renewing = false);
    init_1.sessions.others.forEach(value => value.renewing = false);
    (0, init_1.saveSessions)();
    if (init_1.sessions.main.length < init_1.config.courses.length) {
        init_1.sessions.main.push(await createMainSession());
        (0, init_1.saveSessions)();
    }
    (async () => {
        for (let i = init_1.sessions.main.length; i < init_1.config.courses.length; i++) {
            init_1.sessions.main.push(await createMainSession());
            (0, init_1.saveSessions)();
        }
    })();
    (async () => {
        for (let i = init_1.sessions.others.length + init_1.config.courses.length; i < sessionNum; i++) {
            init_1.sessions.others.push(await createSession());
            (0, init_1.saveSessions)();
        }
    })();
    let lastPromises = [];
    const courseDescToElecting = new Map();
    while (true) {
        const promises = [];
        const batchSize = Math.floor((init_1.sessions.others.length + init_1.sessions.main.length) / 2 / init_1.config.courses.length);
        if (batchSize === 0) {
            await sleep(init_1.config.refreshInterval);
        }
        for (let i = 0; i < batchSize; i++) {
            for (const courseDesc of init_1.config.courses) {
                if (courseDescToElecting.get(courseDesc)) {
                    continue;
                }
                promises.push((async () => {
                    const session = getSession();
                    const courseInfo = getCourseInfo(session, courseDesc);
                    if (courseInfo === undefined) {
                        return courseDesc;
                    }
                    if (courseDescToElecting.get(courseDesc)) {
                        return;
                    }
                    const result = await getElectedNum(courseInfo.index, courseInfo.seq, session.cookie);
                    if (result === 503) {
                        clit.out('Too frequent');
                        await sleep(init_1.config.congestionSleep);
                        return;
                    }
                    if (result === 401) {
                        session.start = 0;
                        (0, init_1.saveSessions)();
                        return;
                    }
                    if (result === 400) {
                        if (await updateSession(session) === 401) {
                            session.start = 0;
                            (0, init_1.saveSessions)();
                        }
                        return;
                    }
                    if (result === 500) {
                        clit.out(`Fail to get elected num`, 1);
                        return;
                    }
                    const { data } = result;
                    if (data >= courseInfo.limit) {
                        clit.out(`No place avaliable for ${courseInfo.title} ${courseInfo.number} of ${courseInfo.department}`, 2);
                        return;
                    }
                    clit.out(`Place avaliable for ${courseInfo.title} ${courseInfo.number} of ${courseInfo.department}`);
                    if (courseDescToElecting.get(courseDesc)) {
                        return;
                    }
                    courseDescToElecting.set(courseDesc, true);
                    const mainSession = getMainSession();
                    const mainCourseInfo = getCourseInfo(mainSession, courseDesc);
                    if (mainCourseInfo === undefined) {
                        clit.out('Error');
                        return;
                    }
                    normal: {
                        const result = await electCourse(mainCourseInfo.href, mainSession.cookie);
                        if (result === 401 || result === 500) {
                            break normal;
                        }
                        if (result === 400) {
                            if (await updateSession(mainSession) === 401) {
                                break normal;
                            }
                            const mainCourseInfo = getCourseInfo(mainSession, courseDesc);
                            if (mainCourseInfo !== undefined) {
                                const result = await electCourse(mainCourseInfo.href, mainSession.cookie);
                                if (result !== 200 && result !== 409) {
                                    break normal;
                                }
                            }
                        }
                        return courseDesc;
                    }
                    mainSession.start = 0;
                    (0, init_1.saveSessions)();
                    courseDescToElecting.set(courseDesc, undefined);
                    clit.out(`Fail to elect ${courseInfo.title} ${courseInfo.number} of ${courseInfo.department}`);
                })());
            }
            await sleep(init_1.config.refreshInterval);
        }
        const result = await Promise.all(lastPromises);
        lastPromises = promises;
        if (result.find(value => value !== undefined) !== undefined) {
            init_1.config.courses = init_1.config.courses.filter(value => !result.includes(value));
            (0, init_1.saveConfig)();
        }
        if (init_1.config.courses.length === 0) {
            clit.out('Finished');
            return;
        }
    }
}
exports.main = main;

const warn = document.createElement('div')
const textarea = document.createElement('textarea')
const button = document.createElement('button')
const out = document.createElement('div')
document.body.append(
    textarea,
    button
)
warn.classList.add('warn')
function alert(string) {
    warn.textContent = string
    document.body.append(warn)
    setTimeout(() => {
        warn.remove()
    }, 1000)
}
const {
    courses,
    studentId,
    password,
    ttshitu,
    refreshInterval
} = JSON.parse(electronAPI.loadConfig())
textarea.value = JSON.stringify({
    courses,
    studentId,
    password,
    ttshitu,
    refreshInterval
}, undefined, 4)
button.textContent = 'Start'
button.addEventListener('click', () => {
    try {
        const {
            courses,
            studentId,
            password,
            ttshitu: {
                username,
                password: tpassword
            },
            refreshInterval
        } = JSON.parse(textarea.value)
        if (
            !Array.isArray(courses)
            || typeof studentId !== 'string'
            || typeof password !== 'string'
            || typeof username !== 'string'
            || typeof tpassword !== 'string'
            || typeof refreshInterval !== 'number'
            || !isFinite(refreshInterval)
        ) {
            throw new Error()
        }
        for (const {title} of courses) {
            if (typeof title !== 'string') {
                throw new Error()
            }
        }
        if (refreshInterval < .5) {
            alert('Too small interval!')
            return
        }
        button.remove()
        textarea.remove()
        document.body.append(out)
        electronAPI.saveConfig(JSON.stringify({
            courses,
            studentId,
            password,
            ttshitu: {
                username,
                password: tpassword
            },
            refreshInterval
        }))
    } catch (err) {
        alert('Wrong format!')
        return
    }
})
electronAPI.handleOut(string => {
    const scroll = out.scrollHeight - out.scrollTop < out.clientHeight + 2
    const line = document.createElement('div')
    out.append(line)
    line.textContent = string
    if (out.children.length > 1000) {
        out.children[0].remove()
    }
    if (scroll) {
        line.scrollIntoView()
    }
})
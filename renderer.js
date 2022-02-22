const warn = document.createElement('div')
const configEle = document.createElement('div')
const courseTitleInput = document.createElement('input')
const courseNumberInput = document.createElement('input')
const courseDepartmentInput = document.createElement('input')
const studentIdInput = document.createElement('input')
const passwordInput = document.createElement('input')
const tusernameInput = document.createElement('input')
const tpasswordInput = document.createElement('input')
const refreshIntervalInput = document.createElement('input')
const button = document.createElement('button')
const out = document.createElement('pre')
function createNamedStretchedElement(name, content) {
    const element = document.createElement('div')
    const nameEle = document.createElement('div')
    element.style.display = 'grid'
    element.style.gridTemplateColumns = '1fr'
    element.style.margin = 'var(--length-gap) 0'
    nameEle.style.fontSize = 'var(--length-font-code)'
    nameEle.textContent = name
    element.append(nameEle)
    element.append(content)
    return element
}
document.body.append(
    configEle,
    createNamedStretchedElement('', button)
)
configEle.append(
    createNamedStretchedElement('Course Title', courseTitleInput),
    createNamedStretchedElement('Course Number (optional)', courseNumberInput),
    createNamedStretchedElement('Course Department (optional)', courseDepartmentInput),
    createNamedStretchedElement('Student Id', studentIdInput),
    createNamedStretchedElement('Password', passwordInput),
    createNamedStretchedElement('TTShiTu Username', tusernameInput),
    createNamedStretchedElement('TTShiTu Password', tpasswordInput),
    createNamedStretchedElement('Refresh Interval', refreshIntervalInput)
)
courseNumberInput.type = 'number'
passwordInput.type = 'password'
tpasswordInput.type = 'password'
refreshIntervalInput.step = 'any'
refreshIntervalInput.type = 'number'
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
if (courses != undefined && courses.length > 0) {
    const {title, number, department} = courses[0]
    courseTitleInput.value = title
    if (number !== undefined) {
        courseNumberInput.value = number.toString()
    }
    if (department !== undefined) {
        courseDepartmentInput.value = department
    }
}
if (studentId !== undefined && studentId !== '1*000*****') {
    studentIdInput.value = studentId
}
if (password !== undefined && password !== '********') {
    passwordInput.value = password
}
if (ttshitu !== undefined) {
    if (ttshitu.username !== '********') {
        tusernameInput.value = ttshitu.username
    }
    if (ttshitu.password !== '********') {
        tpasswordInput.value = ttshitu.password
    }
}
if (refreshInterval !== undefined) {
    refreshIntervalInput.value = refreshInterval.toString()
}
button.textContent = 'Start'
button.addEventListener('click', () => {
    if (button.textContent === 'Pause') {
        alert('Pausing...')
        button.textContent = 'Continue'
        electronAPI.pause()
        return
    }
    if (button.textContent === 'Continue') {
        button.textContent = 'Pause'
        electronAPI.continue()
        return
    }
    const course = {
        title: courseTitleInput.value
    }
    const courseNumber = Number(courseNumberInput.value)
    const courseDepartment = courseDepartmentInput.value
    if (isFinite(courseNumber) && courseNumber > 0) {
        course.number = courseNumber
    }
    if (courseDepartment.length > 0) {
        course.department = courseDepartment
    }
    const refreshInterval = Number(refreshIntervalInput.value)
    if (!isFinite(refreshInterval)) {
        alert('Invalid refresh interval!')
        return
    }
    if (refreshInterval < .5) {
        alert('Too small refresh interval!')
        return
    }
    button.textContent = 'Pause'
    configEle.replaceWith(out)
    electronAPI.saveConfig(JSON.stringify({
        courses: [
            course
        ],
        studentId: studentIdInput.value,
        password: passwordInput.value,
        ttshitu: {
            username: tusernameInput.value,
            password: tpasswordInput.value
        },
        refreshInterval
    }))
    try {
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
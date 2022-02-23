const warn = document.createElement('div')
const configEle = document.createElement('div')
const coursesEle = document.createElement('ul')
const addButton = document.createElement('button')
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
    button
)
configEle.append(
    createNamedStretchedElement('Courses to Elect', coursesEle),
    createNamedStretchedElement('', addButton),
    createNamedStretchedElement('Student Id', studentIdInput),
    createNamedStretchedElement('Password', passwordInput),
    createNamedStretchedElement('TTShiTu Username', tusernameInput),
    createNamedStretchedElement('TTShiTu Password', tpasswordInput),
    createNamedStretchedElement('Refresh Interval', refreshIntervalInput)
)
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
const courseInputsArray = []
function appendCourseElement({title, number, department} = {}) {
    const element = document.createElement('li')
    const courseTitleInput = document.createElement('input')
    const courseNumberInput = document.createElement('input')
    const courseDepartmentInput = document.createElement('input')
    const deleteButton = document.createElement('button')
    coursesEle.append(element)
    element.append(
        createNamedStretchedElement('Course Title', courseTitleInput),
        createNamedStretchedElement('Course Number (Optional)', courseNumberInput),
        createNamedStretchedElement('Course Department (Optional)', courseDepartmentInput),
        createNamedStretchedElement('', deleteButton)
    )
    const inputs = {
        courseTitleInput,
        courseNumberInput,
        courseDepartmentInput,
        deleted: false
    }
    courseInputsArray.push(inputs)
    if (typeof title === 'string') {
        courseTitleInput.value = title
    }
    courseNumberInput.type = 'number'
    if (typeof number === 'number') {
        courseNumberInput.value = number.toString()
    }
    if (typeof department === 'string') {
        courseDepartmentInput.value = department
    }
    deleteButton.textContent = 'Delete'
    deleteButton.addEventListener('click', () => {
        inputs.deleted = true
        element.remove()
    })
}
const {
    courses,
    studentId,
    password,
    ttshitu,
    refreshInterval
} = JSON.parse(electronAPI.loadConfig())
if (Array.isArray(courses)) {
    courses.forEach(value => appendCourseElement(value))
}
if (typeof studentId === 'string' && studentId !== '1*000*****') {
    studentIdInput.value = studentId
}
if (typeof password === 'string' && password !== '********') {
    passwordInput.value = password
}
if (typeof ttshitu === 'object') {
    const {username, password} = ttshitu
    if (typeof username === 'string' && username !== '********') {
        tusernameInput.value = username
    }
    if (typeof password === 'string' && password !== '********') {
        tpasswordInput.value = password
    }
}
if (typeof refreshInterval === 'number') {
    refreshIntervalInput.value = refreshInterval.toString()
}
addButton.textContent = 'Add Course'
addButton.addEventListener('click', () => {
    appendCourseElement()
})
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
    const courses = []
    for (const {
        courseTitleInput,
        courseNumberInput,
        courseDepartmentInput,
        deleted
    } of courseInputsArray) {
        if (deleted) {
            continue
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
        courses.push(course)
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
        courses,
        studentId: document.title = studentIdInput.value,
        password: passwordInput.value,
        ttshitu: {
            username: tusernameInput.value,
            password: tpasswordInput.value
        },
        refreshInterval,
        refreshLimitNumInterval: refreshInterval
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
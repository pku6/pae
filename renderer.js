const textarea = document.createElement('textarea')
const button = document.createElement('button')
const out = document.createElement('div')
document.body.append(
    textarea,
    button
)
textarea.value = electronAPI.loadConfig()
button.textContent = 'Start'
button.addEventListener('click', () => {
    button.remove()
    textarea.remove()
    document.body.append(out)
    electronAPI.saveConfig(textarea.value)
})
electronAPI.handleOut(string => {
    const line = document.createElement('div')
    out.append(line)
    line.textContent = string
    if (out.children.length > 1000) {
        out.children[0].remove()
    }
    line.scrollIntoView()
})
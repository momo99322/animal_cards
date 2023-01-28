window.onload = function () {
    updateScoreBoard()
}

function getUsersFromLocalStorage() {
    return JSON.parse(localStorage.getItem("users"), reviver)
}

function reviver(key, value) {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}

function updateScoreBoard() {
    let scoreBoardElement = document.querySelector("#score-board");
    scoreBoardElement.innerHTML = ""

    let title = document.createElement("div");
    title.id = "score-title"
    title.innerHTML = "Таблица очков:"

    scoreBoardElement.appendChild(title)

    let users = getUsersFromLocalStorage();

    let counter = 1;
    new Map([...users.entries()].sort((a, b) => b[1].score - a[1].score)).forEach(
        (value, key) => {
            let line = document.createElement("div");
            line.classList.add("score-element")
            line.innerHTML = `${counter++}. ${key}. ${value.score}`
            scoreBoardElement.appendChild(line)
        }
    )
}
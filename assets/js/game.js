let selectedCard = undefined
let hiddenCard = undefined
let hiddenGroup = undefined
let currentLevel = undefined
let currentLevelScore = 0
let currentCardPool = []
let isGameStarted = false

const CARD_WIDTH = 150
const CARD_HEIGHT = 200
const ROTATION_OFFSET = 60

let allCardPool = [
    {name: "Лев", imgUrl: "lion.png", traits: ["wild", "predator"], element: undefined},
    {name: "Жираф", imgUrl: "giraffe.png", traits: ["wild", "herbivore"], element: undefined},
    {name: "Курица", imgUrl: "chicken.png", traits: ["pet", "herbivore"], element: undefined},
    {name: "Корова", imgUrl: "cow.png", traits: ["pet", "herbivore"], element: undefined},
    {name: "Собака", imgUrl: "dog.png", traits: ["pet", "predator"], element: undefined},
    {name: "Лягушка", imgUrl: "frog.png", traits: ["wild", "predator"], element: undefined},
    {name: "Капибара", imgUrl: "capy.png", traits: ["wild", "herbivore"], element: undefined},
    {name: "Кошка", imgUrl: "cat.png", traits: ["pet", "predator"], element: undefined},
    {name: "Медведь", imgUrl: "bear.png", traits: ["wild", "predator"], element: undefined},
    {name: "Енот", imgUrl: "raccoon.png", traits: ["wild", "predator"], element: undefined},
    {name: "Овца", imgUrl: "sheep.png", traits: ["pet", "herbivore"], element: undefined},
    {name: "Панда", imgUrl: "panda.png", traits: ["wild", "herbivore"], element: undefined},
    {name: "Фламинго", imgUrl: "flamingo.png", traits: ["wild", "herbivore"], element: undefined}
]

let groupGameRules = [
    {description: "дикое/домашнее", firstGroup: "wild", secondGroup: "pet"},
    {description: "травоядное/хищник", firstGroup: "herbivore", secondGroup: "predator"}
]

const INITIAL_LEVELS = new Map()
INITIAL_LEVELS.set("1", {
        winConditionFunction: "selectCardCondition",
        rulesFunction: "createSelectRules",
        hideFunction: "hideCard",
        toOpenNext: 3,
        isOpen: true,
        maskNames: false,
        reward: 10,
        timerSec: 15,
        cardsForLevel: 8
    }
)
INITIAL_LEVELS.set("2", {
        winConditionFunction: "selectCardCondition",
        rulesFunction: "createSelectRules",
        hideFunction: "hideCard",
        toOpenNext: 3,
        isOpen: false,
        maskNames: true,
        reward: 20,
        timerSec: 20,
        cardsForLevel: 10
    }
)
INITIAL_LEVELS.set("3", {
        winConditionFunction: "groupCardCondition",
        rulesFunction: "createGroupRule",
        hideFunction: "selectGroups",
        toOpenNext: 0,
        isOpen: false,
        maskNames: false,
        reward: 50,
        timerSec: 60,
        cardsForLevel: 6
    }
)

const INITIAL_SCORE = 0;

const INITIAL_USER_PROPS = {
    score: INITIAL_SCORE,
    levelSettings: INITIAL_LEVELS
}

let gameField = document.querySelector("#game-field")

function clearRules() {
    document.querySelector("#rules").innerHTML = ""
}

function createSelectRules() {
    document.querySelector("#rules").innerHTML = `${currentLevel.id}. Выберете с помощью ЛКМ карту с изображением нужного животного и нажмите "Отправить ответ". <br\> Загаданное животное: ${hiddenCard.name}`
}

function createGroupRule() {
    document.querySelector("#rules").innerHTML = `${currentLevel.id}. Сгруппируйте животных по признаку ${hiddenGroup.description}. Правильно поверните всех животных (для поворота нажмите на колесико мыши)`
}

function selectCardCondition() {
    return selectedCard === hiddenCard.element;
}

function groupCardCondition() {
    for (let i = 0; i < currentCardPool.length; i++) {
        const card = currentCardPool[i];
        let friends = Array.from(currentCardPool).filter(another =>
            another.traits.includes(hiddenGroup.firstGroup) && card.traits.includes(hiddenGroup.firstGroup) ||
            another.traits.includes(hiddenGroup.secondGroup) && card.traits.includes(hiddenGroup.secondGroup)
        );

        if (!friends || friends.length === 0) {
            return false
        }

        const cardRect = card.element.getBoundingClientRect();

        for (let j = 0; j < friends.length; j++) {
            let friendRect = friends[j].element.getBoundingClientRect();
            const distance = Math.sqrt(Math.pow(cardRect.x - friendRect.x, 2) + Math.pow(cardRect.y - friendRect.y, 2));
            if (distance > 400) {
                return false
            }
        }

        if (card.element.style.transform !== 'rotate(0deg)' && card.element.style.transform !== 'rotate(360deg)') {
            return false
        }
    }

    return true
}

function hideCard() {
    hiddenCard = currentCardPool[randomIntFromInterval(0, currentCardPool.length - 1)]
}

function selectGroups() {
    hiddenGroup = groupGameRules[randomIntFromInterval(0, groupGameRules.length - 1)]
}

function createStartButton() {
    let buttonContainerElement = document.querySelector("#button-container");
    buttonContainerElement.innerHTML = ""

    let button = document.createElement("button");
    button.id = "start-button"
    button.onclick = gameStart
    button.innerHTML = "Начать"

    buttonContainerElement.appendChild(button)
}

function createSendAnswerAndCloseGameButtons() {
    let buttonContainerElement = document.querySelector("#button-container");
    buttonContainerElement.innerHTML = ""

    let answerButton = document.createElement("button");
    answerButton.id = "answer-button"
    answerButton.onclick = sendAnswer
    answerButton.innerHTML = "Отправить ответ"

    let closeButton = document.createElement("button");
    closeButton.id = "over-button"
    closeButton.onclick = interruptGame
    closeButton.innerHTML = "Прекратить досрочно"

    buttonContainerElement.appendChild(answerButton)
    buttonContainerElement.appendChild(closeButton)
}

function updateTimer(seconds) {
    let timerContainer = document.querySelector("#timer-container");

    timerContainer.innerHTML = ""

    let timerText = document.createElement("p");
    timerText.id = "timer-text"
    timerText.innerHTML = "Таймер:"

    let timer = document.createElement("div");
    timer.id = "timer"
    timer.innerHTML = seconds + " секунд"

    timerContainer.appendChild(timerText)
    timerContainer.appendChild(timer)
}

window.onload = function () {
    initializeUser()
    updateLevels()
    updateTimer(getLevelsFromLocalStorage(getCurrentUser()).get(currentLevel.id).timerSec)
    updateScore(0)
    createStartButton()
}


function initializeUser() {
    let username = undefined;
    while (!username) {
        username = prompt("What is your name?")
    }

    let users = getUsersFromLocalStorage();

    if (!users) {
        users = new Map()
    }

    let userProp = users.get(username);
    if (!userProp) {
        users.set(username, INITIAL_USER_PROPS)
    }

    setUsersToLocalStorage(users)
    setCurrentUser(username)
}

function clearGameField() {
    gameField.innerHTML = ""
}

function updateGameField() {
    createCards(getLevelsFromLocalStorage().get(currentLevel.id).maskNames)
    window[getLevelsFromLocalStorage().get(currentLevel.id).hideFunction]()
    window[getLevelsFromLocalStorage().get(currentLevel.id).rulesFunction]()
}

function updateScore(score) {
    let scoreContainer = document.querySelector("#score-container");
    scoreContainer.innerHTML = ""

    let scoreTextElement = document.createElement("p");
    scoreContainer.classList.add("score")
    scoreTextElement.innerHTML = "Очки:"

    let scoreElement = document.createElement("div");
    scoreElement.id = "score"
    scoreElement.innerHTML = score

    scoreContainer.appendChild(scoreTextElement)
    scoreContainer.appendChild(scoreElement)
}

function updateLevels() {
    let levelsElement = document.querySelector("#levels-container");
    levelsElement.innerHTML = ""

    let levelsText = document.createElement("p");
    levelsElement.innerHTML = "Уровни: "
    levelsElement.appendChild(levelsText)

    let levels = getLevelsFromLocalStorage()
    for (let i = 1; i <= levels.size; i++) {
        let levelSetting = levels.get(`${i}`);

        let levelButton = document.createElement("button")
        levelButton.classList.add("level-button")
        levelButton.id = `${i}`
        levelButton.innerHTML = `${i}`

        levelButton.onclick = changeLevel

        if (levelSetting.isOpen) {
            levelButton.classList.add("opened")
        }

        if (!currentLevel && i === 1) {
            currentLevel = levelButton
        }

        if (currentLevel && Number(currentLevel.id) === i) {
            currentLevel = levelButton
            levelButton.classList.add("selected")
        }

        levelsElement.appendChild(levelButton)
    }
}

function createCards(maskNames = false) {
    clearGameField()

    const shuffled = allCardPool.sort(() => 0.5 - Math.random());
    currentCardPool = shuffled.slice(0, getLevelsFromLocalStorage().get(currentLevel.id).cardsForLevel);

    for (let i = 0; i < currentCardPool.length; i++) {
        let card = currentCardPool[i];

        let cardElement = document.createElement("div");
        let cardImgElement = document.createElement("div");
        let cardTextElement = document.createElement("div");

        cardElement.classList.add("card")

        cardImgElement.classList.add("card-img")
        cardImgElement.style.backgroundImage = `url(../assets/${card.imgUrl})`

        cardTextElement.classList.add("card-text")
        if (maskNames) {
            cardTextElement.innerHTML = "*****"
        } else {
            cardTextElement.innerHTML = card.name
        }

        cardElement.appendChild(cardImgElement)
        cardElement.appendChild(cardTextElement)

        card.element = cardElement
        gameField.appendChild(cardElement)

        cardElement.style.width = CARD_WIDTH + "px";
        cardElement.style.height = CARD_HEIGHT + "px";

        cardElement.style.position = "absolute";

        let rect = gameField.getBoundingClientRect();
        cardElement.style.left = randomIntFromInterval(rect.left + CARD_WIDTH, rect.right - CARD_WIDTH) + 'px';
        cardElement.style.top = randomIntFromInterval(rect.top + CARD_HEIGHT, rect.bottom - CARD_HEIGHT) + 'px';

        cardElement.style.transform = 'rotate(' + randomIntFromInterval(1, 360 / ROTATION_OFFSET) * ROTATION_OFFSET + 'deg)';
    }
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

let isDragging = false;

document.onmousedown = function (event) {
    let card = event.target.closest('.card');

    if (!card) return;

    event.preventDefault();

    card.ondragstart = function () {
        return false;
    };

    if (event.button === 1) {
        rotate(card)
        return;
    }

    let shiftX, shiftY;
    if (event.button === 0) {
        if (selectedCard) {
            selectedCard.classList.remove("selected")
        }

        selectedCard = card;
        selectedCard.classList.add("selected")

        startDrag(card, event.clientX, event.clientY);
    }

    function rotate(card) {
        let transformAttribute = card.style.transform;
        let newDeg = (Number(transformAttribute.substring(transformAttribute.indexOf('(') + 1, transformAttribute.indexOf('deg)'))) + ROTATION_OFFSET) % 360;
        card.style.transform = `rotate(${newDeg}deg)`;
    }

    function startDrag(element, clientX, clientY) {
        if (isDragging) {
            return;
        }

        isDragging = true;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        shiftX = clientX - element.getBoundingClientRect().left;
        shiftY = clientY - element.getBoundingClientRect().top;

        element.style.position = 'fixed';

        moveAt(clientX, clientY);
    }

    function onMouseUp() {
        finishDrag();
    }

    function finishDrag() {
        if (!isDragging) {
            return;
        }

        isDragging = false;

        card.style.position = 'absolute';

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(event) {
        moveAt(event.clientX, event.clientY);
    }

    function moveAt(clientX, clientY) {
        let newLeft = clientX - shiftX;
        let newTop = clientY - shiftY;

        if (newLeft < gameField.offsetLeft) {
            newLeft = gameField.offsetLeft;
        }

        let right = gameField.getBoundingClientRect().right - card.offsetWidth;
        if (newLeft > right) {
            newLeft = right;
        }

        if (newTop < gameField.offsetTop) {
            newTop = gameField.offsetTop;
        }

        let bottom = gameField.getBoundingClientRect().bottom - card.offsetHeight;
        if (newTop > bottom) {
            newTop = bottom;
        }

        card.style.left = newLeft + 'px';
        card.style.top = newTop + 'px';
    }

}


function setUsersToLocalStorage(score) {
    localStorage.setItem("users", JSON.stringify(score, replacer));
}

function getUsersFromLocalStorage() {
    return JSON.parse(localStorage.getItem("users"), reviver)
}

function setLevelsToLocalStorage(levels, user) {
    if (!user) {
        user = getCurrentUser()
    }

    let users = getUsersFromLocalStorage();
    let userProps = users.get(user);
    userProps.levelSettings = levels
    setUsersToLocalStorage(users)
}

function getLevelsFromLocalStorage(user) {
    if (!user) {
        user = getCurrentUser()
    }

    let users = getUsersFromLocalStorage();
    let userProps = users.get(user);
    return userProps.levelSettings
}

function setCurrentUser(user) {
    return localStorage.setItem("current-user", user)

}

function getCurrentUser() {
    return localStorage.getItem("current-user")
}

function setUserScore(score, user) {
    if (!user) {
        user = getCurrentUser()
    }

    let users = getUsersFromLocalStorage();
    users.get(user).score = score
    setUsersToLocalStorage(users)
}

function getUserScore(user) {
    if (!user) {
        user = getCurrentUser()
    }

    let users = getUsersFromLocalStorage();
    return users.get(user).score
}

function replacer(key, value) {
    if (value instanceof Map) {
        return {
            dataType: 'Map', value: Array.from(value.entries()),
        };
    } else {
        return value;
    }
}

function reviver(key, value) {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}

function changeLevel() {
    if (isGameStarted) {
        return
    }

    let id = this.id
    let levels = getLevelsFromLocalStorage();
    let clickedSettings = levels.get(id);
    if (clickedSettings.isOpen) {
        currentLevel.classList.remove("selected")
        currentLevel = this;
        currentLevel.classList.add("selected")

        updateTimer(getLevelsFromLocalStorage(getCurrentUser()).get(currentLevel.id).timerSec)
    }
}

function sendAnswer() {
    if (!isGameStarted) {
        return
    }

    let currentLevelId = currentLevel.id;
    let levels = getLevelsFromLocalStorage()
    let currentLevelFromStorage = levels.get(currentLevelId);

    if (window[currentLevelFromStorage.winConditionFunction]()) {
        currentLevelScore = currentLevelScore + currentLevelFromStorage.reward
    } else {
        currentLevelScore = currentLevelScore + currentLevelFromStorage.reward * -2
    }

    updateScore(currentLevelScore)
    updateGameField()
}

function gameOver() {
    isGameStarted = false
    createStartButton()

    let currentLevelId = currentLevel.id
    let levels = getLevelsFromLocalStorage();
    let currentLevelFromStorage = levels.get(currentLevelId);

    let message = `Вы заработали ${currentLevelScore} очков`;

    let toOpenNext = currentLevelFromStorage.toOpenNext;
    if (toOpenNext > 0) {
        message = message + `, до перехода на следующий уровень необходимо сыграть ещё ${toOpenNext} раз`;
    } else {
        let nextLevel = levels.get(`${Number(currentLevelId) + 1}`);

        if (nextLevel) {
            nextLevel.isOpen = true
        }
    }
    setLevelsToLocalStorage(levels)

    alert(message)

    setUserScore(getUserScore() + currentLevelScore)
    updateTimer(getLevelsFromLocalStorage().get(currentLevel.id).timerSec)
    updateLevels()
    clearGameField()
    clearRules()
    updateScore(0)

    currentLevelScore = 0
}

function interruptGame() {
    clearInterval(timer);
    gameOver()
}

let timer = undefined;

function startTimer() {
    let deadline = Date.now() + getLevelsFromLocalStorage().get(currentLevel.id).timerSec * 1000;

    timer = setInterval(function () {
        let now = new Date().getTime();
        let distance = deadline - now;

        updateTimer(Math.floor((distance % (1000 * 60)) / 1000) + 1);

        if (distance < 0) {
            interruptGame()
        }
    }, 1000)
}

function gameStart() {
    isGameStarted = true

    let currentLevelId = currentLevel.id
    let levels = getLevelsFromLocalStorage();
    let currentLevelFromStorage = levels.get(currentLevelId);

    currentLevelFromStorage.toOpenNext = currentLevelFromStorage.toOpenNext - 1
    setLevelsToLocalStorage(levels)

    updateGameField()
    createSendAnswerAndCloseGameButtons()
    startTimer()
    updateScore(0)
}

function resetProgress() {
    if (isGameStarted) {
        return
    }

    let currentUser = getCurrentUser();
    setUserScore(0, currentUser)
    setLevelsToLocalStorage(INITIAL_LEVELS, currentUser)

    updateScore(0)
    updateLevels()
    clearGameField()
    clearRules()
}
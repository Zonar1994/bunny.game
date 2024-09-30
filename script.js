// Game Variables
let carrots = 0, bunnies = 0, cuteness = 0, lostBunnies = 0, soup = 0;
let firstBunnyAttracted = false, firstBunnyDied = false;
let bunnyAdoptionCost = 3, bunnyAdoptionCostCap = 10;
let bunnyCutenessProductionRate = 1, bunnyCarrotConsumption = 1;
let carrotConsumptionInterval = 5000, cutenessProductionInterval = 5000;
let hunterInterval = null, autoClickerInterval = null, carrotGeneratorInterval = null;
let upgrades = {
    productionDisplay: false, autoClicker: false, carrotGen: false,
    cutenessBoost: false, doubleBunny: false, hunterBoostLevel: 0,
    bunnyCostReset: false
};
let availableUpgrades = [
    {name: 'productionDisplay', displayName: '💡 Production Display Upgrade', cost: {carrots: 20}, purchased: false},
    {name: 'autoClicker', displayName: '⚙️ Auto-Clicker Upgrade', cost: {cuteness: 50}, purchased: false, requires: 'productionDisplay'},
    {name: 'carrotGen', displayName: '🌱 Carrot Generator Upgrade', cost: {carrots: 30}, purchased: false},
    {name: 'cutenessBoost', displayName: '💎 Cuteness Boost Upgrade', cost: {cuteness: 40}, purchased: false},
    {name: 'doubleBunny', displayName: '✨ Double Bunny Output/Input Upgrade', cost: {cuteness: 60}, purchased: false},
    {name: 'bunnyCostReset', displayName: '🔄 Bunny Cost Reset Upgrade', cost: {cuteness: 100}, purchased: false},
];
let purchasedUpgrades = [], storyEvents = [];
let soupOptionUnlocked = false, hunterUnlocked = false, askedAboutSoup = false, declinedSoupOption = false;

// Initialize Game
function initializeGame() {
    const bgMusic = document.getElementById('backgroundMusic');
    bgMusic.volume = 0.2; // Set default volume
    // bgMusic.play(); // Do not play by default

    addSoundEffects();
    updateCounters();
    document.getElementById('adoptBunny').disabled = true;
    startCarrotConsumption();
    startCutenessProduction();
    calculateProductionRates();
    renderUpgradeShop();
}

// Handle Menu Options
function handleMenu(option) {
    const bgMusic = document.getElementById('backgroundMusic');
    switch(option) {
        case 'toggleMusicOn':
            bgMusic.play();
            break;
        case 'toggleMusicOff':
            bgMusic.pause();
            break;
        case 'storybook':
            openStorybook();
            break;
        case 'restart':
            if (confirm('Are you sure you want to restart the game?')) restartGame();
            break;
        case 'save':
            saveGame();
            break;
        case 'load':
            loadGame();
            break;
        default:
            break;
    }
    // Reset menu selection
    document.querySelector('#menu select').value = '';
}

// Find a Carrot
function findCarrot(isAutoClicker = false) {
    carrots++;
    if (!isAutoClicker) {
        playSound('click');
        showClickEffect(event);
    }
    updateCounters();
    if (carrots >= 10 && !firstBunnyAttracted) {
        showPopupSingleButton('You attracted your first bunny! Say hello to receive Cuteness.', 'Say Hello', sayHelloToFirstBunny);
        firstBunnyAttracted = true;
    }
}

// Say Hello to First Bunny
function sayHelloToFirstBunny() {
    bunnies++;
    cuteness++;
    document.getElementById('adoptBunny').disabled = false;
    closePopup();
    addStoryEvent('You attracted your first bunny! Say hello to receive Cuteness.');
    updateField(); // Update the UI immediately
}

// Adopt a Bunny
function adoptBunny() {
    if (cuteness >= bunnyAdoptionCost) {
        bunnies++;
        cuteness -= bunnyAdoptionCost;
        if (!upgrades.bunnyCostReset) bunnyAdoptionCost = Math.min(bunnyAdoptionCost + 1, bunnyAdoptionCostCap);
        playSound('click');
        showClickEffect(event);
        updateCounters();
    } else {
        alert('Not enough Cuteness points to adopt a bunny.');
    }
}

// Start Carrot Consumption Timer
function startCarrotConsumption() {
    setInterval(() => {
        if (bunnies > 0) {
            let needed = bunnies * bunnyCarrotConsumption;
            if (carrots >= needed) {
                carrots -= needed;
                hideWarningMessage();
            } else {
                let canEat = Math.floor(carrots / bunnyCarrotConsumption);
                let lost = bunnies - canEat - 1; // First bunny can't die
                carrots = Math.max(carrots - (canEat * bunnyCarrotConsumption), 0);
                if (lost > 0) {
                    bunnies -= lost;
                    lostBunnies += lost;
                    playSound('bunnyLost');
                    updateCounters();
                    if (!firstBunnyDied) {
                        showPopupSingleButton("You've unlocked the Lost Bunnies counter!", 'X', closePopup);
                        firstBunnyDied = true;
                        document.getElementById('lostBunniesCounter').style.display = 'block';
                        addStoryEvent("You've unlocked the Lost Bunnies counter!");
                    }
                    if (declinedSoupOption) askedAboutSoup = false;
                    checkForSoupOption();
                }
                showWarningMessage();
            }
            updateCounters();
            updateField(); // Update the UI to reflect changes
        }
    }, carrotConsumptionInterval);
}

// Show/Hide Warning Message
function showWarningMessage() {
    document.getElementById('warningMessage').style.display = 'block';
}
function hideWarningMessage() {
    document.getElementById('warningMessage').style.display = 'none';
}

// Start Cuteness Production Timer
function startCutenessProduction() {
    setInterval(() => {
        if (bunnies > 0) {
            let production = bunnies * bunnyCutenessProductionRate * (upgrades.cutenessBoost ? 2 : 1);
            cuteness += production;
            updateCounters();
        }
    }, cutenessProductionInterval);
}

// Update Counters and Field
function updateCounters() {
    document.getElementById('carrotCount').innerText = Math.floor(carrots);
    document.getElementById('bunnyCount').innerText = bunnies;
    document.getElementById('cutenessCount').innerText = Math.floor(cuteness);
    document.getElementById('lostBunniesCount').innerText = lostBunnies;
    document.getElementById('adoptBunnyCost').innerText = bunnyAdoptionCost;
    document.getElementById('soupCount').innerText = soup;
    if (upgrades.productionDisplay) calculateProductionRates();
    updateField();
}

// Update Field Visualization
function updateField() {
    const carrotField = document.getElementById('carrotField');
    const bunnyField = document.getElementById('bunnyField');
    const maxItems = 50;

    // Update Carrots
    const currentCarrots = carrotField.querySelectorAll('.carrot').length;
    const carrotsToAdd = Math.min(carrots, maxItems) - currentCarrots;
    if (carrotsToAdd > 0) {
        for (let i = 0; i < carrotsToAdd; i++) {
            const carrot = document.createElement('div');
            carrot.className = 'carrot';
            carrot.style.left = `${Math.random() * 90}%`;
            carrot.style.top = `${Math.random() * 90}%`;
            carrotField.appendChild(carrot);
        }
    } else if (carrotsToAdd < 0) {
        for (let i = 0; i < Math.abs(carrotsToAdd); i++) {
            if (carrotField.lastChild) carrotField.removeChild(carrotField.lastChild);
        }
    }
    toggleMoreIndicator(carrotField, carrots, maxItems);

    // Update Bunnies
    const currentBunnies = bunnyField.querySelectorAll('.bunny').length;
    const bunniesToAdd = Math.min(bunnies, maxItems) - currentBunnies;
    if (bunniesToAdd > 0) {
        for (let i = 0; i < bunniesToAdd; i++) {
            const bunny = document.createElement('div');
            bunny.className = 'bunny';
            bunny.style.left = `${Math.random() * 90}%`;
            bunny.style.top = `${Math.random() * 90}%`;
            bunnyField.appendChild(bunny);
        }
    } else if (bunniesToAdd < 0) {
        for (let i = 0; i < Math.abs(bunniesToAdd); i++) {
            if (bunnyField.lastChild) bunnyField.removeChild(bunnyField.lastChild);
        }
    }
    toggleMoreIndicator(bunnyField, bunnies, maxItems);
}

// Toggle "+ more" indicator
function toggleMoreIndicator(field, count, max) {
    let moreText = field.querySelector('.moreText');
    if (count > max) {
        if (!moreText) {
            moreText = document.createElement('div');
            moreText.className = 'moreText';
            moreText.innerText = '+ more';
            field.appendChild(moreText);
        }
    } else if (moreText) {
        field.removeChild(moreText);
    }
}

// Show Popup with Single Button
function showPopupSingleButton(message, buttonText, actionFunction) {
    const popup = document.getElementById('popup');
    popup.querySelector('#popupMessage').innerText = message;
    const yesBtn = popup.querySelector('#popupYesButton');
    const noBtn = popup.querySelector('#popupNoButton');
    yesBtn.innerText = buttonText;
    yesBtn.onclick = actionFunction;
    noBtn.style.display = 'none';
    yesBtn.style.display = 'inline-block';
    popup.style.display = 'block';
}

// Show Popup with Yes/No Buttons
function showPopupYesNo(message, yesFunction, noFunction) {
    const popup = document.getElementById('popup');
    popup.querySelector('#popupMessage').innerText = message;
    const yesBtn = popup.querySelector('#popupYesButton');
    const noBtn = popup.querySelector('#popupNoButton');
    yesBtn.innerText = 'Yes';
    yesBtn.onclick = yesFunction;
    noBtn.innerText = 'No';
    noBtn.onclick = noFunction;
    yesBtn.style.display = 'inline-block';
    noBtn.style.display = 'inline-block';
    popup.style.display = 'block';
}

// Close Popup
function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

// Add Story Event
function addStoryEvent(message) {
    storyEvents.push(message);
}

// Open Storybook
function openStorybook() {
    const storybook = document.getElementById('storybook');
    storybook.style.display = 'block';
    showTab('stories');
}

// Close Storybook
function closeStorybook() {
    document.getElementById('storybook').style.display = 'none';
}

// Show Tabs in Storybook
function showTab(tabName) {
    const content = document.getElementById('storybookContent');
    content.innerHTML = '';
    if (tabName === 'stories') {
        storyEvents.forEach(event => {
            const polaroid = document.createElement('div');
            polaroid.className = 'polaroid';
            polaroid.innerText = event;
            content.appendChild(polaroid);
        });
    } else if (tabName === 'upgrades') {
        purchasedUpgrades.forEach(upgrade => {
            const polaroid = document.createElement('div');
            polaroid.className = 'polaroid';
            polaroid.innerText = upgrade.displayName;
            content.appendChild(polaroid);
        });
    }
}

// Restart Game
function restartGame() {
    if (!confirm('Are you sure you want to restart the game? This will erase your progress.')) return;
    carrots = bunnies = cuteness = lostBunnies = soup = 0;
    firstBunnyAttracted = firstBunnyDied = false;
    bunnyAdoptionCost = 3;
    bunnyAdoptionCostCap = 10;
    bunnyCutenessProductionRate = 1;
    bunnyCarrotConsumption = 1;
    upgrades = {
        productionDisplay: false, autoClicker: false, carrotGen: false,
        cutenessBoost: false, doubleBunny: false, hunterBoostLevel: 0,
        bunnyCostReset: false
    };
    availableUpgrades.forEach(upg => upg.purchased = false);
    purchasedUpgrades = [], storyEvents = [];
    document.getElementById('adoptBunny').disabled = true;
    document.getElementById('lostBunniesCounter').style.display = 'none';
    document.getElementById('soupCounter').style.display = 'none';
    document.getElementById('soupSection').style.display = 'none';
    document.getElementById('productionRates').style.display = 'none';
    hideWarningMessage();
    clearStorybook();
    clearInterval(autoClickerInterval); clearInterval(carrotGeneratorInterval); clearInterval(hunterInterval);
    autoClickerInterval = carrotGeneratorInterval = hunterInterval = null;
    updateCounters(); renderUpgradeShop();
}

// Clear Storybook Content
function clearStorybook() {
    document.getElementById('storybookContent').innerHTML = '';
}

// Render Upgrade Shop
function renderUpgradeShop() {
    const shop = document.getElementById('upgradeShop');
    shop.innerHTML = '';
    availableUpgrades.forEach(upgrade => {
        if (!upgrade.purchased && (!upgrade.requires || upgrades[upgrade.requires])) {
            const button = document.createElement('button');
            button.className = 'upgrade-button';
            button.id = `${upgrade.name}Upgrade`;
            button.onclick = () => buyUpgrade(upgrade.name);
            const cost = upgrade.cost.cuteness ? `${upgrade.cost.cuteness} 💖` : '';
            const carrotCost = upgrade.cost.carrots ? `${upgrade.cost.carrots} 🥕` : '';
            button.innerText = `${upgrade.displayName} (Cost: ${cost}${carrotCost})`;
            shop.appendChild(button);
        }
    });
}

// Buy Upgrade
function buyUpgrade(upgradeName) {
    const upgrade = availableUpgrades.find(u => u.name === upgradeName);
    if (upgrade && !upgrade.purchased) {
        if ((upgrade.cost.carrots && carrots >= upgrade.cost.carrots) ||
            (upgrade.cost.cuteness && cuteness >= upgrade.cost.cuteness)) {
            if (upgrade.cost.carrots) carrots -= upgrade.cost.carrots;
            if (upgrade.cost.cuteness) cuteness -= upgrade.cost.cuteness;
            upgrades[upgradeName] = true; upgrade.purchased = true;
            purchasedUpgrades.push(upgrade);
            playSound('click'); showClickEffect(event);
            applyUpgrade(upgradeName); updateCounters(); renderUpgradeShop();
        } else {
            alert('Not enough resources to buy this upgrade.');
        }
    }
}

// Apply Upgrade Effects
function applyUpgrade(upgradeName) {
    switch(upgradeName) {
        case 'productionDisplay':
            document.getElementById('productionRates').style.display = 'block';
            break;
        case 'autoClicker':
            startAutoClicker();
            break;
        case 'carrotGen':
            startCarrotGenerator();
            break;
        case 'doubleBunny':
            bunnyCutenessProductionRate *= 2;
            bunnyCarrotConsumption *= 2;
            break;
        case 'bunnyCostReset':
            bunnyAdoptionCost = 3;
            bunnyAdoptionCostCap = 20; // Double the cap
            upgrades.bunnyCostReset = true;
            break;
        default:
            break;
    }
}

// Start Auto-Clicker
function startAutoClicker() {
    if (upgrades.autoClicker && !autoClickerInterval) {
        autoClickerInterval = setInterval(() => findCarrot(true), 1000);
    }
}

// Start Carrot Generator
function startCarrotGenerator() {
    if (upgrades.carrotGen && !carrotGeneratorInterval) {
        carrotGeneratorInterval = setInterval(() => { carrots += 2; updateCounters(); }, 5000);
    }
}

// Calculate Production Rates
function calculateProductionRates() {
    let carrotsPerMinute = (upgrades.autoClicker ? 60 : 0) + (upgrades.carrotGen ? 24 : 0);
    let cutenessPerMinute = bunnies * bunnyCutenessProductionRate * 12 * (upgrades.cutenessBoost ? 2 : 1);
    document.getElementById('carrotsPerMinute').innerText = carrotsPerMinute;
    document.getElementById('cutenessPerMinute').innerText = cutenessPerMinute;
}

// Check for Soup Option
function checkForSoupOption() {
    if (lostBunnies >= 10 && !soupOptionUnlocked && !askedAboutSoup) {
        showPopupYesNo('You have 10 lost bunnies. Do you want to make soup?', acceptSoupOption, declineSoupOptionHandler);
        askedAboutSoup = true;
    }
}

function acceptSoupOption() {
    if (lostBunnies >= 10) {
        soupOptionUnlocked = true;
        lostBunnies -= 10;
        soup += 1;
        updateCounters();
        document.getElementById('soupCounter').style.display = 'block';
        document.getElementById('soupSection').style.display = 'block';
        closePopup();
        addStoryEvent('You decided to make soup from lost bunnies.');
        checkForHunterStory();
    } else {
        alert('Not enough lost bunnies to make soup.');
    }
}

function declineSoupOptionHandler() {
    closePopup();
    declinedSoupOption = true;
}

// Cook Soup
function cookSoup() {
    if (lostBunnies >= 10) {
        lostBunnies -= 10; soup++;
        playSound('click'); showClickEffect(event);
        updateCounters(); checkForHunterStory();
    } else {
        alert('Not enough lost bunnies to cook soup.');
    }
}

// Check for Hunter Story
function checkForHunterStory() {
    if (soup >= 3 && !hunterUnlocked) {
        showPopupSingleButton('You attracted a Bunny Hunter! Feed him one soup so he can hunt and bring bunnies for you.', 'Share Soup', activateHunter);
        hunterUnlocked = true;
    }
}

// Activate Hunter
function activateHunter() {
    if (soup >= 1) {
        soup--; updateCounters(); startHunter(); closePopup();
        addStoryEvent('You shared soup with the Hunter. He will hunt bunnies for you.');
    } else {
        alert('Not enough soup to share with the Hunter.');
    }
}

// Start Hunter
function startHunter() {
    if (!hunterInterval) {
        hunterInterval = setInterval(() => {
            if (soup >=1 ) {
                soup--; 
                let newBunnies = Math.floor(10 * Math.pow(1.1, upgrades.hunterBoostLevel));
                bunnies += newBunnies;
                updateCounters();
                playSound('hunter');
                addStoryEvent(`The Hunter brought ${newBunnies} bunnies for you!`);
            } else {
                clearInterval(hunterInterval); hunterInterval = null;
            }
        }, 5000);
    }
}

// Save Game
function saveGame() {
    const gameData = JSON.stringify({
        carrots, bunnies, cuteness, lostBunnies, soup,
        bunnyAdoptionCost, bunnyAdoptionCostCap,
        bunnyCutenessProductionRate, bunnyCarrotConsumption,
        upgrades, availableUpgrades, purchasedUpgrades, storyEvents,
        firstBunnyAttracted, firstBunnyDied, soupOptionUnlocked,
        hunterUnlocked, askedAboutSoup, declinedSoupOption
    });
    prompt('Copy your save data:', gameData);
}

// Load Game
function loadGame() {
    const gameDataString = prompt('Paste your save data:');
    if (gameDataString) {
        try {
            const data = JSON.parse(gameDataString);
            // Restore game state
            carrots = data.carrots || 0;
            bunnies = data.bunnies || 0;
            cuteness = data.cuteness || 0;
            lostBunnies = data.lostBunnies || 0;
            soup = data.soup || 0;
            bunnyAdoptionCost = data.bunnyAdoptionCost || 3;
            bunnyAdoptionCostCap = data.bunnyAdoptionCostCap || 10;
            bunnyCutenessProductionRate = data.bunnyCutenessProductionRate || 1;
            bunnyCarrotConsumption = data.bunnyCarrotConsumption || 1;
            upgrades = data.upgrades || {
                productionDisplay: false, autoClicker: false, carrotGen: false,
                cutenessBoost: false, doubleBunny: false, hunterBoostLevel: 0,
                bunnyCostReset: false
            };
            availableUpgrades = data.availableUpgrades || availableUpgrades;
            purchasedUpgrades = data.purchasedUpgrades || [];
            storyEvents = data.storyEvents || [];
            firstBunnyAttracted = data.firstBunnyAttracted || false;
            firstBunnyDied = data.firstBunnyDied || false;
            soupOptionUnlocked = data.soupOptionUnlocked || false;
            hunterUnlocked = data.hunterUnlocked || false;
            askedAboutSoup = data.askedAboutSoup || false;
            declinedSoupOption = data.declinedSoupOption || false;

            // Update UI
            document.getElementById('adoptBunny').disabled = !(bunnies > 0);
            document.getElementById('lostBunniesCounter').style.display = lostBunnies > 0 ? 'block' : 'none';
            document.getElementById('soupCounter').style.display = soup > 0 ? 'block' : 'none';
            document.getElementById('soupSection').style.display = soup > 0 ? 'block' : 'none';
            document.getElementById('productionRates').style.display = upgrades.productionDisplay ? 'block' : 'none';
            updateCounters(); renderUpgradeShop(); updateField();
            alert('Game loaded successfully!');
        } catch (e) {
            alert('Invalid save data.');
        }
    }
}

// Add Sound Effects
function addSoundEffects() {
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', e => {
            if (['findCarrot', 'adoptBunny', 'cookSoupButton'].includes(button.id)) {
                playSound('click');
                showClickEffect(e);
            }
        });
    });
}

// Play Sound
function playSound(soundName) {
    const audio = new Audio(`sounds/${soundName}.mp3`);
    audio.volume = 0.5; audio.play();
}

// Show Click Effect
function showClickEffect(e) {
    const clickEffect = document.getElementById('clickEffect');
    // Get the event's clientX and clientY from the last mouse/touch event
    let x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    let y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    clickEffect.style.left = `${x}px`;
    clickEffect.style.top = `${y}px`;
    clickEffect.style.display = 'block';
    setTimeout(() => clickEffect.style.display = 'none', 500);
}

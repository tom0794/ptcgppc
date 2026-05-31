const packSeriesSelect = document.getElementById("pack-series-select");
const cardSelect = document.getElementById("card-select");
const resultContainer = document.getElementById("result-container");

const rarityNames = {
  oneDiamond: "◊",
  twoDiamond: "◊◊",
  threeDiamond: "◊◊◊",
  fourDiamond: "◊◊◊◊",
  oneStar: "☆",
  twoStar: "☆☆",
  threeStar: "☆☆☆",
  shiny: "✷",
  shinyDouble: "✷✷",
  crown: "🜲",
};

function buildRarityCardCounts(seriesKey) {
    const cards = getCardsForSeries(seriesKey);
    const counts = {};
    
    cards.forEach((cardId) => {
        const card = cardDatabase[cardId];
        if (card) {
            counts[card.rarity] = (counts[card.rarity] || 0) + 1;
        }
    });
    
    return counts;
}

function calculateCardPullOdds(seriesKey, cardId) {
    if (!packSeries[seriesKey] || !cardDatabase[cardId]) return 0;

    const card = cardDatabase[cardId];
    const series = packSeries[seriesKey];
    const rarityCardCounts = buildRarityCardCounts(seriesKey);
    const cardCount = rarityCardCounts[card.rarity] || 1;
    const cardProb = 1 / cardCount;

    let totalOdds = 0;

    for (const [packType, packData] of Object.entries(series.packTypes)) {
        const packProb = packData.probability;
        
        // Calculate P(at least one of this card in this pack type)
        let noCardProb = 1;
        
        for (const slot of packData.slots) {
            const rarityOdds = slot[card.rarity] || 0;
            const slotCardOdds = rarityOdds * cardProb;
            noCardProb *= (1 - slotCardOdds);
        }
        
        const atLeastOneProb = 1 - noCardProb;
        totalOdds += packProb * atLeastOneProb;
    }

    return totalOdds;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function calculateAtLeastOne(slotOdds) {
  const slotsInPack = 5;
  const noCardsProb = Math.pow(1 - slotOdds, slotsInPack);
  return 1 - noCardsProb;
}

function getCardsForSeries(seriesKey) {
    return Object.keys(cardDatabase).filter((cardId) => {
        return cardDatabase[cardId].series === seriesKey;
    });
}

const cardSearch = document.getElementById("card-search");
const cardDropdown = document.getElementById("card-dropdown");
let filteredCards = [];
let selectedCardIndex = -1;

function populateCardDropdown() {
    const seriesKey = packSeriesSelect.value;
    cardSearch.value = "";
    cardDropdown.innerHTML = "";
    filteredCards = [];
    
    if (!seriesKey || !packSeries[seriesKey]) {
        cardDropdown.classList.remove("open");
        return;
    }

    const cards = getCardsForSeries(seriesKey);
    filteredCards = cards;
    renderCardOptions(cards);
}

function renderCardOptions(cards) {
    cardDropdown.innerHTML = "";
    
    if (cards.length === 0) {
        cardDropdown.classList.remove("open");
        return;
    }
    
    cards.forEach((cardId, index) => {
        const card = cardDatabase[cardId];
        if (card) {
            const li = document.createElement("li");
            li.textContent = card.name;
            li.dataset.cardId = cardId;
            li.addEventListener("click", () => selectCard(cardId));
            cardDropdown.appendChild(li);
        }
    });
    
    cardDropdown.classList.add("open");
    selectedCardIndex = -1;
}

function selectCard(cardId) {
    cardSearch.value = cardDatabase[cardId].name;
    cardDropdown.classList.remove("open");
    updateResult(cardId);
}

cardSearch.addEventListener("focus", () => {
    if (filteredCards.length > 0) {
        renderCardOptions(filteredCards);
    }
});

cardSearch.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    
    if (!query) {
        const seriesKey = packSeriesSelect.value;
        const cards = getCardsForSeries(seriesKey);
        filteredCards = cards;
        renderCardOptions(cards);
        return;
    }
    
    const seriesKey = packSeriesSelect.value;
    const cards = getCardsForSeries(seriesKey);
    filteredCards = cards.filter((cardId) => {
        return cardDatabase[cardId].name.toLowerCase().includes(query);
    });
    
    renderCardOptions(filteredCards);
});

cardSearch.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
        selectedCardIndex = Math.min(selectedCardIndex + 1, filteredCards.length - 1);
        updateSelection();
    } else if (e.key === "ArrowUp") {
        selectedCardIndex = Math.max(selectedCardIndex - 1, -1);
        updateSelection();
    } else if (e.key === "Enter" && selectedCardIndex !== -1) {
        selectCard(filteredCards[selectedCardIndex]);
    }
});

function updateSelection() {
    const items = cardDropdown.querySelectorAll("li");
    items.forEach((li, index) => {
        li.classList.toggle("active", index === selectedCardIndex);
    });
}

document.addEventListener("click", (e) => {
    if (!e.target.closest(".card-select-wrapper")) {
        cardDropdown.classList.remove("open");
    }
});

function updateResult(overrideCardId) {
    const seriesKey = packSeriesSelect.value;
    const cardId = overrideCardId || null;

    if (!seriesKey || !packSeries[seriesKey]) {
        resultContainer.innerHTML =
            '<p id="result-text">Select a pack series to see rarity odds.</p>';
        return;
    }

    const series = packSeries[seriesKey];
    const rarityOdds = {};

    // Calculate odds across pack types
    for (const [packType, packData] of Object.entries(series.packTypes)) {
        const packProb = packData.probability;
        
        // For each rarity, calculate odds of getting at least one in this pack type
        const allRarities = {};
        
        // First collect all rarities
        for (const slot of packData.slots) {
            for (const rarity of Object.keys(slot)) {
                allRarities[rarity] = true;
            }
        }
        
        // Calculate "at least one" for each rarity
        for (const rarity of Object.keys(allRarities)) {
            let noRarityProb = 1;
            
            for (const slot of packData.slots) {
                const slotProb = slot[rarity] || 0;
                noRarityProb *= (1 - slotProb);
            }
            
            const atLeastOneProb = 1 - noRarityProb;
            
            if (!rarityOdds[rarity]) {
                rarityOdds[rarity] = 0;
            }
            rarityOdds[rarity] += packProb * atLeastOneProb;
        }
    }

    let selectedCard = null;
    if (cardId && cardDatabase[cardId]) {
        selectedCard = { id: cardId, ...cardDatabase[cardId] };
    }

    // Define rarity order for consistent display
    const rarityOrder = [
        "oneDiamond",
        "twoDiamond",
        "threeDiamond",
        "fourDiamond",
        "oneStar",
        "twoStar",
        "threeStar",
        "shiny",
        "shinyDouble",
        "crown",
    ];

    let html = '<div class="odds-table">';

    for (const rarity of rarityOrder) {
        if (!(rarity in rarityOdds)) continue;
        
        const odds = rarityOdds[rarity];
        const isSelected =
            selectedCard && selectedCard.rarity === rarity ? " highlighted" : "";

        html += `
      <div class="odds-row${isSelected}">
        <span class="rarity-name">${rarityNames[rarity] || rarity}</span>
        <span class="odds-value">${formatPercent(odds)}</span>
      </div>
    `;
    }

    if (selectedCard) {
        const cardOdds = calculateCardPullOdds(seriesKey, cardId);
        html += `
      <div class="card-odds">
        <p><strong>${selectedCard.name}</strong> is a ${rarityNames[selectedCard.rarity]}</p>
        <p>Chance of pulling this card: <strong>${formatPercent(cardOdds)}</strong></p>
      </div>
    `;
    }

    html += "</div>";

    resultContainer.innerHTML = html;
}

packSeriesSelect.addEventListener("change", () => {
    populateCardDropdown();
    cardSearch.value = "";
    updateResult();
});

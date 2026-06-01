// -----------------------------
// DOM Elements
// -----------------------------
const packSeriesSelect = document.getElementById("pack-series-select");
const cardSearch = document.getElementById("card-search");
const cardDropdown = document.getElementById("card-dropdown");
const resultContainer = document.getElementById("result-container");

// -----------------------------
// Constants / Labels
// -----------------------------
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

// Define display order for rarities
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

// -----------------------------
// Data Helpers
// -----------------------------
// Get card IDs for a given series key (cardDatabase expected to have `series` field)
function getCardsForSeries(seriesKey) {
    return Object.keys(cardDatabase)
        .filter((cardId) => cardDatabase[cardId].series === seriesKey)
        .sort((a, b) => Number(cardDatabase[a].number) - Number(cardDatabase[b].number));
}

// Build counts of how many cards exist per rarity for a series
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

// -----------------------------
// Calculation Helpers
// -----------------------------
function formatPercent(value) {
    return `${(value * 100).toFixed(2)}%`;
}

// Calculate P(at least one) for a single rarity across all slots of one packType
function atLeastOneInPackTypeForRarity(packData, rarity) {
    // packData.slots is an array of slot-prob objects
    let noRarityProb = 1;
    for (const slot of packData.slots) {
        const slotProb = slot[rarity] || 0;
        noRarityProb *= (1 - slotProb);
    }
    return 1 - noRarityProb;
}

// Calculate odds to pull a specific card across pack types and slots
function calculateCardPullOdds(seriesKey, cardId) {
    if (!packSeries[seriesKey] || !cardDatabase[cardId]) return 0;

    const card = cardDatabase[cardId];
    const series = packSeries[seriesKey];
    const rarityCardCounts = buildRarityCardCounts(seriesKey);
    const cardCount = rarityCardCounts[card.rarity] || 1;
    const cardProbWithinRarity = 1 / cardCount;

    let totalOdds = 0;

    for (const [, packData] of Object.entries(series.packTypes)) {
        const packProb = packData.probability;

        // compute probability of at least one of this specific card for this packType
        let noCardProb = 1;
        for (const slot of packData.slots) {
            const rarityOdds = slot[card.rarity] || 0;
            const slotCardOdds = rarityOdds * cardProbWithinRarity;
            noCardProb *= (1 - slotCardOdds);
        }

        const atLeastOneProb = 1 - noCardProb;
        totalOdds += packProb * atLeastOneProb;
    }

    return totalOdds;
}

// -----------------------------
// UI Helpers (rendering / dropdown)
// -----------------------------
let filteredCards = [];
let selectedCardIndex = -1;

function renderCardOptions(cards) {
    cardDropdown.innerHTML = "";

    if (!cards.length) {
        cardDropdown.classList.remove("open");
        return;
    }

    cards.forEach((cardId) => {
        const card = cardDatabase[cardId];
        if (!card) return;
        const li = document.createElement("li");
        li.textContent = `${rarityNames[card.rarity] || ""} ${card.name}`;
        li.dataset.cardId = cardId;
        li.addEventListener("click", () => selectCard(cardId));
        cardDropdown.appendChild(li);
    });

    cardDropdown.classList.add("open");
    selectedCardIndex = -1;
}

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

function selectCard(cardId) {
    const card = cardDatabase[cardId];
    if (!card) return;
    cardSearch.value = `${rarityNames[card.rarity] || ""} ${card.name}`;
    cardSearch.blur();
    cardDropdown.classList.remove("open");
    updateResult(cardId);
}

function updateSelectionUI() {
    const items = cardDropdown.querySelectorAll("li");
    items.forEach((li, index) => {
        li.classList.toggle("active", index === selectedCardIndex);
    });
}

// -----------------------------
// Main Result Rendering
// -----------------------------
// overrideCardId is optional; when provided we show odds for that specific card
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

    // Aggregate "at least one" probabilities per rarity across pack types
    for (const [, packData] of Object.entries(series.packTypes)) {
        const packProb = packData.probability;

        // collect rarities in this packType
        const allRarities = new Set();
        for (const slot of packData.slots) {
            Object.keys(slot).forEach((r) => allRarities.add(r));
        }

        // compute at-least-one for each rarity within this packType
        for (const rarity of allRarities) {
            const atLeastOneProb = atLeastOneInPackTypeForRarity(packData, rarity);
            rarityOdds[rarity] = (rarityOdds[rarity] || 0) + packProb * atLeastOneProb;
        }
    }

    let selectedCard = null;
    if (cardId && cardDatabase[cardId]) {
        selectedCard = { id: cardId, ...cardDatabase[cardId] };
    }

    // Build HTML output in the desired rarity order
    let html = '<div class="odds-table">';
    for (const rarity of rarityOrder) {
        if (!(rarity in rarityOdds)) continue;
        const odds = rarityOdds[rarity];
        const isSelected = selectedCard && selectedCard.rarity === rarity ? " highlighted" : "";
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
                <p><strong>${selectedCard.name}</strong> is a ${rarityNames[selectedCard.rarity] || selectedCard.rarity}</p>
                <p>Chance of pulling this card: <strong>${formatPercent(cardOdds)}</strong></p>
            </div>
        `;
    }

    html += "</div>";
    resultContainer.innerHTML = html;
}

// -----------------------------
// Event Handlers / Init
// -----------------------------
cardSearch.addEventListener("focus", () => {
    if (filteredCards.length > 0) renderCardOptions(filteredCards);
});

cardSearch.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const seriesKey = packSeriesSelect.value;
    const cards = getCardsForSeries(seriesKey);

    if (!query) {
        filteredCards = cards;
        renderCardOptions(cards);
        return;
    }

    filteredCards = cards.filter((cardId) => {
        return cardDatabase[cardId].name.toLowerCase().includes(query);
    });

    renderCardOptions(filteredCards);
});

cardSearch.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
        selectedCardIndex = Math.min(selectedCardIndex + 1, filteredCards.length - 1);
        updateSelectionUI();
    } else if (e.key === "ArrowUp") {
        selectedCardIndex = Math.max(selectedCardIndex - 1, -1);
        updateSelectionUI();
    } else if (e.key === "Enter" && selectedCardIndex !== -1) {
        selectCard(filteredCards[selectedCardIndex]);
    }
});

document.addEventListener("click", (e) => {
    if (!e.target.closest(".card-select-wrapper")) {
        cardDropdown.classList.remove("open");
    }
});

packSeriesSelect.addEventListener("change", () => {
    populateCardDropdown();
    cardSearch.value = "";
    updateResult();
});

// initial render (if desired)
updateResult();

// Clear UI selections on load / when page is restored from BF cache
function clearSelectionsOnLoad() {
    const pack = document.getElementById("pack-series-select");
    const cardInput = document.getElementById("card-search");

    if (pack) pack.selectedIndex = 0;
    if (cardInput) cardInput.value = "";

    // close dropdown if open
    if (window.cardDropdown) window.cardDropdown.classList.remove("open");
    // if you store selection in localStorage, clear it here:
    // localStorage.removeItem("selectedPack");
    // localStorage.removeItem("selectedCardId");

    // re-render
    updateResult();
}

// Normal load
window.addEventListener("DOMContentLoaded", clearSelectionsOnLoad);

// Handle Back/Forward cache restore (browsers may restore form state)
window.addEventListener("pageshow", (e) => {
    if (e.persisted) clearSelectionsOnLoad();
});

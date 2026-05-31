const packSeriesSelect = document.getElementById("pack-series-select");
const cardSelect = document.getElementById("card-select");
const resultContainer = document.getElementById("result-container");

// Pack data: each pack series has per-slot rarity odds and cards
const packSeries = {
  "series-1": {
    name: "Series 1",
    slotOdds: {
      common: 0.70,
      uncommon: 0.20,
      rare: 0.08,
      holoRare: 0.015,
      secretRare: 0.005,
    },
    cards: [
      { id: "pikachu-1", name: "Pikachu", rarity: "rare" },
      { id: "charizard-1", name: "Charizard", rarity: "holoRare" },
      { id: "mewtwo-1", name: "Mewtwo", rarity: "holoRare" },
      { id: "energy-grass", name: "Grass Energy", rarity: "common" },
      { id: "energy-fire", name: "Fire Energy", rarity: "common" },
    ],
  },
  "series-2": {
    name: "Series 2",
    slotOdds: {
      common: 0.65,
      uncommon: 0.22,
      rare: 0.10,
      holoRare: 0.02,
      secretRare: 0.01,
    },
    cards: [
      { id: "blastoise-2", name: "Blastoise", rarity: "holoRare" },
      { id: "venusaur-2", name: "Venusaur", rarity: "holoRare" },
      { id: "dragonite-2", name: "Dragonite", rarity: "rare" },
      { id: "energy-water", name: "Water Energy", rarity: "common" },
      { id: "energy-electric", name: "Electric Energy", rarity: "common" },
    ],
  },
  "series-3": {
    name: "Series 3",
    slotOdds: {
      common: 0.60,
      uncommon: 0.25,
      rare: 0.12,
      holoRare: 0.025,
      secretRare: 0.005,
    },
    cards: [
      { id: "alakazam-3", name: "Alakazam", rarity: "holoRare" },
      { id: "machamp-3", name: "Machamp", rarity: "holoRare" },
      { id: "golem-3", name: "Golem", rarity: "rare" },
      { id: "energy-psychic", name: "Psychic Energy", rarity: "common" },
      { id: "energy-fighting", name: "Fighting Energy", rarity: "common" },
    ],
  },
};

const rarityNames = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  holoRare: "Holo Rare",
  secretRare: "Secret Rare",
};

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function calculateAtLeastOne(slotOdds) {
  // Probability of getting at least one card of a rarity
  // in a 5-card pack, given the per-slot probability
  const slotsInPack = 5;
  const noCardsProb = Math.pow(1 - slotOdds, slotsInPack);
  return 1 - noCardsProb;
}

function populateCardDropdown() {
  const seriesKey = packSeriesSelect.value;
  cardSelect.innerHTML = '<option value="">-- Choose a card --</option>';

  if (!seriesKey || !packSeries[seriesKey]) {
    return;
  }

  const series = packSeries[seriesKey];
  series.cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.id;
    option.textContent = card.name;
    cardSelect.appendChild(option);
  });
}

function updateResult() {
  const seriesKey = packSeriesSelect.value;
  const cardId = cardSelect.value;

  if (!seriesKey || !packSeries[seriesKey]) {
    resultContainer.innerHTML =
      '<p id="result-text">Select a pack series to see rarity odds.</p>';
    return;
  }

  const series = packSeries[seriesKey];
  const odds = series.slotOdds;

  // If a specific card is selected, highlight it
  let selectedCard = null;
  if (cardId) {
    selectedCard = series.cards.find((c) => c.id === cardId);
  }

  // Build results HTML
  let html = '<div class="odds-table">';

  for (const [rarity, slotOdds] of Object.entries(odds)) {
    const atLeastOne = calculateAtLeastOne(slotOdds);
    const isSelected =
      selectedCard && selectedCard.rarity === rarity ? " highlighted" : "";

    html += `
      <div class="odds-row${isSelected}">
        <span class="rarity-name">${rarityNames[rarity]}</span>
        <span class="odds-value">${formatPercent(atLeastOne)}</span>
      </div>
    `;
  }

  if (selectedCard) {
    html += `
      <div class="card-odds">
        <p><strong>${selectedCard.name}</strong> is a ${rarityNames[selectedCard.rarity]}</p>
        <p>Chance of pulling at least one: <strong>${formatPercent(calculateAtLeastOne(odds[selectedCard.rarity]))}</strong></p>
      </div>
    `;
  }

  html += "</div>";

  resultContainer.innerHTML = html;
}

packSeriesSelect.addEventListener("change", () => {
  populateCardDropdown();
  cardSelect.value = "";
  updateResult();
});

cardSelect.addEventListener("change", updateResult);

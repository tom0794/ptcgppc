const setsByKey = {
    a1c: a1c,
    a1m: a1m,
    a1p: a1p,
    a1a: a1a,
    a2d: a2d,
    a2p: a2p,
    // add more sets here
};

const cardDatabase = Object.entries(setsByKey).reduce((result, [setKey, setCards]) => {
    Object.entries(setCards).forEach(([number, card]) => {
        const cardId = `${setKey}-${number}`;
        result[cardId] = {
            ...card,
            number,
            series: setKey,
        };
    });
    return result;
}, {});

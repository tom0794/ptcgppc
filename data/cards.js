const setsByKey = {
    a1c: a1c,
    a1m: a1m,
    a1p: a1p,
    a1a: a1a,
    a2d: a2d,
    a2p: a2p,
    a2a: a2a,
    a2b: a2b,
    a3l: a3l,
    a3s: a3s,
    a3a: a3a,
    a3b: a3b,
    a4h: a4h,
    a4l: a4l,
    a4a: a4a,
    b1al: b1al,
    b1bl: b1bl,
    b1gy: b1gy,
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

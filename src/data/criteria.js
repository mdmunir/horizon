function criteria(name, alt, elo, age, isGlobal) {
    return {
        name,
        alt: alt || 0.0,
        elo: elo || 0.0,
        age: age || 0.0,
        isGlobal: !!isGlobal,
    }
}
const m = [
    criteria('WH'),
    criteria('IR MABIMS', 3, 6.4),
    //criteria('IR MABIMS LAMA', 2, 3, 8),
    criteria('KHGT', 5, 8, 0, true),
];

export default m;
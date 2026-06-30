export default [
    {
        title: 'Ephemeris', icon: 'mdi-table-clock', 
        items: [
            { title: 'Sun', href: '/ephemeris/sun', icon: 'mdi-white-balance-sunny' },
            { title: 'Moon', href: '/ephemeris/moon', icon: 'mdi-moon-waxing-crescent' },
        ]
    },
    {
        title: 'Lunar Phase', icon: 'mdi-moon-waxing-crescent', 
        items: [
            { title: 'Hilal', href: '/lunar-phase/hilal', icon: 'mdi-moon-waxing-crescent' },
            { title: 'Animation', href: '/lunar-phase/animation', icon: 'mdi-play' },
        ]
    },
    { title: 'Solar Eclipse', icon: 'mdi-moon-new',
        items: [
            { title: 'List', href: '/solar-eclipse/list', icon: 'mdi-table'},
            { title: 'Search', href: '/solar-eclipse/search', icon: 'mdi-magnify'},
        ]
    },
    { title: 'About', href: '/about', icon: 'mdi-information' },
];
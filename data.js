// Content for the map. Coordinates are [longitude, latitude].
// Some relations are not tied to one spot (a law, a tax rate); those are anchored
// to a representative place and marked anchor: true.

window.KEI = {
  car: { coord: [135.6487, 34.8162], place: 'Hirakata, Osaka' },

  categories: {
    HIST: { num: '01', name: 'Histories' },
    GEO:  { num: '02', name: 'Geographies' },
    INF:  { num: '03', name: 'Infrastructures' },
    SOC:  { num: '04', name: 'Social relations' },
    HUM:  { num: '05', name: 'Human realities' },
    ENV:  { num: '06', name: 'Environmental realities' }
  },

  threads: {
    STATE:  { name: 'State-made smallness', color: '#5b9bff', chain: ['H1','H3','I1','Hu2','G1','Hu4'],
      insight: 'A rule written for postwar scarcity still decides what fits on a Hirakata street and in a household budget.' },
    DEPOP:  { name: 'Depopulation', color: '#ff9f43', chain: ['G2','S2','I2','I3','Hu1','S1'],
      insight: 'The kei fills the gap left by buses. As pumps and drivers disappear, the gap reopens: displacement without moving.' },
    CARBON: { name: 'Carbon & energy', color: '#2ed3b7', chain: ['H2','E1','I3','E2','I4','E3'],
      insight: 'Fuel-saving kei help close rural gas stations; the electric fix leans on the grid and on mines far away. An unintended-consequence loop.' },
    CIRC:   { name: 'Circulation & afterlives', color: '#d07bff', chain: ['G3','H4','S3','Hu3','E4','G4','S4'],
      insight: 'Built in Kansai, certified (and falsely tested) by the state, revived abroad as a cult object, and restricted again.' }
  },

  nodes: [
    // HISTORIES
    { id:'H1', cat:'HIST', title:'1949 · A class invented by the state', place:'Kasumigaseki, Tokyo', anchor:true, coord:[139.7505,35.6745], threads:['STATE'],
      body:'Postwar Japan creates the “light vehicle” class to put a war-damaged country on wheels and grow its car industry.' },
    { id:'H2', cat:'HIST', title:'1955–1976 · 360cc to 550cc', place:'Kasumigaseki, Tokyo', anchor:true, coord:[139.7440,35.6712], threads:['STATE','CARBON'],
      body:'As 1970s emissions rules tighten, sales collapse. The state widens the box rather than let the class die.' },
    { id:'H3', cat:'HIST', title:'1990 / 1998 · The box today', place:'Kasumigaseki, Tokyo', anchor:true, coord:[139.7470,35.6790], threads:['STATE'],
      body:'660cc, 3.4 m long, 1.48 m wide. Every kei on a Hirakata street is designed backwards from these numbers.' },
    { id:'H4', cat:'HIST', title:'2023 · The Daihatsu scandal', place:'Daihatsu headquarters, Ikeda, Osaka', coord:[135.4330,34.8100], threads:['CIRC','STATE'],
      body:'Osaka-based Daihatsu admits falsified safety tests on 64 models, going back decades. All four Japanese plants halt.' },

    // GEOGRAPHIES
    { id:'G1', cat:'GEO', title:'Hirakata', place:'Hirakata, Osaka', coord:[135.6440,34.8182], threads:['STATE'],
      body:'Suburban lanes, tight parking slots and Keihan-line commuters: the kei fits spaces a regular car can’t.' },
    { id:'G2', cat:'GEO', title:'Rural Japan', place:'Shimukappu, Hokkaido', coord:[142.6300,43.0300], threads:['DEPOP'],
      body:'Where buses thin out and the young leave, households keep two or three kei as their public transport. In Shimukappu, residents reopened the village’s only gas station.' },
    { id:'G3', cat:'GEO', title:'Kansai factories', place:'Daihatsu Kyoto plant, Ōyamazaki', coord:[135.6880,34.9030], threads:['CIRC'],
      body:'Daihatsu’s head plant in Ikeda (Osaka) and plants in Kyoto and Shiga: kei are built a short drive from Hirakata.' },
    { id:'G4', cat:'GEO', title:'United States', place:'Augusta, Maine', coord:[-69.7795,44.3106], threads:['CIRC'],
      body:'A federal 25-year rule lets old kei trucks in; states such as Maine, Rhode Island and Massachusetts push back.' },

    // INFRASTRUCTURES
    { id:'I1', cat:'INF', title:'The yellow-plate tax', place:'Hirakata City Hall (the light-vehicle tax is a city tax)', coord:[135.6508,34.8148], threads:['STATE'],
      body:'Kei pay a flat ¥10,800 a year in light-vehicle tax. Regular cars start around ¥25,000.' },
    { id:'I2', cat:'INF', title:'Parking proof', place:'Totsukawa, Nara (rural Kii peninsula)', anchor:true, coord:[135.7960,33.9890], threads:['STATE','DEPOP'],
      body:'In most rural areas kei skip the garage certificate regular cars need: ownership made easier by paperwork.' },
    { id:'I3', cat:'INF', title:'Gas stations', place:'Susami, Wakayama', coord:[135.4950,33.5520], threads:['DEPOP','CARBON'],
      body:'About 60,000 in 1994, about 28,000 by 2022. In 282 municipalities the nearest pump is 15 km or more away. Susami’s town government bought and reopened a closed station.' },
    { id:'I4', cat:'INF', title:'Chargers & the grid', place:'Hirakata, Osaka', anchor:true, coord:[135.6545,34.8205], threads:['CARBON'],
      body:'Kei EVs mostly charge at home, tying the small car to the electricity grid and the fuels behind it.' },

    // SOCIAL RELATIONS
    { id:'S1', cat:'SOC', title:'Households', place:'Hirakata, Osaka', anchor:true, coord:[135.6418,34.8128], threads:['DEPOP'],
      body:'The everyday car: shopping, school runs, trips to the clinic, visits to aging parents.' },
    { id:'S2', cat:'SOC', title:'Farmers & small trades', place:'Kinokawa, Wakayama', anchor:true, coord:[135.3800,34.2700], threads:['DEPOP'],
      body:'Kei trucks like the Hijet and Carry haul crops, tools and stock: the workhorse of rural livelihoods.' },
    { id:'S3', cat:'SOC', title:'Factory & test workers', place:'Daihatsu plant, Ryūō, Shiga', coord:[136.1150,35.0600], threads:['CIRC'],
      body:'Investigators traced Daihatsu’s fraud to tight development schedules; about 9,000 jobs sat in limbo during the shutdown.' },
    { id:'S4', cat:'SOC', title:'Enthusiasts abroad', place:'Austin, Texas', anchor:true, coord:[-97.7431,30.2672], threads:['CIRC'],
      body:'US hobbyists turn a Japanese work truck into a cult object and organise against state registration bans. Texas formally recognised kei trucks in 2025.' },

    // HUMAN REALITIES
    { id:'Hu1', cat:'HUM', title:'Aging drivers', place:'Rural Shimane', anchor:true, coord:[132.8500,35.2500], threads:['DEPOP'],
      body:'Elders who give up their licence lose the kei and depend on a shrinking number of neighbours who still drive.' },
    { id:'Hu2', cat:'HUM', title:'Affordability', place:'Hirakata, Osaka', anchor:true, coord:[135.6565,34.8140], threads:['STATE'],
      body:'About 34.5% of new passenger cars sold in Japan (FY2025): the cheapest way to stay mobile.' },
    { id:'Hu3', cat:'HUM', title:'Who carries the risk?', place:'Hirakata, Osaka', anchor:true, coord:[135.6398,34.8198], threads:['CIRC','STATE'],
      body:'A light car, a cheap car, and falsified crash tests: safety margins fall on those who can’t afford a bigger car.' },
    { id:'Hu4', cat:'HUM', title:'Space as inequality', place:'Hirakata, Osaka', anchor:true, coord:[135.6472,34.8222], threads:['STATE'],
      body:'In dense suburbs, who has room for a car at all? The kei’s size answers scarce, expensive space.' },

    // ENVIRONMENTAL REALITIES
    { id:'E1', cat:'ENV', title:'Fuel efficiency', place:'Hirakata, Osaka', anchor:true, coord:[135.6525,34.8102], threads:['CARBON','DEPOP'],
      body:'Small engines and light bodies cut gasoline use: one reason Japan’s fuel demand and its gas stations both shrink.' },
    { id:'E2', cat:'ENV', title:'The kei EV', place:'Mizushima, Kurashiki, Okayama', coord:[133.7400,34.5200], threads:['CARBON'],
      body:'Nissan Sakura: 20 kWh battery, about 180 km of range, Japan’s best-selling EV four years running.' },
    { id:'E3', cat:'ENV', title:'Batteries elsewhere', place:'Salar de Atacama, Chile (also Australia, DR Congo)', anchor:true, coord:[-68.2500,-23.5000], threads:['CARBON','CIRC'],
      body:'Electrifying the kei moves extraction to the lithium, nickel and cobalt mines of other places.' },
    { id:'E4', cat:'ENV', title:'Second lives', place:'Port of Osaka', anchor:true, coord:[135.4300,34.6450], threads:['CIRC','CARBON'],
      body:'Old kei are scrapped, recycled or shipped abroad, taking their emissions and safety standards with them.' }
  ],

  themes: {
    ANTH: { name:'Anthropocene', head:'A small car, a planetary system',
      body:'Made to save fuel and space, the kei now carries Japan’s EV transition, and with it a battery supply chain that reaches mines far from Hirakata. Efficiency at one scale produces new extraction at another.',
      q:'What happens when the “efficient” choice reshapes the infrastructure around it?', threads:['CARBON','CIRC'] },
    DISP: { name:'Displacement', head:'Who is left without mobility?',
      body:'Depopulation, closing gas stations and aging drivers turn a cheap car into the last link to shops, clinics and family, or into a missing one. People are displaced without ever moving house.',
      q:'Who is displaced when the kei is the only way to stay put?', threads:['DEPOP','STATE'] }
  },

  // The guided story. view: camera; show: what to highlight.
  chapters: [
    { kicker:'ASSIGNMENT 3 · MAPPING INFRASTRUCTURE', title:'One small car, a whole world of relations',
      text:'This map follows the kei car, Japan’s smallest legal class of car, from a street in Hirakata out to factories, ministries, villages, ports and mines. Markers are relations. The glowing lines between them are <em>relations of relations</em>.',
      view:{ center:[150,25], zoom:1.6, pitch:0, bearing:0 } },
    { kicker:'THE OBJECT', title:'A kei car in Hirakata',
      text:'At most 3.4 m long, 1.48 m wide and 660cc, with a yellow plate. In Hirakata’s narrow suburban lanes it is so ordinary it disappears into the street. Here, the car is treated as infrastructure.',
      view:{ center:[135.6487,34.8162], zoom:16.4, pitch:64, bearing:-28 }, photo:true },
    { kicker:'SCALE 1 · THE STREET', title:'Hirakata: where the threads touch the ground',
      text:'Taxes paid at city hall, home chargers, school runs, scarce parking, budgets and bodies. The towers mark relations that play out right here.',
      view:{ center:[135.6482,34.8165], zoom:14.6, pitch:58, bearing:20 }, show:['G1','I1','I4','S1','Hu2','Hu3','Hu4','E1'] },
    { kicker:'SCALE 2 · THE REGION', title:'Kansai: built a short drive away',
      text:'Daihatsu’s headquarters in Ikeda and its plants in Kyoto and Shiga produce kei a short drive from Hirakata. In 2023, falsified safety tests stopped every line. Used kei leave through the Port of Osaka.',
      view:{ center:[135.72,34.86], zoom:9.2, pitch:45, bearing:-10 }, show:['G3','H4','S3','E4'] },
    { kicker:'SCALE 3 · THE STATE', title:'Tokyo: the ministries draw the box',
      text:'The kei exists because the state defined it in 1949, and kept redefining it. Size, engine and tax rules written in Kasumigaseki shape every kei on every street.',
      view:{ center:[139.7472,35.6750], zoom:14.4, pitch:55, bearing:30 }, show:['H1','H2','H3'] },
    { kicker:'SCALE 4 · THE NATION', title:'Rural Japan: where the kei is the bus',
      text:'In depopulating towns, kei replace thinning buses, kei trucks carry harvests, and gas stations close. Elders who stop driving lose their link. Kei EVs are built in Mizushima.',
      view:{ center:[137.2,37.2], zoom:4.6, pitch:30, bearing:0 }, show:['G2','S2','I2','I3','Hu1','E2'] },
    { kicker:'SCALE 5 · THE PLANET', title:'Afterlives and extraction',
      text:'Old kei trucks become cult objects in the US, where states fight over whether they belong on the road. Electric kei pull lithium, nickel and cobalt from mines on other continents.',
      view:{ center:[-155,22], zoom:1.35, pitch:0, bearing:0 }, show:['G4','S4','E3'] },
    { thread:'STATE' }, { thread:'DEPOP' }, { thread:'CARBON' }, { thread:'CIRC' },
    { theme:'ANTH', view:{ center:[-170,5], zoom:1.3, pitch:0, bearing:0 } },
    { theme:'DISP', view:{ center:[136,36], zoom:4.8, pitch:35, bearing:0 } }
  ],

  sources: [
    ['Toyo Keizai (2026): kei share of new passenger cars, FY2025','https://toyokeizai.net/articles/-/954630?display=b'],
    ['Nippon.com: gas stations nearly halved; municipalities 15 km+ from a pump','https://nippon.com/en/japan-data/h01830'],
    ['Yomiuri: ~60,000 stations in FY1994; Susami reopens a closed station','https://www.inkl.com/news/prevent-decline-of-local-communities-amid-falling-number-of-gas-stations'],
    ['Reuters: Shimukappu residents reopen the village gas station','https://hydrocarbonprocessing.com/news/2017/09/japans-rural-elderly-reverse-gas-station-closures/'],
    ['Hamamatsu City: light vehicle tax table (¥10,800)','https://www.city.hamamatsu.shizuoka.jp/documents/12791/english.pdf'],
    ['Japan Today: rural households with two or three kei','https://japantoday.com/category/features/kuchikomi/proposal-to-triple-taxes-on-k-cars-raises-concerns-among-rural-drivers'],
    ['Wikipedia: kei car regulations 1949–1998; rural parking exemption','https://en.wikipedia.org/wiki/Kei_car'],
    ['Carscoops: Nissan Sakura, best-selling EV four years running','https://www.carscoops.com/2026/04/nissan-sakura-facelift/'],
    ['CleanTechnica: Sakura 20 kWh battery, 180 km range','https://cleantechnica.com/2026/07/19/nissan-sakura-keeps-the-crown-as-japans-best-selling-ev/'],
    ['CNN: Daihatsu halts production after decades of falsified tests','https://ktvz.com/?p=1276364'],
    ['RNZ: 64 models, 9,000 workers, four plants','https://www.rnz.co.nz/news/top/505581/daihatsu-pauses-production-over-safety-scandal'],
    ['AP / TechXplore: Daihatsu plant in Ryūō, Shiga','https://techxplore.com/news/2023-12-toyota-small-car-maker-daihatsu.amp'],
    ['Claims Journal: fraud blamed on tight development deadlines','https://www.claimsjournal.com/news/international/2023/12/27/321172.htm'],
    ['GearJunkie: Maine and Rhode Island restrictions','https://gearjunkie.com/?p=124070'],
    ['The Autopian: Massachusetts and the 25-year rule','https://www.theautopian.com/massachusetts-reviews-its-ridiculous-japanese-car-ban-after-enthusiasts-fight-back/'],
    ['Japan Car Direct: Texas SB 1816 recognises kei trucks (2025)','https://www.japancardirect.com/?p=38986'],
    ['Social Inclusion (2017): mobility of elderly people in rural Shimane','https://cogitatiopress.com/socialinclusion/article/download/1125/685'],
    ['Map data © OpenStreetMap contributors · tiles by OpenFreeMap / OpenMapTiles','https://openfreemap.org/']
  ]
};

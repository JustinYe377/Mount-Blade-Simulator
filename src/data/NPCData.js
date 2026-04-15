// ============================================================
// NPCData.js — Static NPC definitions for settlements
// Depends on: config.js (GOODS)
// ============================================================

const NPC_NAMES = [
  'Aldric','Brynn','Calder','Dwyn','Erwan','Fenna','Gareth','Hilda',
  'Idris','Joryn','Kira','Lorcan','Mira','Nessa','Oswin','Petra',
  'Quinn','Rolf','Sela','Tavin','Ursa','Varn','Wren','Yorick',
  'Zara','Beric','Calla','Dravan','Elia','Farrow','Gwyn','Hadra',
];

// Roles assigned per settlement type
const NPC_ROLES_BY_TYPE = {
  village: ['Elder', 'Farmer', 'Herbalist'],
  town:    ['Innkeeper', 'Merchant', 'Guard Captain', 'Blacksmith'],
  castle:  ['Constable', 'Armorer', 'Steward'],
  city:    ['Guild Master', 'Weapons Master', 'Steward', 'Innkeeper', 'Merchant'],
};

// Idle dialogue lines per role (shown when no quest context)
const ROLE_DIALOGUES = {
  'Elder':          [
    "The seasons have been harsh. Our village barely manages.",
    "We produce what we can, but the roads aren't safe enough.",
    "Our young ones leave for the cities. Hard to blame them.",
  ],
  'Farmer':         [
    "Good harvest this year, if the rains hold.",
    "Been sending goods to the market in town.",
    "Hard times for honest folk with bandits on every road.",
  ],
  'Herbalist':      [
    "The forest holds many secrets if you know where to look.",
    "I trade in remedies and poultices. Good for what ails you.",
    "Stay healthy out there, traveller. Roads are dangerous.",
  ],
  'Innkeeper':      [
    "Welcome! A warm fire and a cold drink. Best in the region.",
    "Travellers bring interesting news. You hear about the wars?",
    "Business is good when the roads are safe. These days... less so.",
  ],
  'Merchant':       [
    "Supply and demand — that's all there is to it.",
    "Prices have been swinging wildly this season.",
    "A savvy trader can make a fortune if they know the routes.",
  ],
  'Guard Captain':  [
    "We keep the peace here. Mostly.",
    "Bandit activity has been troublesome on the eastern road.",
    "Report any suspicious movement outside the walls.",
  ],
  'Blacksmith':     [
    "A good blade is worth its weight in gold.",
    "Iron is getting scarce. Drives up my costs something fierce.",
    "Soldiers keep me busy these days. Not complaining.",
  ],
  'Constable':      [
    "The castle's defences are in good order.",
    "We've repelled two raids this month alone.",
    "The lord trusts me to hold these walls in their absence.",
  ],
  'Armorer':        [
    "Quality steel makes all the difference in battle.",
    "I outfit the garrison. Always more work than hours in the day.",
    "You look like you've seen some fighting. That armour shows it.",
  ],
  'Steward':        [
    "The accounts must balance, or the keep falls.",
    "Prosperity flows from good management and reliable trade.",
    "I coordinate supplies for the entire region.",
  ],
  'Guild Master':   [
    "Commerce is the lifeblood of civilisation.",
    "Our guild sets the standards for trade in this city.",
    "We protect the interests of every merchant who passes through.",
  ],
  'Weapons Master': [
    "Discipline. That's what separates soldiers from warriors.",
    "I train the garrison here. They're improving.",
    "Your footwork could use some work, I suspect.",
  ],
};

// Role portrait colours (used to tint NPC icon in panel)
const ROLE_COLORS = {
  'Elder':          '#c8a060',
  'Farmer':         '#88bb44',
  'Herbalist':      '#55bb88',
  'Innkeeper':      '#cc9944',
  'Merchant':       '#f0c860',
  'Guard Captain':  '#6699cc',
  'Blacksmith':     '#aa7755',
  'Constable':      '#7799cc',
  'Armorer':        '#9988aa',
  'Steward':        '#aabbcc',
  'Guild Master':   '#ddbb44',
  'Weapons Master': '#cc4444',
};

// Which roles can offer quests
const QUEST_GIVER_ROLES = new Set([
  'Elder', 'Merchant', 'Guard Captain', 'Innkeeper', 'Constable', 'Guild Master', 'Steward',
]);

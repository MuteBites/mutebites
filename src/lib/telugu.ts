/**
 * English → Telugu for students' names (ScriptName's Sirivennela face).
 * Names are typed in English, so this is a best guess: common Telugu name
 * words come from a small dictionary (English spelling can't tell "Naga"
 * నాగ from "Naga" నగ), anything else goes through phonetic rules. Add a
 * word to NAMES when a common one comes out wrong.
 */

const NAMES: Record<string, string> = {
  naga: "నాగ",
  adithya: "ఆదిత్య",
  aditya: "ఆదిత్య",
  pilli: "పిల్లి",
  sai: "సాయి",
  sri: "శ్రీ",
  shri: "శ్రీ",
  krishna: "కృష్ణ",
  lakshmi: "లక్ష్మి",
  venkata: "వెంకట",
  venkat: "వెంకట్",
  reddy: "రెడ్డి",
  kumar: "కుమార్",
  rao: "రావు",
  naidu: "నాయుడు",
  chowdary: "చౌదరి",
  choudary: "చౌదరి",
  varma: "వర్మ",
  sharma: "శర్మ",
  harsha: "హర్ష",
  rishi: "రిషి",
  teja: "తేజ",
  ravi: "రవి",
  rama: "రామ",
  ram: "రామ్",
  raju: "రాజు",
  surya: "సూర్య",
  siva: "శివ",
  shiva: "శివ",
  ganesh: "గణేష్",
  mahesh: "మహేష్",
  suresh: "సురేష్",
  ramesh: "రమేష్",
  rajesh: "రాజేష్",
  naresh: "నరేష్",
  dinesh: "దినేష్",
  kiran: "కిరణ్",
  priya: "ప్రియ",
  divya: "దివ్య",
  sravani: "శ్రావణి",
  swathi: "స్వాతి",
  swati: "స్వాతి",
  anusha: "అనూష",
  bhavani: "భవాని",
  bhavana: "భావన",
  deepika: "దీపిక",
  keerthi: "కీర్తి",
  keerthana: "కీర్తన",
  manoj: "మనోజ్",
  vamsi: "వంశీ",
  charan: "చరణ్",
  prasad: "ప్రసాద్",
  kalyan: "కళ్యాణ్",
  pavan: "పవన్",
  praveen: "ప్రవీణ్",
  naveen: "నవీన్",
  nikhil: "నిఖిల్",
  rahul: "రాహుల్",
  abhishek: "అభిషేక్",
  akhil: "అఖిల్",
  ajay: "అజయ్",
  vijay: "విజయ్",
  sandeep: "సందీప్",
  srikanth: "శ్రీకాంత్",
  harish: "హరీష్",
  gopal: "గోపాల్",
  murali: "మురళి",
  chandra: "చంద్ర",
  mohan: "మోహన్",
  sekhar: "శేఖర్",
  shekar: "శేఖర్",
  babu: "బాబు",
  devi: "దేవి",
  rani: "రాణి",
  anjali: "అంజలి",
  pooja: "పూజ",
  sneha: "స్నేహ",
  meghana: "మేఘన",
  harika: "హారిక",
  hari: "హరి",
  vasu: "వాసు",
  tarun: "తరుణ్",
  arjun: "అర్జున్",
  karthik: "కార్తీక్",
  karthikeya: "కార్తికేయ",
  yashwanth: "యశ్వంత్",
  jaswanth: "జశ్వంత్",
  hemanth: "హేమంత్",
  sumanth: "సుమంత్",
  prakash: "ప్రకాష్",
  satya: "సత్య",
  sathya: "సత్య",
  nithin: "నితిన్",
  nitin: "నితిన్",
  ashok: "అశోక్",
  anil: "అనిల్",
  sunil: "సునీల్",
  srinivas: "శ్రీనివాస్",
  srinivasa: "శ్రీనివాస",
  balaji: "బాలాజీ",
  raghu: "రఘు",
  gowtham: "గౌతమ్",
  gautham: "గౌతమ్",
  vishnu: "విష్ణు",
  manikanta: "మణికంఠ",
  durga: "దుర్గ",
  geetha: "గీత",
  sita: "సీత",
  sitha: "సీత",
  madhu: "మధు",
  mounika: "మౌనిక",
  sowmya: "సౌమ్య",
  bhargav: "భార్గవ్",
  bhargavi: "భార్గవి",
  chaitanya: "చైతన్య",
  eswar: "ఈశ్వర్",
  ishwar: "ఈశ్వర్",
  uday: "ఉదయ్",
  om: "ఓం",
};

// Longest match first. Consonants: [base]; vowels: [independent, sign].
const CONSONANTS: [string, string][] = [
  ["ksh", "క్ష"],
  ["chh", "ఛ"],
  ["shh", "ష"],
  ["kh", "ఖ"],
  ["gh", "ఘ"],
  ["ch", "చ"],
  ["jh", "ఝ"],
  ["th", "త"],
  ["dh", "ద"],
  ["ph", "ఫ"],
  ["bh", "భ"],
  ["sh", "ష"],
  ["k", "క"],
  ["g", "గ"],
  ["c", "క"],
  ["j", "జ"],
  ["t", "ట"],
  ["d", "ద"],
  ["n", "న"],
  ["p", "ప"],
  ["f", "ఫ"],
  ["b", "బ"],
  ["m", "మ"],
  ["y", "య"],
  ["r", "ర"],
  ["l", "ల"],
  ["v", "వ"],
  ["w", "వ"],
  ["s", "స"],
  ["h", "హ"],
  ["z", "జ"],
  ["x", "క్స"],
  ["q", "క"],
];
const VOWELS: [string, string, string][] = [
  ["aa", "ఆ", "ా"],
  ["ai", "ఐ", "ై"],
  ["au", "ఔ", "ౌ"],
  ["ee", "ఈ", "ీ"],
  ["ii", "ఈ", "ీ"],
  ["oo", "ఊ", "ూ"],
  ["ou", "ఔ", "ౌ"],
  ["uu", "ఊ", "ూ"],
  ["ow", "ఔ", "ౌ"],
  ["a", "అ", ""],
  ["e", "ఏ", "ే"],
  ["i", "ఇ", "ి"],
  ["o", "ఓ", "ో"],
  ["u", "ఉ", "ు"],
];
const VIRAMA = "్";

function match<T extends [string, ...string[]]>(table: T[], s: string, i: number): T | undefined {
  return table.find(([latin]) => s.startsWith(latin, i));
}

/** Phonetic fallback for a word not in NAMES. */
function phonetic(word: string): string {
  let out = "";
  let i = 0;
  let afterConsonant = false;
  while (i < word.length) {
    const v = match(VOWELS, word, i);
    if (v) {
      const next = i + v[0].length;
      // e / o before two consonants are short (రెడ్డి, కొండ).
      const twoConsonants = !!match(CONSONANTS, word, next) && !match(VOWELS, word, next + 1) && next + 1 < word.length;
      const short = (v[0] === "e" || v[0] === "o") && twoConsonants;
      const forms: [string, string] = short ? (v[0] === "e" ? ["ఎ", "ె"] : ["ఒ", "ొ"]) : [v[1], v[2]];
      out += afterConsonant ? forms[1] : forms[0];
      i = next;
      afterConsonant = false;
      // A lone "h" after a vowel and before a consonant is silent (John).
      if (word[i] === "h" && i + 1 < word.length && !match(VOWELS, word, i + 1)) i++;
      continue;
    }
    const c = match(CONSONANTS, word, i);
    if (c) {
      // "n" / "m" before another consonant is usually the anusvara (సందీప్).
      const next = i + c[0].length;
      const following = match(CONSONANTS, word, next);
      if (
        (c[0] === "n" || c[0] === "m") &&
        !afterConsonant &&
        i > 0 &&
        following &&
        !"yrlvhnm".includes(following[0][0])
      ) {
        out += "ం";
        i = next;
        continue;
      }
      if (afterConsonant) out += VIRAMA;
      out += c[1];
      i = next;
      afterConsonant = true;
      continue;
    }
    i++; // anything else (a hyphen, an apostrophe) is skipped
  }
  // A name ending on a consonant gets the virama (కిరణ్).
  if (afterConsonant) out += VIRAMA;
  return out;
}

/** "Naga Adithya Pilli" → "నాగ ఆదిత్య పిల్లి". */
export function toTelugu(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      const key = word.toLowerCase().replace(/[^a-z]/g, "");
      if (!key) return word;
      return NAMES[key] ?? phonetic(key);
    })
    .join(" ");
}

/**
 * Splits Telugu into aksharas (one written syllable: consonants joined by
 * the virama, then a vowel sign and any ం / ః), so each can be drawn as a
 * unit without breaking the conjunct shapes.
 */
export function aksharas(text: string): string[] {
  return text.match(/(?:[క-హ]్)*[అ-ఔక-హ][ా-ౌౕౖ]?్?[ఁ-ః]?|./gu) ?? [];
}

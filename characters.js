// Dynamic HSK vocabulary loader
let CHARACTER_DECKS = {
  "HSK 1": [],
  "HSK 2": [],
  "HSK 3": [],
  "HSK 4": [],
  "HSK 5": [],
  "HSK 6": []
};

// Loading state
let isLoading = false;
let loadedLevels = new Set();

// Base URL for the HSK vocabulary repository
const HSK_BASE_URL = 'https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/exclusive/new/';

// Function to convert HSK data format to our app format
function convertHSKEntry(entry) {
  // HSK format: { simplified: "你", traditional: "你", pinyin: "nǐ", definitions: ["you"] }
  // Our format: { char: "你", pinyin: "nǐ", meaning: "you", exampleZh: "你好吗？", exampleEn: "How are you?" }
  
  const char = entry.simplified || entry.traditional;
  const pinyin = entry.pinyin || '';
  const meaning = Array.isArray(entry.definitions) ? entry.definitions.join('; ') : (entry.definitions || '');
  
  // Generate simple example sentences (you can enhance this logic)
  const exampleZh = generateExampleZh(char, pinyin);
  const exampleEn = generateExampleEn(char, meaning);
  
  return {
    char,
    pinyin,
    meaning,
    exampleZh,
    exampleEn
  };
}

// Simple example sentence generator (you can make this more sophisticated)
function generateExampleZh(char, pinyin) {
  const commonPatterns = {
    '我': '我是学生。',
    '你': '你好吗？',
    '他': '他很好。',
    '她': '她是老师。',
    '中': '中国很大。',
    '国': '美国在哪里？',
    '人': '这个人很好。',
    '学': '我学中文。',
    '好': '今天天气很好。',
    '大': '这个房子很大。'
  };
  
  return commonPatterns[char] || `这是${char}。`;
}

function generateExampleEn(char, meaning) {
  const commonPatterns = {
    '我': 'I am a student.',
    '你': 'How are you?',
    '他': 'He is fine.',
    '她': 'She is a teacher.',
    '中': 'China is big.',
    '国': 'Where is America?',
    '人': 'This person is good.',
    '学': 'I study Chinese.',
    '好': 'The weather is good today.',
    '大': 'This house is big.'
  };
  
  return commonPatterns[char] || `This is ${meaning}.`;
}

// Function to load HSK level data
async function loadHSKLevel(level) {
  if (loadedLevels.has(level) || isLoading) {
    return CHARACTER_DECKS[`HSK ${level}`];
  }
  
  isLoading = true;
  
  try {
    console.log(`Loading HSK ${level} vocabulary...`);
    const response = await fetch(`${HSK_BASE_URL}${level}.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch HSK ${level}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Loaded ${data.length} words for HSK ${level}`);
    
    // Convert to our format and filter for single characters only
    const convertedEntries = data
      .filter(entry => {
        const char = entry.simplified || entry.traditional;
        return char && char.length === 1; // Only single characters for writing practice
      })
      .map(convertHSKEntry);
    
    CHARACTER_DECKS[`HSK ${level}`] = convertedEntries;
    loadedLevels.add(level);
    
    // Dispatch custom event to notify the main app that data is loaded
    window.dispatchEvent(new CustomEvent('hskDataLoaded', { 
      detail: { level, count: convertedEntries.length } 
    }));
    
    console.log(`HSK ${level} loaded: ${convertedEntries.length} single characters`);
    return convertedEntries;
    
  } catch (error) {
    console.error(`Error loading HSK ${level}:`, error);
    
    // Fallback to basic data
    const fallbackData = getFallbackData(level);
    CHARACTER_DECKS[`HSK ${level}`] = fallbackData;
    loadedLevels.add(level);
    
    window.dispatchEvent(new CustomEvent('hskDataLoaded', { 
      detail: { level, count: fallbackData.length, error: error.message } 
    }));
    
    return fallbackData;
  } finally {
    isLoading = false;
  }
}

// Fallback data in case of network issues
function getFallbackData(level) {
  const fallbacks = {
    1: [
      { char: "学", pinyin: "xué", meaning: "to study; learn", exampleZh: "我学中文。", exampleEn: "I study Chinese." },
      { char: "人", pinyin: "rén", meaning: "person", exampleZh: "我们是好人。", exampleEn: "We are good people." },
      { char: "你", pinyin: "nǐ", meaning: "you", exampleZh: "你好吗？", exampleEn: "How are you?" },
      { char: "我", pinyin: "wǒ", meaning: "I; me", exampleZh: "我是学生。", exampleEn: "I am a student." },
      { char: "中", pinyin: "zhōng", meaning: "middle; center", exampleZh: "中国", exampleEn: "China" },
      { char: "国", pinyin: "guó", meaning: "country; nation", exampleZh: "美国", exampleEn: "USA" }
    ],
    2: [
      { char: "班", pinyin: "bān", meaning: "class", exampleZh: "我们班", exampleEn: "our class" },
      { char: "办", pinyin: "bàn", meaning: "to handle", exampleZh: "办事情", exampleEn: "handle matters" },
      { char: "半", pinyin: "bàn", meaning: "half", exampleZh: "半年", exampleEn: "half a year" },
      { char: "帮", pinyin: "bāng", meaning: "to help", exampleZh: "帮助你", exampleEn: "help you" }
    ]
  };
  
  return fallbacks[level] || [];
}

// Function to preload all HSK levels
async function preloadAllHSKLevels() {
  const levels = [1, 2, 3, 4, 5, 6];
  const promises = levels.map(level => loadHSKLevel(level));
  
  try {
    await Promise.all(promises);
    console.log('All HSK levels loaded successfully');
  } catch (error) {
    console.log('Some HSK levels failed to load, using fallback data');
  }
}

// Auto-load HSK 1 and 2 on script load
(async function() {
  await loadHSKLevel(1);
  await loadHSKLevel(2);
  
  // Optionally preload other levels in the background
  setTimeout(() => preloadAllHSKLevels(), 1000);
})();

// Export for use in main app
window.CHARACTER_DECKS = CHARACTER_DECKS;
window.loadHSKLevel = loadHSKLevel;
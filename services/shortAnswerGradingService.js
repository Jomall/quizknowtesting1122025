const natural = require('natural');
const compromise = require('compromise');
const { pipeline } = require('@xenova/transformers');
const SentenceTokenizer = require('sentence-tokenizer');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const stopwords = natural.stopwords;

// Enhanced synonym dictionary with more comprehensive coverage
const SYNONYM_DICT = {
  'car': ['automobile', 'vehicle', 'auto', 'motorcar'],
  'big': ['large', 'huge', 'enormous', 'gigantic', 'massive'],
  'small': ['little', 'tiny', 'miniature', 'petite', 'compact'],
  'fast': ['quick', 'rapid', 'speedy', 'swift', 'brisk'],
  'slow': ['sluggish', 'lethargic', 'gradual', 'unhurried'],
  'good': ['excellent', 'great', 'fine', 'superior', 'outstanding'],
  'bad': ['poor', 'terrible', 'awful', 'dreadful', 'inferior'],
  'important': ['crucial', 'vital', 'essential', 'critical', 'key'],
  'world war ii': ['second world war', 'wwii', 'ww2', 'world war 2'],
  'photosynthesis': ['photosynthetic process', 'plant food making', 'plant nutrition'],
  'chlorophyll': ['green pigment', 'chloroplast pigment', 'plant pigment'],
  'sunlight': ['solar energy', 'sun energy', 'light energy', 'solar radiation'],
  'plants': ['vegetation', 'flora', 'green plants', 'plant life'],
  'run': ['running', 'ran', 'runs', 'jog', 'sprint'],
  'walk': ['walking', 'walked', 'walks', 'stroll', 'amble'],
  'write': ['writing', 'wrote', 'writes', 'compose', 'author'],
  'read': ['reading', 'read', 'reads', 'peruse', 'study'],
  'convert': ['change', 'transform', 'turn', 'make', 'produce', 'alter'],
  'light': ['sunlight', 'solar', 'sun', 'bright', 'illumination'],
  'energy': ['power', 'force', 'strength', 'vigor'],
  'chemical': ['chemical compound', 'substance', 'compound'],
  'food': ['nutrition', 'nourishment', 'sustenance', 'diet'],
  'use': ['utilize', 'employ', 'apply', 'implement'],
  'make': ['produce', 'create', 'generate', 'manufacture', 'build'],
  'through': ['via', 'by', 'through', 'using', 'with'],
  'called': ['named', 'known as', 'referred to as', 'designated'],
  'process': ['method', 'procedure', 'way', 'technique', 'approach'],
  'is': ['is', 'represents', 'means', 'equals', 'constitutes']
};

class ShortAnswerGradingService {
  constructor() {
    this.nlp = compromise;
    this.stemmer = stemmer;
    this.bertModel = null;
    this.sentenceTokenizer = new SentenceTokenizer();
    this.gradingProfiles = this.initializeGradingProfiles();
    this.feedbackTemplates = this.initializeFeedbackTemplates();
    this.misconceptionPatterns = this.initializeMisconceptionPatterns();
    // Disable BERT loading in Vercel serverless environment
    if (!process.env.VERCEL) {
      this.initializeBERT();
    }
  }

  async initializeBERT() {
    try {
      this.bertModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('BERT model loaded successfully for short answer grading');
    } catch (error) {
      console.error('Failed to load BERT model for short answer grading:', error);
      this.bertModel = null;
    }
  }

  initializeGradingProfiles() {
    return {
      default: {
        keywordWeight: 0.4,
        semanticWeight: 0.3,
        intentWeight: 0.1,
        completenessWeight: 0.1,
        structureWeight: 0.05,
        qualityWeight: 0.05,
        useStemming: true,
        useSynonyms: true,
        useFuzzyMatching: true,
        fuzzyThreshold: 0.8
      },
      science: {
        keywordWeight: 0.5,
        semanticWeight: 0.2,
        intentWeight: 0.1,
        completenessWeight: 0.15,
        structureWeight: 0.03,
        qualityWeight: 0.02,
        useStemming: true,
        useSynonyms: true,
        useFuzzyMatching: true,
        fuzzyThreshold: 0.85
      },
      math: {
        keywordWeight: 0.6,
        semanticWeight: 0.1,
        intentWeight: 0.1,
        completenessWeight: 0.15,
        structureWeight: 0.03,
        qualityWeight: 0.02,
        useStemming: false,
        useSynonyms: false,
        useFuzzyMatching: true,
        fuzzyThreshold: 0.9
      },
      literature: {
        keywordWeight: 0.3,
        semanticWeight: 0.4,
        intentWeight: 0.15,
        completenessWeight: 0.1,
        structureWeight: 0.03,
        qualityWeight: 0.02,
        useStemming: true,
        useSynonyms: true,
        useFuzzyMatching: false
      },
      history: {
        keywordWeight: 0.4,
        semanticWeight: 0.3,
        intentWeight: 0.1,
        completenessWeight: 0.15,
        structureWeight: 0.03,
        qualityWeight: 0.02,
        useStemming: true,
        useSynonyms: true,
        useFuzzyMatching: true,
        fuzzyThreshold: 0.8
      }
    };
  }

  initializeFeedbackTemplates() {
    return {
      excellent: [
        "Excellent answer! You demonstrated clear understanding.",
        "Outstanding work! Your answer shows deep comprehension.",
        "Perfect! You've captured all the key elements."
      ],
      good: [
        "Good answer with solid understanding.",
        "Well done! You covered the main points.",
        "Nice work! Your answer shows good comprehension."
      ],
      partial: [
        "Partial understanding shown. Consider reviewing the key concepts.",
        "You have some correct elements. Focus on the missing aspects.",
        "Decent attempt, but some key points are missing."
      ],
      misconception: [
        "There's a common misconception here. The correct understanding is: {correction}",
        "This reflects a typical misunderstanding. Here's the right approach: {correction}",
        "You may have confused this with a similar concept. The accurate view is: {correction}"
      ],
      offTopic: [
        "Your answer seems off-topic. Please focus on the question asked.",
        "This doesn't address the question. Try to relate your answer to the topic.",
        "The response doesn't match the question's requirements."
      ]
    };
  }

  initializeMisconceptionPatterns() {
    return {
      science: [
        { pattern: /mitochondria.*stor.*food/i, misconception: 'Mitochondria store food', correction: 'Mitochondria are the powerhouse of the cell, converting energy from food' },
        { pattern: /power.?plant.*shape/i, misconception: 'Powerhouse due to shape', correction: 'Mitochondria are called powerhouse due to their energy production function' },
        { pattern: /photosynthesis.*animal/i, misconception: 'Photosynthesis in animals', correction: 'Photosynthesis occurs only in plants and some microorganisms' },
        { pattern: /chlorophyll.*blue/i, misconception: 'Chlorophyll is blue', correction: 'Chlorophyll is green, but reflects green light' },
        { pattern: /plant.*not.*need.*sunlight/i, misconception: 'Plants don\'t need sunlight', correction: 'Plants require sunlight for photosynthesis' }
      ],
      biology: [
        { pattern: /dna.*protein/i, misconception: 'DNA is protein', correction: 'DNA is a nucleic acid that contains genetic information' },
        { pattern: /evolution.*goal/i, misconception: 'Evolution has a goal', correction: 'Evolution is a process without predetermined goals' },
        { pattern: /genes.*blueprint/i, misconception: 'Genes are blueprints', correction: 'Genes provide instructions for protein synthesis' }
      ],
      physics: [
        { pattern: /heavier.*fall.*faster/i, misconception: 'Heavier objects fall faster', correction: 'All objects fall at the same rate in vacuum' },
        { pattern: /energy.*created/i, misconception: 'Energy can be created', correction: 'Energy can only be converted from one form to another' }
      ],
      chemistry: [
        { pattern: /burning.*oxygen/i, misconception: 'Burning releases oxygen', correction: 'Burning consumes oxygen and releases carbon dioxide' },
        { pattern: /acid.*proton/i, misconception: 'Acids donate protons', correction: 'Acids donate H+ ions in aqueous solution' }
      ]
    };
  }

  async gradeShortAnswer(studentAnswer, questionConfig, options = {}) {
    const {
      usePartialCredit = true,
      useSemanticSimilarity = true,
      useSynonyms = true,
      useStemming = true,
      useFuzzyMatching = true,
      fuzzyThreshold = 0.8,
      semanticWeight = 0.3,
      keywordWeight = 0.7
    } = options;

    if (!studentAnswer || !questionConfig) {
      return {
        isCorrect: false,
        score: 0,
        confidence: 0,
        analysis: 'Missing answer or question configuration'
      };
    }

    const normalizedStudent = this.normalizeText(studentAnswer);
    const acceptableAnswers = this.getAcceptableAnswers(questionConfig);

    // Boost score if exact match is found (case insensitive trimmed)
    for (const correctAnswer of acceptableAnswers) {
      if (normalizedStudent === this.normalizeText(correctAnswer.text)) {
        return {
          isCorrect: true,
          score: 1.0,
          confidence: 1.0,
          matchedKeywords: correctAnswer.text.split(' ').length,
          totalKeywords: correctAnswer.text.split(' ').length,
          semanticSimilarity: 1.0,
          misconception: { detected: false },
          offTopic: { detected: false },
          analysis: 'Exact match - full credit'
        };
      }
    }

    let bestResult = {
      score: 0,
      confidence: 0,
      matchedKeywords: 0,
      totalKeywords: 0,
      semanticSimilarity: 0,
      misconception: { detected: false },
      offTopic: { detected: false },
      analysis: ''
    };

    for (const correctAnswer of acceptableAnswers) {
      const normalizedCorrect = this.normalizeText(correctAnswer.text);
      const correctKeywords = this.extractKeywords(normalizedCorrect, correctAnswer.weights || {});
      const studentKeywords = this.extractKeywords(normalizedStudent);

      const keywordResult = this.calculateKeywordScore(
        studentKeywords,
        correctKeywords,
        {
          useSynonyms,
          useStemming,
          useFuzzyMatching,
          fuzzyThreshold
        }
      );

      let semanticSimilarity = 0;
      if (useSemanticSimilarity) {
        semanticSimilarity = await this.calculateSemanticSimilarity(studentAnswer, correctAnswer.text);
      }

      const combinedScore = usePartialCredit ?
        (keywordResult.score * keywordWeight) + (semanticSimilarity * semanticWeight) :
        (keywordResult.score >= 1.0 ? 1.0 : 0.0);

      const misconceptionCheck = this.detectMisconceptions(studentAnswer, correctAnswer.text);
      const offTopicCheck = this.detectOffTopic(studentAnswer, correctAnswer.text);

      if (combinedScore > bestResult.score) {
        bestResult = {
          score: combinedScore,
          confidence: Math.min(combinedScore + 0.1, 1.0),
          matchedKeywords: keywordResult.matched,
          totalKeywords: keywordResult.total,
          semanticSimilarity,
          misconception: misconceptionCheck,
          offTopic: offTopicCheck,
          analysis: this.generateAnalysis(keywordResult, semanticSimilarity, usePartialCredit, misconceptionCheck, offTopicCheck)
        };
      }
    }

    return {
      isCorrect: bestResult.score >= 0.7,
      score: bestResult.score,
      confidence: bestResult.confidence,
      matchedKeywords: bestResult.matchedKeywords,
      totalKeywords: bestResult.totalKeywords,
      semanticSimilarity: bestResult.semanticSimilarity,
      misconception: bestResult.misconception,
      offTopic: bestResult.offTopic,
      analysis: bestResult.analysis
    };
  }

  getAcceptableAnswers(questionConfig) {
    const answers = [];

    if (questionConfig.correctAnswer) {
      answers.push({
        text: questionConfig.correctAnswer,
        weights: questionConfig.keywordWeights || {}
      });
    }

    if (questionConfig.alternativeAnswers && Array.isArray(questionConfig.alternativeAnswers)) {
      answers.push(...questionConfig.alternativeAnswers.map(alt => ({
        text: alt.text || alt,
        weights: alt.weights || questionConfig.keywordWeights || {}
      })));
    }

    return answers.length > 0 ? answers : [{ text: '', weights: {} }];
  }

  normalizeText(text) {
    if (!text) return '';

    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-']/g, ' ')
      .replace(/'s\b/g, ' is')
      .replace(/'re\b/g, ' are')
      .replace(/'ve\b/g, ' have')
      .replace(/'t\b/g, ' not')
      .replace(/'ll\b/g, ' will')
      .replace(/'d\b/g, ' would')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractKeywords(text, weights = {}, useStemming = true) {
    if (!text) return [];

    const tokens = tokenizer.tokenize(text) || [];
    const keywords = [];

    for (const token of tokens) {
      if (stopwords.includes(token.toLowerCase()) && !weights[token]) {
        continue;
      }

      keywords.push({
        word: token.toLowerCase(),
        stem: useStemming ? stemmer.stem(token.toLowerCase()) : token.toLowerCase(),
        weight: weights[token.toLowerCase()] || 1.0
      });
    }

    return keywords;
  }

  calculateKeywordScore(studentKeywords, correctKeywords, options) {
    const { useSynonyms, useStemming, useFuzzyMatching, fuzzyThreshold } = options;

    if (correctKeywords.length === 0) return { score: 0, matched: 0, total: 0 };

    let matchedCount = 0;
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const correctKw of correctKeywords) {
      totalWeight += correctKw.weight;
      let found = false;
      let bestMatchWeight = 0;

      for (const studentKw of studentKeywords) {
        let similarity = 0;

        if (studentKw.word === correctKw.word) {
          similarity = 1.0;
        } else if (useStemming && studentKw.stem === correctKw.stem) {
          similarity = 0.9;
        } else if (useSynonyms && this.isSynonym(studentKw.word, correctKw.word)) {
          similarity = 0.8;
        } else if (useFuzzyMatching) {
          const fuzzySim = this.fuzzyMatch(studentKw.word, correctKw.word);
          if (fuzzySim >= fuzzyThreshold) {
            similarity = fuzzySim * 0.7;
          }
        }

        if (similarity > 0) {
          found = true;
          bestMatchWeight = Math.max(bestMatchWeight, similarity * correctKw.weight);
          break;
        }
      }

      if (found) {
        matchedCount++;
        matchedWeight += bestMatchWeight;
      }
    }

    const score = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    return {
      score,
      matched: matchedCount,
      total: correctKeywords.length
    };
  }

  isSynonym(word1, word2) {
    const synonyms1 = SYNONYM_DICT[word1] || [];
    const synonyms2 = SYNONYM_DICT[word2] || [];

    return synonyms1.includes(word2) || synonyms2.includes(word1);
  }

  fuzzyMatch(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = natural.LevenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  async calculateSemanticSimilarity(text1, text2) {
    try {
      if (!this.bertModel) {
        console.warn('BERT model not loaded, falling back to basic semantic similarity');
        return 0;
      }

      const embedding1 = await this.bertModel(text1);
      const embedding2 = await this.bertModel(text2);

      const vector1 = embedding1[0].flat();
      const vector2 = embedding2[0].flat();

      const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
      const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
      const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

      if (magnitude1 === 0 || magnitude2 === 0) return 0;

      const similarity = dotProduct / (magnitude1 * magnitude2);
      return similarity;
    } catch (error) {
      console.error('Semantic similarity calculation failed:', error);
      return 0;
    }
  }

  detectMisconceptions(studentAnswer, correctAnswer) {
    const misconceptions = [
      { pattern: /mitochondria.*stor.*food/i, misconception: 'Mitochondria store food' },
      { pattern: /power.?plant.*shape/i, misconception: 'Powerhouse due to shape' },
      { pattern: /photosynthesis.*animal/i, misconception: 'Photosynthesis in animals' },
      { pattern: /chlorophyll.*blue/i, misconception: 'Chlorophyll is blue' },
      { pattern: /plant.*not.*need.*sunlight|sunlight.*not.*need/i, misconception: 'Plants don\'t need sunlight' }
    ];

    for (const mis of misconceptions) {
      if (mis.pattern.test(studentAnswer)) {
        return { detected: true, type: mis.misconception };
      }
    }

    return { detected: false };
  }

  detectOffTopic(studentAnswer, correctAnswer) {
    const semanticSim = this.calculateSemanticSimilarity(studentAnswer, correctAnswer);
    const studentWords = this.extractKeywords(this.normalizeText(studentAnswer));
    const correctWords = this.extractKeywords(this.normalizeText(correctAnswer));

    const commonWords = studentWords.filter(sw =>
      correctWords.some(cw => cw.word === sw.word || cw.stem === sw.stem)
    ).length;

    const offTopic = semanticSim < 0.2 && commonWords < 1;

    return { detected: offTopic, similarity: semanticSim, commonWords };
  }

  generateAnalysis(keywordResult, semanticSimilarity, usePartialCredit, misconceptionCheck, offTopicCheck) {
    const keywordPercent = keywordResult.total > 0 ?
      Math.round((keywordResult.matched / keywordResult.total) * 100) : 0;

    const semanticPercent = Math.round(semanticSimilarity * 100);

    let analysis = '';

    if (offTopicCheck.detected) {
      analysis = 'Off-topic answer detected. ';
    } else if (misconceptionCheck.detected) {
      analysis = `Misconception detected: ${misconceptionCheck.type}. `;
    }

    if (usePartialCredit) {
      analysis += `Keyword match: ${keywordResult.matched}/${keywordResult.total} (${keywordPercent}%) | Semantic similarity: ${semanticPercent}%`;
    } else {
      const isCorrect = keywordResult.matched === keywordResult.total;
      analysis += isCorrect ?
        `Perfect keyword match (${keywordResult.total}/${keywordResult.total})` :
        `Partial match: ${keywordResult.matched}/${keywordResult.total} keywords found`;
    }

    return analysis;
  }
}

module.exports = new ShortAnswerGradingService();

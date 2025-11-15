const natural = require('natural');
const compromise = require('compromise');

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
  }

  /**
   * Enhanced short answer grading with multiple features
   * @param {string} studentAnswer - The student's answer
   * @param {object} questionConfig - Question configuration including correct answers, weights, etc.
   * @param {object} options - Grading options
   * @returns {object} Grading result with detailed analysis
   */
  gradeShortAnswer(studentAnswer, questionConfig, options = {}) {
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

    // Normalize student answer
    const normalizedStudent = this.normalizeText(studentAnswer);

    // Get all acceptable answers (primary + alternatives)
    const acceptableAnswers = this.getAcceptableAnswers(questionConfig);

    let bestResult = {
      score: 0,
      confidence: 0,
      matchedKeywords: 0,
      totalKeywords: 0,
      semanticSimilarity: 0,
      analysis: ''
    };

    // Evaluate against each acceptable answer
    for (const correctAnswer of acceptableAnswers) {
      const normalizedCorrect = this.normalizeText(correctAnswer.text);

      // Extract keywords with weights
      const correctKeywords = this.extractKeywords(normalizedCorrect, correctAnswer.weights || {});
      const studentKeywords = this.extractKeywords(normalizedStudent);

      // Calculate keyword-based score
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

      // Calculate semantic similarity if enabled
      let semanticSimilarity = 0;
      if (useSemanticSimilarity) {
        semanticSimilarity = this.calculateSemanticSimilarity(studentAnswer, correctAnswer.text);
      }

      // Combine scores
      const combinedScore = usePartialCredit ?
        (keywordResult.score * keywordWeight) + (semanticSimilarity * semanticWeight) :
        (keywordResult.score >= 1.0 ? 1.0 : 0.0);

      // Keep the best result
      if (combinedScore > bestResult.score) {
        bestResult = {
          score: combinedScore,
          confidence: Math.min(combinedScore + 0.1, 1.0), // Add small confidence boost
          matchedKeywords: keywordResult.matched,
          totalKeywords: keywordResult.total,
          semanticSimilarity,
          analysis: this.generateAnalysis(keywordResult, semanticSimilarity, usePartialCredit)
        };
      }
    }

    return {
      isCorrect: bestResult.score >= 0.7, // Consider correct if 70% or higher
      score: bestResult.score,
      confidence: bestResult.confidence,
      matchedKeywords: bestResult.matchedKeywords,
      totalKeywords: bestResult.totalKeywords,
      semanticSimilarity: bestResult.semanticSimilarity,
      analysis: bestResult.analysis
    };
  }

  /**
   * Get all acceptable answers from question config
   */
  getAcceptableAnswers(questionConfig) {
    const answers = [];

    // Primary correct answer
    if (questionConfig.correctAnswer) {
      answers.push({
        text: questionConfig.correctAnswer,
        weights: questionConfig.keywordWeights || {}
      });
    }

    // Alternative correct answers
    if (questionConfig.alternativeAnswers && Array.isArray(questionConfig.alternativeAnswers)) {
      answers.push(...questionConfig.alternativeAnswers.map(alt => ({
        text: alt.text || alt,
        weights: alt.weights || questionConfig.keywordWeights || {}
      })));
    }

    return answers.length > 0 ? answers : [{ text: '', weights: {} }];
  }

  /**
   * Enhanced text normalization
   */
  normalizeText(text) {
    if (!text) return '';

    return text
      .toLowerCase()
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove punctuation except hyphens and apostrophes
      .replace(/[^\w\s\-']/g, ' ')
      // Handle contractions
      .replace(/'s\b/g, ' is')
      .replace(/'re\b/g, ' are')
      .replace(/'ve\b/g, ' have')
      .replace(/'t\b/g, ' not')
      .replace(/'ll\b/g, ' will')
      .replace(/'d\b/g, ' would')
      // Remove extra whitespace again
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract keywords from text with optional weights
   */
  extractKeywords(text, weights = {}) {
    if (!text) return [];

    const tokens = tokenizer.tokenize(text) || [];
    const keywords = [];

    for (const token of tokens) {
      // Skip stopwords unless they're weighted
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

  /**
   * Calculate keyword-based score with advanced matching
   */
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

        // Exact match
        if (studentKw.word === correctKw.word) {
          similarity = 1.0;
        }
        // Stem match
        else if (useStemming && studentKw.stem === correctKw.stem) {
          similarity = 0.9;
        }
        // Synonym match
        else if (useSynonyms && this.isSynonym(studentKw.word, correctKw.word)) {
          similarity = 0.8;
        }
        // Fuzzy match for typos
        else if (useFuzzyMatching) {
          const fuzzySim = this.fuzzyMatch(studentKw.word, correctKw.word);
          if (fuzzySim >= fuzzyThreshold) {
            similarity = fuzzySim * 0.7; // Reduce weight for fuzzy matches
          }
        }

        if (similarity > 0) {
          found = true;
          bestMatchWeight = Math.max(bestMatchWeight, similarity * correctKw.weight);
          break; // Take the best match for this keyword
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

  /**
   * Check if two words are synonyms
   */
  isSynonym(word1, word2) {
    const synonyms1 = SYNONYM_DICT[word1] || [];
    const synonyms2 = SYNONYM_DICT[word2] || [];

    return synonyms1.includes(word2) || synonyms2.includes(word1);
  }

  /**
   * Fuzzy string matching using Levenshtein distance
   */
  fuzzyMatch(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = natural.LevenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate semantic similarity using compromise NLP
   */
  calculateSemanticSimilarity(text1, text2) {
    try {
      const doc1 = this.nlp(text1);
      const doc2 = this.nlp(text2);

      // Extract meaningful words (nouns, verbs, adjectives, adverbs)
      const words1 = [
        ...doc1.nouns().out('array'),
        ...doc1.verbs().out('array'),
        ...doc1.adjectives().out('array'),
        ...doc1.adverbs().out('array')
      ].map(w => w.toLowerCase());

      const words2 = [
        ...doc2.nouns().out('array'),
        ...doc2.verbs().out('array'),
        ...doc2.adjectives().out('array'),
        ...doc2.adverbs().out('array')
      ].map(w => w.toLowerCase());

      // Jaccard similarity
      const set1 = new Set(words1);
      const set2 = new Set(words2);
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);

      return intersection.size / union.size;
    } catch (error) {
      console.error('Semantic similarity calculation failed:', error);
      return 0;
    }
  }

  /**
   * Generate detailed analysis text
   */
  generateAnalysis(keywordResult, semanticSimilarity, usePartialCredit) {
    const keywordPercent = keywordResult.total > 0 ?
      Math.round((keywordResult.matched / keywordResult.total) * 100) : 0;

    const semanticPercent = Math.round(semanticSimilarity * 100);

    if (usePartialCredit) {
      return `Keyword match: ${keywordResult.matched}/${keywordResult.total} (${keywordPercent}%) | Semantic similarity: ${semanticPercent}%`;
    } else {
      const isCorrect = keywordResult.matched === keywordResult.total;
      return isCorrect ?
        `Perfect keyword match (${keywordResult.total}/${keywordResult.total})` :
        `Partial match: ${keywordResult.matched}/${keywordResult.total} keywords found`;
    }
  }
}

module.exports = new ShortAnswerGradingService();

const natural = require('natural');
const compromise = require('compromise');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const stopwords = natural.stopwords;

// Basic synonym dictionary (can be expanded)
const SYNONYM_DICT = {
  'car': ['automobile', 'vehicle', 'auto'],
  'big': ['large', 'huge', 'enormous'],
  'small': ['little', 'tiny', 'miniature'],
  'fast': ['quick', 'rapid', 'speedy'],
  'slow': ['sluggish', 'lethargic', 'gradual'],
  'good': ['excellent', 'great', 'fine'],
  'bad': ['poor', 'terrible', 'awful'],
  'important': ['crucial', 'vital', 'essential'],
  'world war ii': ['second world war', 'wwii', 'ww2'],
  'photosynthesis': ['photosynthetic process', 'plant food making'],
  'chlorophyll': ['green pigment', 'chloroplast pigment'],
  'sunlight': ['solar energy', 'sun energy', 'light'],
  'plants': ['vegetation', 'flora', 'green plants'],
  'run': ['running', 'ran', 'runs'],
  'walk': ['walking', 'walked', 'walks'],
  'write': ['writing', 'wrote', 'writes'],
  'read': ['reading', 'read', 'reads'],
  'convert': ['change', 'transform', 'turn', 'make', 'produce'],
  'light': ['sunlight', 'solar', 'sun', 'bright'],
  'energy': ['power', 'force'],
  'chemical': ['chemical'],
  'food': ['nutrition', 'nourishment'],
  'use': ['utilize', 'employ'],
  'make': ['produce', 'create', 'generate'],
  'through': ['via', 'by', 'through'],
  'called': ['named', 'known as', 'referred to as'],
  'process': ['method', 'procedure', 'way'],
  'is': ['is', 'represents', 'means']
};

class EssayGradingService {
  constructor() {
    this.nlp = compromise;
  }

  /**
   * Enhanced essay grading with improved text processing
   * @param {string} studentAnswer - The student's essay response
   * @param {string} correctAnswer - The instructor's rubric/answer key
   * @param {object} options - Grading options
   * @returns {object} Grading result with score and analysis
   */
  gradeEssay(studentAnswer, correctAnswer, options = {}) {
    const {
      useStemming = true,
      useSynonyms = true,
      useStopwords = true,
      partialCredit = true,
      minMatchThreshold = 0.7
    } = options;

    if (!studentAnswer || !correctAnswer) {
      return {
        isCorrect: false,
        score: 0,
        confidence: 0,
        matchedKeywords: [],
        totalKeywords: 0,
        analysis: 'Missing answer or rubric'
      };
    }

    // Preprocess texts
    const processedStudent = this.preprocessText(studentAnswer, { useStemming, useStopwords });
    const processedCorrect = this.preprocessText(correctAnswer, { useStemming, useStopwords });

    // Extract keywords from rubric
    const rubricKeywords = this.extractKeywords(processedCorrect, { useSynonyms });

    // Find matches in student answer
    const matches = this.findKeywordMatches(processedStudent, rubricKeywords, { useSynonyms });

    // Calculate score
    const matchRatio = matches.found / matches.total;
    const isCorrect = partialCredit ? matchRatio >= minMatchThreshold : matchRatio === 1.0;

    // Calculate partial score (0-1 scale)
    let score = 0;
    if (partialCredit) {
      score = Math.min(matchRatio, 1.0);
    } else {
      score = matchRatio === 1.0 ? 1.0 : 0.0;
    }

    return {
      isCorrect,
      score,
      confidence: matchRatio,
      matchedKeywords: matches.matched,
      totalKeywords: matches.total,
      analysis: this.generateAnalysis(matches, rubricKeywords),
      details: {
        studentKeywords: processedStudent.keywords,
        rubricKeywords: rubricKeywords,
        matches: matches.details
      }
    };
  }

  /**
   * Preprocess text for better matching
   */
  preprocessText(text, options = {}) {
    const { useStemming = true, useStopwords = true } = options;

    // Convert to lowercase and normalize
    let processed = text.toLowerCase();

    // Remove punctuation and extra whitespace
    processed = processed.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

    // Tokenize
    const tokens = tokenizer.tokenize(processed) || [];

    // Remove stopwords if enabled
    let filteredTokens = tokens;
    if (useStopwords) {
      filteredTokens = tokens.filter(token => !stopwords.includes(token));
    }

    // Apply stemming if enabled
    let finalTokens = filteredTokens;
    if (useStemming) {
      finalTokens = filteredTokens.map(token => stemmer.stem(token));
    }

    return {
      original: text,
      processed: processed,
      tokens: tokens,
      keywords: finalTokens,
      stemmed: useStemming
    };
  }

  /**
   * Extract keywords from rubric with synonym expansion
   */
  extractKeywords(processedText, options = {}) {
    const { useSynonyms = true } = options;

    const keywords = [...processedText.keywords];
    const expandedKeywords = new Set(keywords);

    if (useSynonyms) {
      keywords.forEach(keyword => {
        // Check for exact matches in synonym dictionary
        Object.entries(SYNONYM_DICT).forEach(([key, synonyms]) => {
          if (key === keyword || synonyms.includes(keyword)) {
            [key, ...synonyms].forEach(syn => expandedKeywords.add(syn));
          }
        });
      });
    }

    return Array.from(expandedKeywords);
  }

  /**
   * Find keyword matches with detailed analysis
   */
  findKeywordMatches(processedStudent, rubricKeywords, options = {}) {
    const { useSynonyms = true } = options;

    const matched = [];
    const details = [];

    rubricKeywords.forEach(rubricWord => {
      let found = false;
      let matchType = 'none';
      let matchedWord = null;

      // Direct match
      if (processedStudent.keywords.includes(rubricWord)) {
        found = true;
        matchType = 'direct';
        matchedWord = rubricWord;
      }
      // Stemmed match (if stemming was used)
      else if (processedStudent.stemmed && processedStudent.tokens.some(token =>
        stemmer.stem(token) === rubricWord
      )) {
        found = true;
        matchType = 'stemmed';
        matchedWord = rubricWord;
      }
      // Synonym match
      else if (useSynonyms) {
        const synonymGroup = this.findSynonymGroup(rubricWord);
        if (synonymGroup) {
          const synonymMatch = processedStudent.keywords.find(word =>
            synonymGroup.includes(word)
          );
          if (synonymMatch) {
            found = true;
            matchType = 'synonym';
            matchedWord = synonymMatch;
          }
        }
      }

      if (found) {
        matched.push(rubricWord);
      }

      details.push({
        rubricWord,
        found,
        matchType,
        matchedWord
      });
    });

    return {
      found: matched.length,
      total: rubricKeywords.length,
      matched,
      details
    };
  }

  /**
   * Find synonym group for a word
   */
  findSynonymGroup(word) {
    for (const [key, synonyms] of Object.entries(SYNONYM_DICT)) {
      if (key === word || synonyms.includes(word)) {
        return [key, ...synonyms];
      }
    }
    return null;
  }

  /**
   * Generate analysis text for grading result
   */
  generateAnalysis(matches, rubricKeywords) {
    const percentage = Math.round((matches.found / matches.total) * 100);

    if (matches.found === matches.total) {
      return `Perfect match: All ${matches.total} required keywords found (${percentage}%)`;
    } else if (matches.found === 0) {
      return `No matches: None of the ${matches.total} required keywords found (0%)`;
    } else {
      const missing = matches.total - matches.found;
      return `Partial match: ${matches.found} of ${matches.total} keywords found (${percentage}%), ${missing} missing`;
    }
  }

  /**
   * Advanced semantic similarity using compromise NLP
   */
  calculateSemanticSimilarity(text1, text2) {
    try {
      const doc1 = this.nlp(text1);
      const doc2 = this.nlp(text2);

      // Extract nouns, verbs, adjectives
      const words1 = doc1.nouns().out('array').concat(doc1.verbs().out('array'), doc1.adjectives().out('array'));
      const words2 = doc2.nouns().out('array').concat(doc2.verbs().out('array'), doc2.adjectives().out('array'));

      // Simple Jaccard similarity
      const set1 = new Set(words1.map(w => w.toLowerCase()));
      const set2 = new Set(words2.map(w => w.toLowerCase()));

      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);

      return intersection.size / union.size;
    } catch (error) {
      console.error('Semantic similarity calculation failed:', error);
      return 0;
    }
  }

  /**
   * Enhanced grading with semantic analysis
   */
  gradeEssayAdvanced(studentAnswer, correctAnswer, options = {}) {
    // First do keyword-based grading
    const keywordResult = this.gradeEssay(studentAnswer, correctAnswer, options);

    // Add semantic similarity
    const semanticSimilarity = this.calculateSemanticSimilarity(studentAnswer, correctAnswer);

    // Combine scores (weighted average)
    const keywordWeight = 0.7;
    const semanticWeight = 0.3;
    const combinedScore = (keywordResult.score * keywordWeight) + (semanticSimilarity * semanticWeight);

    return {
      ...keywordResult,
      score: combinedScore,
      semanticSimilarity,
      combinedScore,
      analysis: `${keywordResult.analysis} | Semantic similarity: ${Math.round(semanticSimilarity * 100)}%`
    };
  }
}

module.exports = new EssayGradingService();

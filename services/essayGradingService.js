const natural = require('natural');
const compromise = require('compromise');
const SentenceTokenizer = require('sentence-tokenizer');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const stopwords = natural.stopwords;

// Enhanced synonym dictionary for short answer grading
const SYNONYM_DICT = {
  car: ['automobile', 'vehicle', 'auto'],
  big: ['large', 'huge', 'enormous'],
  small: ['little', 'tiny', 'miniature'],
  fast: ['quick', 'rapid', 'speedy'],
  slow: ['sluggish', 'lethargic', 'gradual'],
  good: ['excellent', 'great', 'fine'],
  bad: ['poor', 'terrible', 'awful'],
  important: ['crucial', 'vital', 'essential'],
  'world war ii': ['second world war', 'wwii', 'ww2'],
  photosynthesis: ['photosynthetic process', 'plant food making'],
  chlorophyll: ['green pigment', 'chloroplast pigment'],
  sunlight: ['solar energy', 'sun energy', 'light'],
  plants: ['vegetation', 'flora', 'green plants'],
  run: ['running', 'ran', 'runs'],
  walk: ['walking', 'walked', 'walks'],
  write: ['writing', 'wrote', 'writes'],
  read: ['reading', 'read', 'reads'],
  convert: ['change', 'transform', 'turn', 'make', 'produce'],
  light: ['sunlight', 'solar', 'sun', 'bright'],
  energy: ['power', 'force'],
  chemical: ['chemical'],
  food: ['nutrition', 'nourishment'],
  use: ['utilize', 'employ'],
  make: ['produce', 'create', 'generate'],
  through: ['via', 'by', 'through'],
  called: ['named', 'known as', 'referred to as'],
  process: ['method', 'procedure', 'way'],
  is: ['is', 'represents', 'means'],
  // Short answer specific terms
  mitochondria: ['mitochondrion', 'powerhouse', 'cell powerhouse'],
  atp: ['adenosine triphosphate', 'energy currency'],
  'cellular respiration': ['respiration', 'cell respiration'],
  glucose: ['sugar', 'blood sugar'],
  nutrients: ['nutrient', 'food molecules'],
  movement: ['motion', 'locomotion'],
  growth: ['growing', 'development'],
  explain: ['describe', 'elaborate', 'clarify'],
  compare: ['contrast', 'differentiate'],
  analyze: ['examine', 'break down'],
  evaluate: ['assess', 'judge']
};

class EssayGradingService {
  constructor() {
    this.nlp = compromise;
    this.bertModel = null;
    this.sentenceTokenizer = new SentenceTokenizer();
    // Disable BERT loading in Vercel serverless environment
    if (!process.env.VERCEL) {
      this.initializeBERT();
    }
  }

  /**
   * Initialize BERT model for advanced semantic analysis
   */
  async initializeBERT() {
    try {
      const { pipeline } = await import('@xenova/transformers');
      this.bertModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('BERT model loaded successfully');
    } catch (error) {
      console.error('Failed to load BERT model:', error);
      // Fall back to basic similarity if BERT is unavailable
      this.bertModel = null;
    }
  }

  /**
   * Grade essay based on keyword matching with optional stemming, stopwords removal, and synonym expansion
   * @param {string} studentAnswer
   * @param {string} correctAnswer
   * @param {Object} options
   * @returns {Object} grading result containing score, matches, and analysis
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

    // Preprocess student and rubric texts
    const processedStudent = this.preprocessText(studentAnswer, { useStemming, useStopwords });
    const processedCorrect = this.preprocessText(correctAnswer, { useStemming, useStopwords });

    // Extract keywords from rubric, including synonyms if enabled
    const rubricKeywords = this.extractKeywords(processedCorrect, { useSynonyms });

    // Determine matches between student answer and rubric keywords
    const matches = this.findKeywordMatches(processedStudent, rubricKeywords, { useSynonyms });

    // Calculate matching ratio and determine correctness
    const matchRatio = matches.found / matches.total || 0;
    const isCorrect = partialCredit ? matchRatio >= minMatchThreshold : matchRatio === 1.0;

    // Calculate final score (scaled 0 to 1)
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
        rubricKeywords,
        matches: matches.details
      }
    };
  }

  /**
   * Preprocesses text by normalizing, tokenizing, removing stopwords, and optionally stemming
   * @param {string} text
   * @param {Object} options
   * @returns {Object} processed text data
   */
  preprocessText(text, options = {}) {
    const { useStemming = true, useStopwords = true } = options;

    let processed = text.toLowerCase();
    processed = processed.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

    const tokens = tokenizer.tokenize(processed) || [];

    let filteredTokens = tokens;
    if (useStopwords) {
      filteredTokens = tokens.filter(token => !stopwords.includes(token));
    }

    let finalTokens = filteredTokens;
    if (useStemming) {
      finalTokens = filteredTokens.map(token => stemmer.stem(token));
    }

    return {
      original: text,
      processed,
      tokens,
      keywords: finalTokens,
      stemmed: useStemming
    };
  }

  /**
   * Extract keywords and expand with synonyms if enabled
   * @param {Object} processedText
   * @param {Object} options
   * @returns {Array} array of keywords including synonyms
   */
  extractKeywords(processedText, options = {}) {
    const { useSynonyms = true } = options;

    const keywords = [...processedText.keywords];
    const expandedKeywords = new Set(keywords);

    if (useSynonyms) {
      keywords.forEach(keyword => {
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
   * Finds matched keywords between student keywords and rubric keywords with match type info
   * @param {Object} processedStudent
   * @param {Array} rubricKeywords
   * @param {Object} options
   * @returns {Object} matched count, detailed matches array
   */
  findKeywordMatches(processedStudent, rubricKeywords, options = {}) {
    const { useSynonyms = true } = options;

    const matched = [];
    const details = [];

    // For each rubric keyword, check various matching scenarios
    rubricKeywords.forEach(rubricWord => {
      let found = false;
      let matchType = 'none';
      let matchedWord = null;

      // Direct keyword match
      if (processedStudent.keywords.includes(rubricWord)) {
        found = true;
        matchType = 'direct';
        matchedWord = rubricWord;
      }
      // Stemmed match, if stemming enabled
      else if (
        processedStudent.stemmed &&
        processedStudent.tokens.some(token => stemmer.stem(token) === rubricWord)
      ) {
        found = true;
        matchType = 'stemmed';
        matchedWord = rubricWord;
      }
      // Synonym match if enabled
      else if (useSynonyms) {
        const synonymGroup = this.findSynonymGroup(rubricWord);
        if (synonymGroup) {
          const synonymMatch = processedStudent.keywords.find(word => synonymGroup.includes(word));
          if (synonymMatch) {
            found = true;
            matchType = 'synonym';
            matchedWord = synonymMatch;
          }
        }
      }

      if (found) matched.push(rubricWord);

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
   * Locate synonym group for a given word
   * @param {string} word
   * @returns {Array|null} synonym group or null if none found
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
   * Generate human-readable text analysis from matches
   * @param {Object} matches
   * @param {Array} rubricKeywords
   * @returns {string} analysis summary
   */
  generateAnalysis(matches, rubricKeywords) {
    const percentage = Math.round(((matches.found || 0) / (matches.total || 1)) * 100);

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
   * Semantic similarity calculation using compromise library for POS extraction and Jaccard similarity
   * @param {string} text1
   * @param {string} text2
   * @returns {number} similarity score between 0 and 1
   */
  calculateSemanticSimilarity(text1, text2) {
    try {
      const doc1 = this.nlp(text1);
      const doc2 = this.nlp(text2);

      const words1 = doc1.nouns().out('array').concat(doc1.verbs().out('array'), doc1.adjectives().out('array'));
      const words2 = doc2.nouns().out('array').concat(doc2.verbs().out('array'), doc2.adjectives().out('array'));

      const set1 = new Set(words1.map(w => w.toLowerCase()));
      const set2 = new Set(words2.map(w => w.toLowerCase()));

      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);

      return union.size === 0 ? 0 : intersection.size / union.size;
    } catch (error) {
      console.error('Semantic similarity calculation failed:', error);
      return 0;
    }
  }

  /**
   * Grade essay with both keyword matching and semantic similarity combined (weighted score)
   */
  gradeEssayAdvanced(studentAnswer, correctAnswer, options = {}) {
    const keywordResult = this.gradeEssay(studentAnswer, correctAnswer, options);

    const semanticSimilarity = this.calculateSemanticSimilarity(studentAnswer, correctAnswer);

    const keywordWeight = 0.7;
    const semanticWeight = 0.3;
    const combinedScore = keywordResult.score * keywordWeight + semanticSimilarity * semanticWeight;

    return {
      ...keywordResult,
      score: combinedScore,
      semanticSimilarity,
      combinedScore,
      analysis: `${keywordResult.analysis} | Semantic similarity: ${Math.round(semanticSimilarity * 100)}%`
    };
  }

  /**
   * Calculate semantic similarity using BERT model embeddings (async)
   */
  async calculateBERTSimilarity(text1, text2) {
    if (!this.bertModel) {
      console.warn('BERT model not loaded, falling back to basic similarity');
      return this.calculateSemanticSimilarity(text1, text2);
    }

    try {
      const embedding1 = await this.bertModel(text1, { pooling: 'mean', normalize: true });
      const embedding2 = await this.bertModel(text2, { pooling: 'mean', normalize: true });

      return this.cosineSimilarity(embedding1.data, embedding2.data);
    } catch (error) {
      console.error('BERT similarity calculation failed:', error);
      return this.calculateSemanticSimilarity(text1, text2);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Analyze sentence coherence and logical flow
   * @param {string} text
   * @returns {Object} analysis info
   */
  analyzeSentenceStructure(text) {
    const sentences = this.sentenceTokenizer.sentences(text);

    const analysis = {
      totalSentences: sentences.length,
      avgSentenceLength: 0,
      coherenceScore: 0,
      logicalFlow: [],
      transitions: []
    };

    if (sentences.length === 0) return analysis;

    const totalWords = sentences.reduce((sum, sentence) => sum + sentence.trim().split(/\s+/).length, 0);
    analysis.avgSentenceLength = totalWords / sentences.length;

    const transitionWords = [
      'however', 'therefore', 'thus', 'consequently', 'furthermore',
      'moreover', 'in addition', 'similarly', 'likewise', 'on the other hand',
      'in contrast', 'although', 'despite', 'while', 'whereas'
    ];

    sentences.forEach((sentence, index) => {
      const lowerSentence = sentence.toLowerCase();

      const hasTransition = transitionWords.some(word => lowerSentence.includes(word));
      if (hasTransition) {
        analysis.transitions.push({ sentence: index + 1, transition: true });
      }

      if (index > 0) {
        const prevSentence = sentences[index - 1].toLowerCase();
        const commonWords = this.findCommonWords(prevSentence, lowerSentence);
        analysis.logicalFlow.push({
          sentence: index + 1,
          commonWords: commonWords.length,
          coherence: commonWords.length > 2 ? 'good' : 'weak'
        });
      }
    });

    const goodTransitions = analysis.logicalFlow.filter(flow => flow.coherence === 'good').length;
    analysis.coherenceScore = analysis.logicalFlow.length > 0 ? goodTransitions / analysis.logicalFlow.length : 0;

    return analysis;
  }

  /**
   * Find common meaningful words between two sentences
   */
  findCommonWords(sentence1, sentence2) {
    const words1 = sentence1.split(/\s+/).filter(word => word.length > 3 && !stopwords.includes(word));
    const words2 = sentence2.split(/\s+/).filter(word => word.length > 3 && !stopwords.includes(word));

    const stemmed1 = words1.map(word => stemmer.stem(word));
    const stemmed2 = words2.map(word => stemmer.stem(word));

    return stemmed1.filter(word => stemmed2.includes(word));
  }

  /**
   * Extract named entities from text for organizations, people, places, dates, numbers and technical terms
   */
  extractNamedEntities(text) {
    const doc = this.nlp(text);

    const entities = {
      organizations: doc.organizations().out('array'),
      people: doc.people().out('array'),
      places: doc.places().out('array'),
      dates: doc.dates().out('array'),
      numbers: doc.numbers().out('array'),
      technicalTerms: []
    };

    const sentences = this.sentenceTokenizer.sentences(text);

    sentences.forEach(sentence => {
      const words = sentence.split(/\s+/);
      words.forEach(word => {
        if (word.length > 4 && /^[A-Z][a-z]+$/.test(word)) {
          entities.technicalTerms.push(word);
        }
      });
    });

    return entities;
  }

  /**
   * Parse expected answer into individual sentences for essay grading
   * @param {string} expectedAnswer - Teacher's expected answer
   * @returns {Array} Array of expected sentences
   */
  parseExpectedSentences(expectedAnswer) {
    if (!expectedAnswer) return [];

    const sentences = this.sentenceTokenizer.sentences(expectedAnswer);
    return sentences.map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);
  }

  /**
   * Calculate syntactic similarity between two sentences (structural similarity)
   * @param {string} sentence1
   * @param {string} sentence2
   * @returns {number} Similarity score between 0 and 1
   */
  calculateSyntacticSimilarity(sentence1, sentence2) {
    try {
      const doc1 = this.nlp(sentence1);
      const doc2 = this.nlp(sentence2);

      // Extract POS tags
      const pos1 = doc1.out('tags');
      const pos2 = doc2.out('tags');

      // Simple POS sequence similarity
      const posSeq1 = pos1.map(token => token.tags[0]).join(' ');
      const posSeq2 = pos2.map(token => token.tags[0]).join(' ');

      // Calculate sequence similarity
      return this.sequenceSimilarity(posSeq1, posSeq2);
    } catch (error) {
      console.error('Syntactic similarity calculation failed:', error);
      return 0;
    }
  }

  /**
   * Calculate sequence similarity using Levenshtein distance
   * @param {string} seq1
   * @param {string} seq2
   * @returns {number} Similarity score between 0 and 1
   */
  sequenceSimilarity(seq1, seq2) {
    const longer = seq1.length > seq2.length ? seq1 : seq2;
    const shorter = seq1.length > seq2.length ? seq2 : seq1;

    if (longer.length === 0) return 1.0;

    const distance = natural.LevenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate sentence-level semantic similarity using BERT or fallback
   * @param {string} sentence1
   * @param {string} sentence2
   * @returns {Promise<number>} Similarity score between 0 and 1
   */
  async calculateSentenceSemanticSimilarity(sentence1, sentence2) {
    if (this.bertModel) {
      try {
        const embedding1 = await this.bertModel(sentence1, { pooling: 'mean', normalize: true });
        const embedding2 = await this.bertModel(sentence2, { pooling: 'mean', normalize: true });
        return this.cosineSimilarity(embedding1.data, embedding2.data);
      } catch (error) {
        console.error('BERT sentence similarity failed:', error);
      }
    }

    // Fallback to basic semantic similarity
    return this.calculateSemanticSimilarity(sentence1, sentence2);
  }

  /**
   * Match student sentences against expected sentences
   * @param {Array} studentSentences
   * @param {Array} expectedSentences
   * @param {Object} options
   * @returns {Object} Matching results
   */
  async matchSentencesToExpected(studentSentences, expectedSentences, options = {}) {
    const { syntacticWeight = 0.3, semanticWeight = 0.7, threshold = 0.6 } = options;

    const matches = [];
    const unmatchedExpected = [...expectedSentences];

    for (const studentSentence of studentSentences) {
      let bestMatch = null;
      let bestScore = 0;

      for (let i = 0; i < unmatchedExpected.length; i++) {
        const expectedSentence = unmatchedExpected[i];

        const syntacticSim = this.calculateSyntacticSimilarity(studentSentence, expectedSentence);
        const semanticSim = await this.calculateSentenceSemanticSimilarity(studentSentence, expectedSentence);

        const combinedScore = syntacticSim * syntacticWeight + semanticSim * semanticWeight;

        if (combinedScore > bestScore && combinedScore >= threshold) {
          bestScore = combinedScore;
          bestMatch = { index: i, sentence: expectedSentence, score: combinedScore };
        }
      }

      if (bestMatch) {
        matches.push({
          studentSentence,
          expectedSentence: bestMatch.sentence,
          score: bestMatch.score,
          syntacticSimilarity: this.calculateSyntacticSimilarity(studentSentence, bestMatch.sentence),
          semanticSimilarity: await this.calculateSentenceSemanticSimilarity(studentSentence, bestMatch.sentence)
        });
        unmatchedExpected.splice(bestMatch.index, 1);
      }
    }

    return {
      matched: matches,
      unmatchedExpected,
      coverage: matches.length / expectedSentences.length,
      totalExpected: expectedSentences.length,
      matchedCount: matches.length
    };
  }

  /**
   * Analyze logical organization of sentences in essay
   * @param {Array} studentSentences
   * @param {Array} expectedSentences
   * @returns {Object} Organization analysis
   */
  analyzeLogicalOrganization(studentSentences, expectedSentences) {
    const organization = {
      expectedOrderFound: 0,
      logicalFlow: [],
      coherenceScore: 0
    };

    // Simple approach: check if expected sentences appear in similar order
    let lastExpectedIndex = -1;

    for (const studentSentence of studentSentences) {
      for (let i = 0; i < expectedSentences.length; i++) {
        const expectedSentence = expectedSentences[i];
        const similarity = this.calculateSemanticSimilarity(studentSentence, expectedSentence);

        if (similarity > 0.7) { // High similarity threshold
          if (i > lastExpectedIndex) {
            organization.expectedOrderFound++;
            lastExpectedIndex = i;
          }
          organization.logicalFlow.push({
            studentSentence,
            expectedSentence,
            position: i,
            similarity
          });
          break;
        }
      }
    }

    organization.coherenceScore = expectedSentences.length > 0 ?
      organization.expectedOrderFound / expectedSentences.length : 0;

    return organization;
  }

  /**
   * Enhanced essay grading with sentence-level matching and completeness scoring
   * @param {string} studentAnswer
   * @param {string} expectedAnswer
   * @param {Object} options
   * @returns {Promise<Object>} Comprehensive grading result
   */
  async gradeEssayWithSentenceMatching(studentAnswer, expectedAnswer, options = {}) {
    const {
      useBERT = true,
      keywordWeight = 0.3,
      sentenceWeight = 0.4,
      completenessWeight = 0.2,
      organizationWeight = 0.1,
      syntacticWeight = 0.3,
      semanticWeight = 0.7,
      sentenceThreshold = 0.6
    } = options;

    // Parse expected sentences
    const expectedSentences = this.parseExpectedSentences(expectedAnswer);
    const studentSentences = this.sentenceTokenizer.sentences(studentAnswer);

    // Keyword matching (existing functionality)
    const keywordResult = this.gradeEssay(studentAnswer, expectedAnswer, options);

    // Sentence-level matching
    const sentenceMatches = await this.matchSentencesToExpected(
      studentSentences,
      expectedSentences,
      { syntacticWeight, semanticWeight, threshold: sentenceThreshold }
    );

    // Logical organization analysis
    const organizationAnalysis = this.analyzeLogicalOrganization(studentSentences, expectedSentences);

    // Calculate completeness score
    const completenessScore = sentenceMatches.coverage;

    // Calculate final score
    const keywordScore = keywordResult.score * keywordWeight;
    const sentenceScore = sentenceMatches.coverage * sentenceWeight;
    const completenessScoreWeighted = completenessScore * completenessWeight;
    const organizationScore = organizationAnalysis.coherenceScore * organizationWeight;

    const totalScore = keywordScore + sentenceScore + completenessScoreWeighted + organizationScore;

    return {
      ...keywordResult,
      score: Math.min(totalScore, 1.0),
      sentenceMatches,
      organizationAnalysis,
      completenessScore,
      componentScores: {
        keywords: keywordScore,
        sentences: sentenceScore,
        completeness: completenessScoreWeighted,
        organization: organizationScore
      },
      analysis: this.generateSentenceMatchingAnalysis(
        keywordResult,
        sentenceMatches,
        organizationAnalysis,
        completenessScore
      )
    };
  }

  /**
   * Generate analysis for sentence matching grading
   */
  generateSentenceMatchingAnalysis(keywordResult, sentenceMatches, organizationAnalysis, completenessScore) {
    let analysis = keywordResult.analysis;

    analysis += ` | Sentence coverage: ${sentenceMatches.matchedCount}/${sentenceMatches.totalExpected} (${Math.round(completenessScore * 100)}%)`;

    if (organizationAnalysis.coherenceScore > 0) {
      analysis += ` | Logical organization: ${Math.round(organizationAnalysis.coherenceScore * 100)}%`;
    }

    if (sentenceMatches.unmatchedExpected.length > 0) {
      analysis += ` | Missing key points: ${sentenceMatches.unmatchedExpected.length}`;
    }

    return analysis;
  }

  /**
   * Comprehensive essay grading combining keywords, semantics, structure, and entities with weighting
   */
  async gradeEssayComprehensive(studentAnswer, correctAnswer, rubric = {}, options = {}) {
    const {
      useBERT = true,
      analyzeSentences = true,
      extractEntities = true,
      useSentenceMatching = true,
      weights = {
        keywords: 0.3,
        semantics: 0.2,
        sentences: 0.3,
        structure: 0.1,
        entities: 0.1
      }
    } = options;

    const keywordResult = this.gradeEssay(studentAnswer, correctAnswer, options);

    let semanticSimilarity = 0;
    if (useBERT) {
      semanticSimilarity = await this.calculateBERTSimilarity(studentAnswer, correctAnswer);
    } else {
      semanticSimilarity = this.calculateSemanticSimilarity(studentAnswer, correctAnswer);
    }

    const sentenceAnalysis = analyzeSentences ? this.analyzeSentenceStructure(studentAnswer) : {};
    const entities = extractEntities ? this.extractNamedEntities(studentAnswer) : {};

    let sentenceMatchingResult = {};
    if (useSentenceMatching) {
      sentenceMatchingResult = await this.gradeEssayWithSentenceMatching(studentAnswer, correctAnswer, options);
    }

    const keywordScore = keywordResult.score * weights.keywords;
    const semanticScore = semanticSimilarity * weights.semantics;
    const sentenceScore = (sentenceMatchingResult.completenessScore || 0) * weights.sentences;
    const structureScore = sentenceAnalysis.coherenceScore * weights.structure;
    const entityScore = (entities.technicalTerms && entities.technicalTerms.length > 0 ? 0.5 : 0) * weights.entities;

    const totalScore = keywordScore + semanticScore + sentenceScore + structureScore + entityScore;

    return {
      ...keywordResult,
      score: Math.min(totalScore, 1.0),
      semanticSimilarity,
      sentenceAnalysis,
      entities,
      sentenceMatching: sentenceMatchingResult,
      componentScores: {
        keywords: keywordScore,
        semantics: semanticScore,
        sentences: sentenceScore,
        structure: structureScore,
        entities: entityScore
      },
      analysis: this.generateComprehensiveAnalysis(keywordResult, semanticSimilarity, sentenceAnalysis, entities)
    };
  }

  /**
   * Generate comprehensive grading analysis summary
   */
  generateComprehensiveAnalysis(keywordResult, semanticSimilarity, sentenceAnalysis, entities) {
    let analysis = keywordResult.analysis;

    analysis += ` | Semantic similarity: ${Math.round(semanticSimilarity * 100)}%`;

    if (sentenceAnalysis && sentenceAnalysis.totalSentences > 0) {
      analysis += ` | Sentences: ${sentenceAnalysis.totalSentences}, Coherence: ${Math.round(sentenceAnalysis.coherenceScore * 100)}%`;
    }

    if (entities && entities.technicalTerms && entities.technicalTerms.length > 0) {
      analysis += ` | Technical terms: ${entities.technicalTerms.length}`;
    }

    return analysis;
  }
}

module.exports = new EssayGradingService();

/**
 * Part 1: Imports and setup for the manual test script.
 * Runs standalone without test framework.
 */
const request = require('supertest');
const app = require('../../api/server'); // Adjust path if necessary
const mongoose = require('mongoose');
const Quiz = require('../../models/Quiz');
const QuizSubmission = require('../../models/QuizSubmission');
const { ObjectId } = mongoose.Types;

const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validations
const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('display_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Display name must be less than 50 characters'),
  handleValidationErrors
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Post validations
const createPostValidation = [
  body('content')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Content must be less than 2000 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'followers'])
    .withMessage('Visibility must be public, private, or followers'),
  body('media_urls')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 media files allowed'),
  handleValidationErrors
];

const updatePostValidation = [
  body('content')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Content must be less than 2000 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'followers'])
    .withMessage('Visibility must be public, private, or followers'),
  handleValidationErrors
];

// Comment validations
const createCommentValidation = [
  body('content')
    .notEmpty()
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters'),
  handleValidationErrors
];

// User profile validations
const updateProfileValidation = [
  body('display_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Display name must be less than 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Valid URL is required'),
  handleValidationErrors
];

// Message validations
const sendMessageValidation = [
  body('content')
    .notEmpty()
    .isLength({ max: 5000 })
    .withMessage('Message must be less than 5000 characters'),
  handleValidationErrors
];

// Story validations
const createStoryValidation = [
  body('media_url')
    .notEmpty()
    .isURL()
    .withMessage('Valid media URL is required'),
  body('media_type')
    .optional()
    .isIn(['image', 'video'])
    .withMessage('Media type must be image or video'),
  body('caption')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Caption must be less than 200 characters'),
  handleValidationErrors
];

// Pagination validations
const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .toInt()
    .withMessage('Offset must be a non-negative integer'),
  handleValidationErrors
];

// UUID validation
const uuidValidation = (field) => [
  param(field)
    .isUUID()
    .withMessage(`Invalid ${field} format`),
  handleValidationErrors
];

// Search validation
const searchValidation = [
  query('q')
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be 2-100 characters'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  signupValidation,
  loginValidation,
  createPostValidation,
  updatePostValidation,
  createCommentValidation,
  updateProfileValidation,
  sendMessageValidation,
  createStoryValidation,
  paginationValidation,
  uuidValidation,
  searchValidation
};

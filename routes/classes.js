const express = require('express');
const router = express.Router();
const { getClasses, getClassById, createClass, getRecommendations } = require('../controllers/classcontroller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getClasses);
router.get('/recommendations', protect, getRecommendations);
router.get('/:id', getClassById);
router.post('/', protect, authorize('trainer', 'admin'), createClass);

module.exports = router;
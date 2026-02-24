const express = require('express');
const Buzz = require('../models/Buzz');
const adminAuth = require('../middleware/adminAuth');
const { getIo } = require('../socket');

const router = express.Router();

const formatTimeAndDate = (timestamp) => {
  const date = new Date(timestamp);

  const time = new Intl.DateTimeFormat('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  }).format(date);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);

  return {
    time,
    date: formattedDate,
  };
};

router.post('/', async (req, res) => {
  try {
    const { teamName, timestamp } = req.body;

    if (!teamName || typeof teamName !== 'string' || !String(teamName).trim()) {
      return res.status(400).json({ message: 'teamName is required' });
    }

    if (typeof timestamp !== 'number') {
      return res.status(400).json({ message: 'timestamp must be a number' });
    }

    const formatted = formatTimeAndDate(timestamp);

    const buzz = await Buzz.create({
      teamName: teamName.trim(),
      timestamp,
      time: formatted.time,
      date: formatted.date,
    });

    const io = getIo();
    if (io) {
      io.emit('new-buzz', buzz);
    }

    return res.status(201).json(buzz);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to store buzz', error: error.message });
  }
});

router.get('/', async (_req, res) => {
  try {
    const buzzes = await Buzz.find().sort({ timestamp: 1, _id: 1 });
    return res.json(buzzes);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch buzzes', error: error.message });
  }
});

router.delete('/', adminAuth, async (_req, res) => {
  try {
    await Buzz.deleteMany({});
    return res.json({ message: 'All buzz records cleared' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to clear buzzes', error: error.message });
  }
});

module.exports = router;

import { Router } from 'express';
import { searchLocations } from '../geocode.js';

const router = Router();

router.get('/search', async (req, res) => {
  const query = String(req.query.q ?? '').trim();
  if (query.length < 2) {
    return res.json([]);
  }
  const results = await searchLocations(query);
  res.json(results);
});

export default router;

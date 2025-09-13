import express from 'express';
import registry from '@/schemas/ssc.json';
import { diffSchemas } from '@/features/registry/diff';

const router = express.Router();

router.get('/registry', (req, res) => {
  res.json({ versions: registry.versions, defaultVersion: registry.defaultVersion });
});

router.get('/registry/:version', (req, res) => {
  const version = req.params.version;
  const schema = registry.versions.find((v) => v.version === version);
  if (!schema) return res.status(404).json({ error: 'Version not found' });
  res.json(schema);
});

router.post('/registry/rollback', (req, res) => {
  registry.defaultVersion = 'fallback';
  registry.versions.push({ version: 'fallback', ...registry.fallback });
  res.json({ status: 'Rolled back to fallback' });
});

router.get('/registry/diff/:version', (req, res) => {
  const version = req.params.version;
  const schema = registry.versions.find((v) => v.version === version);
  if (!schema) return res.status(404).json({ error: 'Version not found' });

  const changes = diffSchemas(schema, registry.fallback);
  res.json({ changes });
});

export default router;
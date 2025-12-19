import { Router } from 'express';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'workspace-platform-api',
  });
});

// API routes will be added here
// Example: router.use('/auth', authRoutes);
// Example: router.use('/workspaces', workspaceRoutes);

export default router;


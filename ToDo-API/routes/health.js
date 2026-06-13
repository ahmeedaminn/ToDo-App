import express from 'express';
const router = express.Router();


// Health check endpoint
// The dedicated Load Balancer health check route
router.get('/', (req, res) => {
    res.status(200).send('OK');
});

export default router;
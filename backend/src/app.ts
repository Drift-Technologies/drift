import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import routes from './routes';
import config from './config';
import paymentRoutes from './routes/payment';
import userRoutes from './routes/user';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
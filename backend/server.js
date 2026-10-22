require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected');

   app.listen(PORT, "::", () => {
  console.log(`Server running at http://localhost:${PORT}`);
  });
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
}

start();
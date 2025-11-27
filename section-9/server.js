const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require('./app');

//Connect Database
mongoose.connect(process.env.DATABASE)
  .then(() => {
    console.log('Database Connected Successfully.');
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });

// START SERVER
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
})
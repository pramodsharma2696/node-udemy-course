const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  process.exit(1);
});


dotenv.config({ path: './config.env' });

const app = require('./app');

// Connect Database
mongoose.connect(process.env.DATABASE)
  .then(() => console.log('Database Connected Successfully.'))
  // .catch(err => {
  //   console.error('Database Connection Error:', err.message);
  // });

// START SERVER
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});


// Global handler for promise rejections
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

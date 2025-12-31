const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Handle synchronous errors that are not caught anywhere
process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  process.exit(1);  // Exit the process immediately
});

// Load environment variables from config.env file
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


// Handle rejected promises that are not caught
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  // Gracefully close the server before exiting process
  server.close(() => {
    process.exit(1);
  });
});

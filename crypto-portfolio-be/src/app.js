const cors = require('cors');
const express = require('express');
const env = require('./configs/env.config');
const initRoutes = require('./routes/index.route');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

const normalizeOrigin = (origin) => String(origin || '').trim().replace(/\/$/, '');
const allowedOrigins = env.server.clientUrls.map(normalizeOrigin);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);
app.use(express.json({ limit: env.server.requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: env.server.requestBodyLimit }));

initRoutes(app);
app.use(errorHandler);

module.exports = app;


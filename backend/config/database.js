const dotenv = require("dotenv");
const { Sequelize } = require("sequelize");

dotenv.config({ path: "./.env" });

const SLOW_QUERY_MS = Number(process.env.DB_SLOW_QUERY_MS || 200);

const db = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  logging: (sql, timing) => {
    if (typeof timing === "number" && timing >= SLOW_QUERY_MS) {
      console.warn(`[SLOW SQL ${timing} ms] ${sql}`);
    }
  },
  benchmark: true,

  define: {
    timestamps: false,
  },

  pool: {
    max: Number(process.env.DB_POOL_MAX || 10),
    min: Number(process.env.DB_POOL_MIN || 2),
    acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
    idle: Number(process.env.DB_POOL_IDLE || 10000),
    evict: Number(process.env.DB_POOL_EVICT || 1000),
  },
});

module.exports = { db };

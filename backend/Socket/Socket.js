const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { QueryTypes } = require("sequelize");
const { db } = require("../config/database");

const initSocket = (server) => {
  const io = new Server(server, {
    path: "/api/socket.io",
    cors: { origin: process.env.CORS_ORIGIN?.split(",") || "*" },
  });

  const userSockets = new Map();

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("missing token"));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      const [row] = await db.query(
        "SELECT api_token FROM personal WHERE IDPERSONAL = :id LIMIT 1",
        { replacements: { id: payload.id }, type: QueryTypes.SELECT },
      );
      if (!row || row.api_token !== token)
        return next(new Error("stale token"));

      socket.userId = payload.id;
      return next();
    } catch {
      return next(new Error("invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket;

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }

    const sockets = userSockets.get(userId);
    sockets.add(socket.id);

    socket.on("disconnect", () => {
      const sockets = userSockets.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);

      if (sockets.size === 0) {
        userSockets.delete(userId);
      }
    });
  });

  function notifyPreviousSession(userId) {
    const sockets = userSockets.get(userId);
    if (!sockets) return;

    for (const socketId of sockets) {
      io.to(socketId).emit("force-logout", {
        reason: "Nueva sesión iniciada",
      });

      io.sockets.sockets.get(socketId)?.disconnect(true);
    }

    userSockets.delete(userId);
  }

  return { io, notifyPreviousSession };
};

module.exports = { initSocket };

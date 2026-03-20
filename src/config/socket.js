const { Server } = require("socket.io");
const corsOptions = require("./cors");

let io;

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: corsOptions,
        });

        io.on("connection", (socket) => {
            console.log("Nuevo cliente conectado con ID:", socket.id);

            socket.on("disconnect", () => {
                console.log("Cliente desconectado:", socket.id);
            });
        });

        return io;
    },

    getIO: () => {
        if (!io) {
            throw new Error("¡Socket.io no ha sido inicializado!");
        }
        return io;
    }
};

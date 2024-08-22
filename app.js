const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// Configurar el motor de plantillas
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// Servir archivos estáticos
app.use(express.static(__dirname + "/public"));

// Rutas Web
app.use(require("./Routers/rutasWeb.router.js"));

// Iniciar el servidor
app.listen(port,() => {
    console.log("Servidor iniciado... " + "Puerto:" + port);
});
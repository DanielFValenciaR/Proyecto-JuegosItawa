const {Router} = require("express");
const router = Router();
const path = require('path');
const fs = require('fs');

router.get("/", (req, res) => {
    res.render("index");
});

router.get("/cuentas-compartidas", (req, res) => {
    res.render("cuentasCompartidas");
});

router.get("/cuentas-principales-secundarias", (req, res) => {
    res.render("cuentasPrincipalesSecundarias"); 
});

router.get("/catalogo=:platform", (req, res) => {
    let platform = req.params.platform;

    if (platform === "xbox") {
        res.render("catalogoXbox"); 
    } else if (platform === "playstation") {
        res.render("catalogoPlay");
    } else {
        res.status(404).send('Página no encontrada'); 
    }
});

router.get("/buscar", (req, res) => {
    const query = req.query.q.toLowerCase(); // Obtener la consulta de búsqueda
    const busqueda = req.query.q;

    /// Ruta del archivo JSON
    const catalogPath = path.join(__dirname, '../public/Data/catalogo.json');

    fs.readFile(catalogPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al cargar el catálogo:', err);
            return res.status(500).json({ error: 'Error al cargar el catálogo' });
        }

        const catalogo = JSON.parse(data);

        // Filtrar los juegos según la consulta
        let resultados = [];

        if (catalogo.xbox) {
            resultados = resultados.concat(catalogo.xbox.filter(game =>
                game.nombre.toLowerCase().includes(query) ||
                game.genero.toLowerCase().includes(query)
            ).map(game => ({ ...game, platform: "xbox" })));
        }

        if (catalogo.playstation) {
            resultados = resultados.concat(catalogo.playstation.filter(game =>
                game.nombre.toLowerCase().includes(query) ||
                game.genero.toLowerCase().includes(query)
            ).map(game => ({ ...game, platform: "play" })));
        }

        // for (let consola in catalogo) {
        //     let juegos = catalogo[consola].filter(juego => 
        //         juego.nombre.toLowerCase().includes(query) || 
        //         juego.genero.toLowerCase().includes(query)
        //     );
        //     resultados = resultados.concat(juegos);
        // };

        res.render('resultadosBusqueda', { query, resultados, busqueda }); // Renderiza la vista de resultados
    });
});

module.exports = router;
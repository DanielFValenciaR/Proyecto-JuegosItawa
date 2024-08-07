export async function fetchGet(url, callback) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        callback(data);
    } catch (error) {
        console.error('Error al cargar los datos:', error);
    }
}

function searchProduct() {
    const buscador = document.getElementById('searchInput').value.toLowerCase();
    const inputBuscar = document.getElementById('searchInput').value;
    const results = document.getElementById('results-container');
    const contenido = document.querySelector('.content'); //Capturar los elementos que vamos a ocultar para mostrar las tarjetas

    contenido.classList.add('hidden'); //Ocultar elementos (Hay que ponerlo en css)
    results.innerHTML = '';

    fetchGet('/Json-db/catalogo.json', function (data) {
        let resultados = [];

        if (data.xbox && Array.isArray(data.xbox)) {
            resultados = resultados.concat(data.xbox.filter(game =>
                game.nombre.toLowerCase().includes(buscador) ||
                game.genero.toLowerCase().includes(buscador)
            ).map(game => ({...game, platform: "xbox"})));
        }

        if (data.playStation && Array.isArray(data.playStation)) {
            resultados = resultados.concat(data.playStation.filter(game =>
                game.nombre.toLowerCase().includes(buscador) ||
                game.genero.toLowerCase().includes(buscador)
            ).map(game => ({...game, platform: "play"})));
        }

        if (resultados.length > 0) {
            resultados.forEach(game => {
                const gameSection = document.createElement('section');
                gameSection.classList.add('card-game');

                const backClass = game.platform === 'xbox' ? 'xbox' : 'play';

                let lanzamiento = new Date(game.lanzamiento);
                let opcionesFecha = { day: '2-digit', month: '2-digit', year: 'numeric' };

                const fecha = lanzamiento.toLocaleDateString('es-ES', opcionesFecha);

                gameSection.innerHTML = `
                    <div class="face front">
                        <img src="${game.imagen}" alt="Imagen videojuego ${game.nombre}">
                    </div>
                    <div class="face back ${backClass}">
                        <h3>${game.nombre}</h3>
                        <iframe width="100%" height="100%" src="${game.video}" 
                            title="YouTube video player" frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                        <div class="details-container">
                            <ul>
                                <li><b>Género: </b>${game.genero}</li>
                                <li><b>Lanzamiento: </b>${fecha}</li>
                            </ul>
                        </div>
                    </div>`;
                results.appendChild(gameSection);
            });
            results.classList.add('active');
        } else {
            const noGames = document.createElement('div');
            noGames.classList.add('active2');

            noGames.innerHTML = `
                <img src="/Styles/Images/NoEncontrado/no-results.svg" alt="Icono no encontrado">
                <span>Lo sentimos, no se encontraron resultados para su búsqueda:</span>
                <strong><u>${inputBuscar}</u></strong>
                <span>Pruebe con términos de búsqueda diferentes.</span>`;

            results.appendChild(noGames);
        }
    });
}

const btnBuscar = document.getElementById('btnBuscar');
btnBuscar.addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = "#results-container";
    searchProduct();
}); 
// Forzar el scroll hasta la parte superior de la pantalla cuando la página se recarga
window.scrollTo(0, 0);

// Función matemática para generar los números de la paginación (ej: 1, 2, ..., 5, 6, 7, ..., 10)
function getPageList(totalPages, page, maxLength) {

    // Función auxiliar que crea un array de números secuenciales (ej: range(1,5) devuelve [1,2,3,4,5])
    function range(start, end) {
        return Array.from(Array(end - start + 1), (_, i) => i + start);
    }

    // Determina cuántos números mostrar a los lados dependiendo del tamaño máximo permitido
    let sideWidth = maxLength < 9 ? 1:2;
    let leftWidth = (maxLength - sideWidth * 2 - 3) >> 1;
    let rightWidth = (maxLength - sideWidth * 2 - 3) >> 1;

    // Si el total de páginas es pequeño, simplemente devuelve todos los números (ej: 1, 2, 3)
    if (totalPages <= maxLength) {
        return range(1, totalPages);
    }

    // Caso 1: Estamos en las primeras páginas (Muestra el inicio y recorta el final con "...")
    if (page <= maxLength - sideWidth - 1 - rightWidth) {
        return range(1, maxLength - sideWidth - 1).concat(0, range(totalPages - sideWidth + 1, totalPages));
    }

    // Caso 2: Estamos en las últimas páginas (Recorta el inicio con "..." y muestra el final)
    if (page >= totalPages - sideWidth - 1 - rightWidth) {
        return range(1, sideWidth).concat(0, range(totalPages - sideWidth - 1 - rightWidth - leftWidth, totalPages));
    }

    // Caso 3: Estamos en el medio (Muestra inicio, "...", números actuales, "...", final)
    return range(1, sideWidth).concat(0, range(page - leftWidth, page + rightWidth), 0, range(totalPages - sideWidth + 1, totalPages)); 
}

// Función asíncrona para descargar el archivo JSON con todo el catálogo
async function fetchGet(url, callback) {
    try {
        const res = await fetch(url); // Pide el archivo al servidor
        const data = await res.json(); // Lo convierte a un formato que JavaScript pueda leer
        callback(data); // Ejecuta el resto del código enviándole estos datos listos
    } catch (error) {
        console.error('Error al cargar los datos:', error);
    }
}

// Espera a que todo el HTML de la página termine de cargar antes de ejecutar este código
document.addEventListener("DOMContentLoaded", function() {
    let cardsContainer = document.querySelector(".cards-container"); // Selecciona la caja donde irán los juegos
    let urlParams = new URLSearchParams(window.location.search); // Lee los parámetros de la URL (ej: ?page=2)
    let path = window.location.pathname; // Lee la ruta actual (ej: /catalogo=xbox)
    let platform = path.split('=')[1]; // Extrae solo el nombre de la plataforma ('xbox' o 'playstation')
    
    // Llamamos a nuestro JSON y le pasamos la información
    fetchGet('/Data/catalogo.json', function (data) {
        let games = data[platform]; // Extraemos únicamente los juegos de la plataforma en la que estamos

        // Verificamos que la información exista y sea una lista válida
        if (games && Array.isArray(games)) {
            
            // 🚀 SOLUCIÓN 1: ORDENAR EL JSON ANTES DE DIBUJAR
            // Aquí ordenamos la base de datos de juegos comparando sus fechas de lanzamiento.
            games.sort(function(a, b) {
                let fechaA = new Date(a.lanzamiento);
                let fechaB = new Date(b.lanzamiento);
                
                // Escudo protector: Si la fecha dice "Fecha no encontrada", la mandamos al año 1900 
                // para que esos juegos queden al final y no rompan el orden de los nuevos.
                if (isNaN(fechaA.getTime())) fechaA = new Date("1900-01-01");
                if (isNaN(fechaB.getTime())) fechaB = new Date("1900-01-01");

                // Restamos la fecha B menos la A para que el orden sea Descendente (más nuevos arriba)
                return fechaB - fechaA; 
            });

            // Recorremos la lista de juegos (ya ordenada) uno por uno
            games.forEach(juego => {
                const gameSection = document.createElement('section'); // Crea la tarjeta del juego
                gameSection.classList.add('card');
                
                // Le guardamos atributos ocultos con su fecha y link de video
                gameSection.setAttribute('data-launch', juego.lanzamiento);
                gameSection.setAttribute('data-video', juego.video);

                // Define el color de fondo de la tarjeta (verde si es Xbox, azul si es Play)
                const backClass = platform === 'xbox' ? 'xbox' : 'play';

                // Intentamos convertir el texto de la fecha a un formato real (DD/MM/YYYY)
                let lanzamiento = new Date(juego.lanzamiento);
                let fechaTexto = "Fecha no disponible";
                
                // Si la fecha es válida, la formateamos al estilo español
                if (!isNaN(lanzamiento.getTime())) {
                    let opcionesFecha = { day: '2-digit', month: '2-digit', year: 'numeric' };
                    fechaTexto = lanzamiento.toLocaleDateString('es-ES', opcionesFecha);
                } else {
                    // Si decía "Fecha no encontrada", dejamos el texto original tal cual
                    fechaTexto = juego.lanzamiento; 
                }
    
                // Inyectamos todo el diseño HTML dentro de la tarjeta
                gameSection.innerHTML = `
                    <div class="face front">
                        <img src="${juego.imagen}" alt="Imagen videojuego ${juego.nombre}">
                    </div>
                    <div class="face back ${backClass}">
                        <h3>${juego.nombre}</h3>
                        <iframe width="100%" height="100%" src="${juego.video}" 
                            title="YouTube video player" frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                        <div class="details-container">
                            <ul>
                                <li><b>Género: </b>${juego.genero}</li>
                                <li><b>Lanzamiento: </b>${fechaTexto}</li>
                            </ul>
                        </div>
                    </div>`;
                
                // Agregamos esta tarjeta física al contenedor en la pantalla
                cardsContainer.appendChild(gameSection);
            });
            
            // --- CÁLCULOS DE LA PAGINACIÓN ---
            let numberOfItems = document.querySelectorAll(".cards-container .card").length; // Cuenta cuántos juegos hay en total
            let limitPerPage = getLimitPerPage(); // Obtiene cuántos juegos caben por página
            let totalPages = Math.ceil(numberOfItems / limitPerPage); // Calcula cuántas páginas habrá en total
            let paginationSize = getPaginationSize(); // Define el tamaño visual de los botones numéricos
            
            // Lee la URL para saber en qué página estamos (si no hay ninguna, asume la página 1)
            let currentPage = parseInt(urlParams.get('page')) || 1;

            // Función para decidir cuántas tarjetas mostrar según si estamos en PC, tablet o celular
            function getLimitPerPage() {
                if (window.innerWidth < 1200) {
                    return 8; // Pantallas medianas/pequeñas: 8 tarjetas
                } else {
                    return 9; // Pantallas grandes: 9 tarjetas (cuadrícula perfecta de 3x3)
                }
            };

            // Función para hacer más pequeña la barra de paginación en celulares
            function getPaginationSize() {
                if (window.innerWidth < 768) {
                    return 5; 
                } else if (window.innerWidth <= 992) {
                    return 7;
                } else {
                    return 9;
                }
            };

            // 🚀 EL MOTOR PRINCIPAL: Función que se encarga de mostrar la página correcta
            function showPage(wichPage) {
                // Si piden una página que no existe (ej: página -1 o página 100), no hace nada
                if (wichPage < 1 || wichPage > totalPages) return false;
                currentPage = wichPage;

                // Cambia la URL en la barra de direcciones del navegador sin recargar la página
                history.pushState(null, null, `/catalogo=${platform}?page=${currentPage}`);

                // APAGAR VIDEOS: Le quita el link a todos los iframes para que los videos 
                // de las páginas ocultas dejen de consumir internet y memoria.
                let youtubeIframes = document.querySelectorAll(".cards-container .card iframe");
                youtubeIframes.forEach(function(iframe) {
                    iframe.setAttribute("loading", "lazy");
                    iframe.removeAttribute("src");
                });

                // Calcula desde qué tarjeta hasta qué tarjeta se deben mostrar en esta página
                // Ej página 1: Del índice 0 al 9. Página 2: Del 9 al 18.
                let startIndex = (currentPage - 1) * limitPerPage;
                let endIndex = currentPage * limitPerPage;

                // 🚀 SOLUCIÓN 2: OCULTAR Y MOSTRAR SIN DESORDENAR
                let cards = document.querySelectorAll(".cards-container .card");

                // Recorremos todas las tarjetas físicas
                cards.forEach(function (card, index) {
                    // Si el juego está dentro del rango de esta página...
                    if (index >= startIndex && index < endIndex) {
                        card.style.display = "block"; // ...lo hacemos visible

                        // Y le inyectamos su link de video correspondiente para que se pueda reproducir
                        let iframe = card.querySelector("iframe");
                        let videoUrl = card.dataset.video; 
                        if (iframe && videoUrl && videoUrl !== "No se pudo extraer") {
                            iframe.setAttribute("src", videoUrl);
                        }
                    } else {
                        // Si no pertenece a esta página, lo ocultamos (sin borrarlo del HTML)
                        card.style.display = "none";
                    }
                });

                updatePagination(); // Actualiza los colores y botones numéricos de abajo
                return true;
            };

            // Función que redibuja la barra de numeritos abajo (1, 2, ..., 8, 9)
            function updatePagination() {
                let paginationItems = document.querySelectorAll(".paginacion li");

                // Borra todos los números viejos, dejando solo los botones de "Anterior" (<) y "Siguiente" (>)
                for (let i = 1; i < paginationItems.length - 1; i++) {
                    paginationItems[i].parentNode.removeChild(paginationItems[i]);
                }

                // Genera la nueva lista matemática de botones numéricos
                getPageList(totalPages, currentPage, paginationSize).forEach(item => {
                    let liElement = document.createElement("li");
                    liElement.classList.add("page-item"); 

                    // Si es un número le pone la clase "current-page", si es un 0 lo vuelve "..."
                    if (item) {
                        liElement.classList.add("current-page");
                    } else {
                        liElement.classList.add("dots");
                    }

                    // Si es la página en la que estamos parados, la pinta de azul/verde (active)
                    if (item === currentPage) {
                        liElement.classList.add("active");
                    }

                    // Crea el enlace (<a>) clickeable
                    let aElement = document.createElement("a");
                    aElement.classList.add("page-link");
                    aElement.setAttribute("href", "javascript:void(0)");
                    aElement.textContent = item || "..."; // Escribe el número o los puntos suspensivos
                    liElement.appendChild(aElement);

                    // Inserta este nuevo botón numérico justo antes del botón ">"
                    let nextPageElement = document.querySelector(".next-page");
                    nextPageElement.parentNode.insertBefore(liElement, nextPageElement);
                });

                // Si estamos en la página 1, apaga (disable) el botón de retroceder "<"
                let previousPageElement = document.querySelector(".previous-page");
                previousPageElement.classList.toggle("disable", currentPage === 1);

                // Si estamos en la última página, apaga el botón de avanzar ">"
                let nextPageElement = document.querySelector(".next-page");
                nextPageElement.classList.toggle("disable", currentPage === totalPages);
            };

            // --- CREACIÓN DE BOTONES FIJOS ---
            // Construye el botón "Anterior" (<)
            let previousPageListItem = document.createElement("li");
            previousPageListItem.classList.add("page-item");
            previousPageListItem.classList.add("previous-page");

            let previousPageLink = document.createElement("a");
            previousPageLink.classList.add("page-link");
            previousPageLink.setAttribute("href", "javascript:void(0)");
            previousPageLink.textContent = "<";

            // Construye el botón "Siguiente" (>)
            let nextPageListItem = document.createElement("li");
            nextPageListItem.classList.add("page-item");
            nextPageListItem.classList.add("next-page");

            let nextPageLink = document.createElement("a");
            nextPageLink.classList.add("page-link");
            nextPageLink.setAttribute("href", "javascript:void(0)");
            nextPageLink.textContent = ">";

            previousPageListItem.appendChild(previousPageLink);
            nextPageListItem.appendChild(nextPageLink);

            let paginationList = document.querySelector(".paginacion");
            paginationList.appendChild(previousPageListItem);
            paginationList.appendChild(nextPageListItem);

            // EJECUCIÓN INICIAL: Muestra la página 1 al apenas cargar la web
            showPage(currentPage);

            // --- EVENTOS DE CLIC ---
            // Escucha cuando el usuario hace clic en cualquier NÚMERO de la paginación
            document.addEventListener("click", function(event) {
                // Si hizo clic en un número que NO es en el que ya está parado...
                if (event.target.matches(".paginacion li.current-page:not(.active) a")) {
                    let pageNumber = +event.target.textContent; // Lee el número
                    cardsContainer.scrollIntoView({ behavior: "smooth" }); // Sube la pantalla suavemente
                    event.preventDefault();
                    return showPage(pageNumber); // Ejecuta la magia para mostrar esa página
                }
            });   
    
            // Escucha cuando el usuario hace clic en el botón ">"
            let nextPageElement = document.querySelector(".next-page");
            nextPageElement.addEventListener("click", function(event) {
                cardsContainer.scrollIntoView({ behavior: "smooth" });
                event.preventDefault();
                return showPage(currentPage + 1); // Suma 1 a la página actual
            });

            // Escucha cuando el usuario hace clic en el botón "<"
            let previousPageElement = document.querySelector(".previous-page");
            previousPageElement.addEventListener("click", function(event) {
                cardsContainer.scrollIntoView({ behavior: "smooth" });
                event.preventDefault();
                return showPage(currentPage - 1); // Resta 1 a la página actual
            });
        };
    });
});
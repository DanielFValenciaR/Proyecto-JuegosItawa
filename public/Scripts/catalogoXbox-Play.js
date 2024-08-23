// Forzar el scroll hasta la parte superior cuando la página se recarga
window.scrollTo(0, 0);

// Función para obtener la lista de páginas para la paginación
function getPageList(totalPages, page, maxLength) {

    // Función auxiliar que genera un array de números en un rango dado
    function range(start, end) {
        // Crea un array que contiene todos los números enteros desde 'start' hasta 'end'
        // Por ejemplo, range(1, 5) devolverá [1, 2, 3, 4, 5]
        return Array.from(Array(end - start + 1), (_, i) => i + start);
    }

    // Determina el ancho de los lados en la paginación.
    // Si maxLength es menor que 9, el valor de sideWidth es 1; de lo contrario, es 2.
    let sideWidth = maxLength < 9 ? 1:2;

    // Calcula el ancho del lado izquierdo de la paginación
    // Esto distribuye el espacio restante de manera uniforme entre los lados izquierdo y derecho
    let leftWidth = (maxLength - sideWidth * 2 - 3) >> 1;
    
    /// El lado derecho tiene el mismo ancho que el lado izquierdo
    let rightWidth = (maxLength - sideWidth * 2 - 3) >> 1;

    // Si el total de páginas es menor o igual a maxLength, se devuelven todas las páginas
    if (totalPages <= maxLength) {
        return range(1, totalPages);
    }

    // Caso 1: La página actual está al principio de la paginación
    // Muestra un rango de páginas iniciales seguido de "..."
    if (page <= maxLength - sideWidth - 1 - rightWidth) {
        return range(1, maxLength - sideWidth - 1).concat(0, range(totalPages - sideWidth + 1, totalPages));
    }

    // Caso 2: La página actual está cerca del final de la paginación
    // Muestra "..." seguido de un rango de páginas finales
    if (page >= totalPages - sideWidth - 1 - rightWidth) {
        return range(1, sideWidth).concat(0, range(totalPages - sideWidth - 1 - rightWidth - leftWidth, totalPages));
    }

    // Caso 3: La página actual está en el medio de la paginación
    // Muestra los primeros y últimos números de página, con "..." en medio
    return range(1, sideWidth).concat(0, range(page - leftWidth, page + rightWidth), 0, range(totalPages - sideWidth + 1, totalPages)); 
}

// Función para hacer una petición GET y procesar el resultado con un callback
async function fetchGet(url, callback) {
    try {
        const res = await fetch(url); // Realiza la solicitud a la URL especificada
        const data = await res.json(); // Convierte la respuesta a formato JSON
        callback(data); // Llama a la función callback pasando los datos obtenidos
    } catch (error) {
        console.error('Error al cargar los datos:', error);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    let cardsContainer = document.querySelector(".cards-container"); // Obtiene el contenedor donde se mostrarán las tarjetas de juegos
    let urlParams = new URLSearchParams(window.location.search); // Obtiene los parámetros de la URL
    let path = window.location.pathname;  // Obtiene el nombre de la plataforma desde la ruta de la URL
    let platform = path.split('=')[1]; // Obtiene 'xbox' o 'playstation'
    
    fetchGet('/Data/catalogo.json', function (data) {
        let games = data[platform]; // Obtiene los juegos correspondientes a la plataforma seleccionada

        // Verifica si hay juegos y si la variable es un array
        if (games && Array.isArray(games)) {
            games.forEach(games => {
                const gameSection = document.createElement('section'); // Crea un nuevo elemento de sección para cada tarjeta de juego
                gameSection.classList.add('card');
                // Establece atributos de lanzamiento y video para la tarjeta
                gameSection.setAttribute('data-launch', games.lanzamiento);
                gameSection.setAttribute('data-video', games.video);

                // Define la clase de fondo según la plataforma (verde para Xbox, azul para PlayStation)
                const backClass = platform === 'xbox' ? 'xbox' : 'play';

                // Convierte la fecha de lanzamiento en un objeto de fecha y la formatea
                let lanzamiento = new Date(games.lanzamiento);
                let opcionesFecha = { day: '2-digit', month: '2-digit', year: 'numeric' };
                const fecha = lanzamiento.toLocaleDateString('es-ES', opcionesFecha);
    
                // Establece el contenido HTML de la tarjeta de juego
                gameSection.innerHTML = `
                    <div class="face front">
                        <img src="${games.imagen}" alt="Imagen videojuego ${games.nombre}">
                    </div>
                    <div class="face back ${backClass}">
                        <h3>${games.nombre}</h3>
                        <iframe width="100%" height="100%" src="${games.video}" 
                            title="YouTube video player" frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                        <div class="details-container">
                            <ul>
                                <li><b>Género: </b>${games.genero}</li>
                                <li><b>Lanzamiento: </b>${fecha}</li>
                            </ul>
                        </div>
                    </div>`;
                
                cardsContainer.appendChild(gameSection);
            });
            
            let numberOfItems = document.querySelectorAll(".cards-container .card").length; // Obtiene el número total de tarjetas y calcula el número total de páginas necesarias
            let limitPerPage = getLimitPerPage(); // Cuantas tarjetas visibles por página
            let totalPages = Math.ceil(numberOfItems / limitPerPage);
            let paginationSize = getPaginationSize(); // Tamaño de la paginación
            
            // Obtener el número de página actual de la URL
            let currentPage = parseInt(urlParams.get('page')) || 1;

            // Calcular el límite de tarjetas por página según el tamaño de la pantalla
            function getLimitPerPage() {
                if (window.innerWidth < 1200) {
                    return 8; // Si la pantalla es mediana, mostrar 8 tarjetas por página
                } else {
                    return 9; // Si la pantalla es grande, mostrar 9 tarjetas por página
                }
            };

            // Función para calcular el tamaño de la paginación según el tamaño de la pantalla
            function getPaginationSize() {
                if (window.innerWidth < 768) {
                    return 5; 
                } else if (window.innerWidth <= 992) {
                    return 7;
                } else {
                    return 9;
                }
            };

            // Función que muestra una página específica de tarjetas
            function showPage(wichPage) {
                if (wichPage < 1 || wichPage > totalPages) return false;
                currentPage = wichPage;

                // Actualizar la URL con el número de página actual
                history.pushState(null, null, `/catalogo=${platform}?page=${currentPage}`);

                // Desplazar la página hacia arriba con un desplazamiento más suave
                // window.scrollTo({
                //     top: 100,
                //     behavior: "smooth", // Desplazamiento suave
                // });

                // Ocultar todos los iframes de YouTube
                let youtubeIframes = document.querySelectorAll(".cards-container .card iframe");
                youtubeIframes.forEach(function(iframe) {
                    iframe.setAttribute("loading", "lazy");
                    iframe.removeAttribute("src");
                });

                // Calcula los índices de inicio y fin para las tarjetas a mostrar en la página actual
                let startIndex = (currentPage - 1) * limitPerPage;
                let endIndex = currentPage * limitPerPage;

                // Convierte la lista de tarjetas en un array para manipularlas
                let cards = Array.from(document.querySelectorAll(".cards-container .card"));

                // Ordena las tarjetas según la fecha de lanzamiento
                cards.sort(function(a, b) {
                    return new Date(b.dataset.launch) - new Date(a.dataset.launch);
                });

                // Muestra u oculta las tarjetas según el rango de índices calculado
                cards.forEach(function (card, index) {
                    if (index >= startIndex && index < endIndex) {
                        cardsContainer.appendChild(card);
                        card.style.display = "block";

                        // Establece la URL del video de YouTube para los iframes visibles
                        let iframe = card.querySelector("iframe");
                        let videoUrl = card.dataset.video; // Obtener la URL del video de YouTube almacenada en el atributo data-video de la tarjeta
                        if (iframe && videoUrl) {
                            iframe.setAttribute("src", videoUrl);
                        }
                    } else {
                        card.style.display = "none";
                    }
                });

                updatePagination(); // Actualiza la paginación después de mostrar la página

                return true;
            };

            // Función para actualizar los elementos de la paginación
            function updatePagination() {
                // Selecciona todos los elementos <li> dentro de la paginación
                let paginationItems = document.querySelectorAll(".paginacion li");

                // Elimina todos los elementos de la paginación, excepto el primero (botón de "página anterior")
                // y el último (botón de "página siguiente")
                for (let i = 1; i < paginationItems.length - 1; i++) {
                    paginationItems[i].parentNode.removeChild(paginationItems[i]);
                }

                // Genera y agrega los elementos de la paginación según la página actual y el total de páginas
                getPageList(totalPages, currentPage, paginationSize).forEach(item => {

                    // Crea un nuevo elemento <li> para cada página o punto suspensivo
                    let liElement = document.createElement("li");
                    liElement.classList.add("page-item"); // Agregar clases al elemento <li>

                    // Si 'item' es un número de página válido, agrega la clase 'current-page
                    if (item) {
                        liElement.classList.add("current-page");
                    } else {
                        // Si 'item' es 0, significa que es un punto suspensivo, agrega la clase 'dots'
                        liElement.classList.add("dots");
                    }

                     // Si el número de página corresponde a la página actual, marca el elemento como activo
                    if (item === currentPage) {
                        liElement.classList.add("active");
                    }

                   // Crea el elemento <a> que contendrá el número de página o los puntos suspensivos
                    let aElement = document.createElement("a");

                    // Agregar clase al elemento <a>
                    aElement.classList.add("page-link");

                    // Establece el atributo href para el elemento <a> con un valor vacío
                    // El valor 'javascript:void(0)' evita que la página se recargue al hacer clic
                    aElement.setAttribute("href", "javascript:void(0)");

                    // Establece el contenido del enlace, que puede ser un número de página o "..."
                    aElement.textContent = item || "...";

                    // Inserta el enlace dentro del elemento <li>
                    liElement.appendChild(aElement);

                    // Inserta el elemento <li> antes del elemento con la clase "next-page"
                    let nextPageElement = document.querySelector(".next-page");
                    nextPageElement.parentNode.insertBefore(liElement, nextPageElement);
                });

                // Desactiva el botón de "página anterior" si estamos en la primera página
                let previousPageElement = document.querySelector(".previous-page");
                previousPageElement.classList.toggle("disable", currentPage === 1);

                // Desactiva el botón de "página siguiente" si estamos en la última página
                let nextPageElement = document.querySelector(".next-page");
                nextPageElement.classList.toggle("disable", currentPage === totalPages);
            };

            // Crear elementos y configurar atributos y clases para los botones de página anterior y siguiente
            let previousPageListItem = document.createElement("li");
            previousPageListItem.classList.add("page-item");
            previousPageListItem.classList.add("previous-page");

            let previousPageLink = document.createElement("a");
            previousPageLink.classList.add("page-link");
            previousPageLink.setAttribute("href", "javascript:void(0)");
            previousPageLink.textContent = "<";

            let nextPageListItem = document.createElement("li");
            nextPageListItem.classList.add("page-item");
            nextPageListItem.classList.add("next-page");

            let nextPageLink = document.createElement("a");
            nextPageLink.classList.add("page-link");
            nextPageLink.setAttribute("href", "javascript:void(0)");
            nextPageLink.textContent = ">";

            // Adjuntar elementos para los botones de página anterior y siguiente
            previousPageListItem.appendChild(previousPageLink);
            nextPageListItem.appendChild(nextPageLink);

            // Adjuntar los elementos de la paginación a la lista de paginación en el DOM
            let paginationList = document.querySelector(".paginacion");
            paginationList.appendChild(previousPageListItem);
            paginationList.appendChild(nextPageListItem);

            // Mostrar las tarjetas de la página actual
            showPage(currentPage);

            // Manejar eventos de clic en los enlaces de paginación para cambiar de página
            document.addEventListener("click", function(event) {
                // Verificar si el clic ocurrió en un elemento <a> dentro de un <li> con la clase "current-page"
                if (event.target.matches(".paginacion li.current-page:not(.active) a")) {
                    // Obtiene el número de página del texto del enlace que fue clicado
                    let pageNumber = +event.target.textContent;

                    // Desplazarse al elemento específico
                    cardsContainer.scrollIntoView({ behavior: "smooth" });
                    event.preventDefault();

                    // Llamar a la función showPage con el número de página
                    return showPage(pageNumber);
                }
            });   
    
            // Manejar evento de clic en el botón de página siguiente
            let nextPageElement = document.querySelector(".next-page");
            nextPageElement.addEventListener("click", function(event) {
                // Desplazarse al elemento específico
                cardsContainer.scrollIntoView({ behavior: "smooth" });
                event.preventDefault();

                // Incrementa el número de página y muestra la nueva página
                return showPage(currentPage + 1);
            });

            // Manejar evento de clic en el botón de página anterior
            let previousPageElement = document.querySelector(".previous-page");
            previousPageElement.addEventListener("click", function(event) {
                // Desplazarse al elemento específico
                cardsContainer.scrollIntoView({ behavior: "smooth" });
                event.preventDefault();

                // Decrementa el número de página y muestra la nueva página
                return showPage(currentPage - 1);
            });
        };
    });
});
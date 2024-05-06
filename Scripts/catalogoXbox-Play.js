function getPageList(totalPages, page, maxLength) {
    
    function range(start, end) {
        // Esta función crea un array que contiene todos los números enteros en el rango desde start hasta end. 
        // Por ejemplo, si llamas a la función con rango(1, 5), devolverá [1, 2, 3, 4, 5]
        return Array.from(Array(end - start + 1), (_, i) => i + start);
    }

    // Esto utiliza el operador condicional (ternario) para asignar a sideWidth el valor de 1 si maxLength es menor que 9; de lo contrario, se le asigna 2.
    let sideWidth = maxLength < 9 ? 1:2;

    // Calcula el ancho del lado izquierdo. Resta dos veces el valor de sideWidth y 3 (que corresponde al espacio para los lados) del valor de maxLength. Luego, desplaza los bits hacia la derecha en 1 posición. Este desplazamiento de bits se puede interpretar como una división entre 2, lo que distribuye el espacio restante entre el lado izquierdo y el lado derecho de manera uniforme.
    let leftWidth = (maxLength - sideWidth * 2 - 3) >> 1;
    
    // Realiza el mismo cálculo que leftWidth para el lado derecho.
    let rightWidth = (maxLength - sideWidth * 2 - 3) >> 1;

    if (totalPages <= maxLength) {
        return range(1, totalPages);
    }

    // Esta condición se cumple cuando la página actual está lo suficientemente lejos del final de la paginación para que se muestren todas las páginas en el centro.
    // Devuelve un rango que va desde la página 1 hasta maxLength - sideWidth - 1, luego incluye un 0 para indicar un espacio en la paginación, y finalmente muestra un rango desde totalPages - sideWidth + 1 hasta la última página.
    if (page <= maxLength - sideWidth - 1 - rightWidth) {
        return range(1, maxLength - sideWidth - 1).concat(0, range(totalPages - sideWidth + 1, totalPages));
    }

    // Esta condición se cumple cuando la página actual está cerca del final de la paginación.
    // Devuelve un rango que va desde la página 1 hasta sideWidth, luego incluye un 0 para indicar un espacio en la paginación, y finalmente muestra un rango desde totalPages - sideWidth - 1 - rightWidth - leftWidth hasta la última página. Esto asegura que el final de la paginación esté completamente visible sin truncarse.
    if (page >= totalPages - sideWidth - 1 - rightWidth) {
        return range(1, sideWidth).concat(0, range(totalPages - sideWidth - 1 - rightWidth - leftWidth, totalPages));
    }

    // Construye un rango de números que se mostrarán en la paginación, garantizando que las páginas importantes (incluida la página actual) estén visibles y que haya espacios adecuados para la navegación entre las páginas y alrededor de los lados de la paginación.
    return range(1, sideWidth).concat(0, range(page - leftWidth, page + rightWidth), 0, range(totalPages - sideWidth + 1, totalPages)); 
}


document.addEventListener("DOMContentLoaded", function() {
    let numberOfItems = document.querySelectorAll(".cards-container .card").length;
    let limitPerPage = getLimitPerPage(); // Cuantas tarjetas visibles por página
    let totalPages = Math.ceil(numberOfItems / limitPerPage);
    let paginationSize = getPaginationSize(); // Cuantos elementos visibles en la paginación

    // Obtener el número de página actual de la URL
    let urlParams = new URLSearchParams(window.location.search);
    let currentPage = parseInt(urlParams.get('page')) || 1;

    function getLimitPerPage() {
        // Calcular el límite de tarjetas por página según el tamaño de la pantalla
        if (window.innerWidth < 1200) {
            return 8; // Si la pantalla es mediana, mostrar 8 tarjetas por página
        } else {
            return 9; // Si la pantalla es grande, mostrar 9 tarjetas por página
        }
    };

    function getPaginationSize() {
        if (window.innerWidth < 768) {
            return 5; 
        } else if (window.innerWidth <= 992) {
            return 7;
        } else {
            return 9;
        }
    };

    function showPage(wichPage) {
        if (wichPage < 1 || wichPage > totalPages) return false;
        currentPage = wichPage;

        // Actualizar la URL con el número de página actual
        history.pushState(null, null, `?page=${currentPage}`);

        // Desplazar la página hacia arriba con un desplazamiento más suave
        window.scrollTo({
            top: 0,
            behavior: "smooth", // Desplazamiento suave
        });

        // Ocultar todos los iframes de YouTube
        let youtubeIframes = document.querySelectorAll(".cards-container .card iframe");
        youtubeIframes.forEach(function(iframe) {
            iframe.setAttribute("loading", "lazy");
            iframe.removeAttribute("src");
        });

        // $(".cards-container .card").hide().slice((currentPage - 1) * limitPerPage, currentPage * limitPerPage).show();
        let startIndex = (currentPage - 1) * limitPerPage;
        let endIndex = currentPage * limitPerPage;

        let cards = Array.from(document.querySelectorAll(".cards-container .card"));

        // Ordenar las tarjetas según el valor del atributo data-launch
        cards.sort(function(a, b) {
            return new Date(b.dataset.launch) - new Date(a.dataset.launch);
        });

        cards.forEach(function (card, index) {
            if (index >= startIndex && index < endIndex) {
                cardsContainer.appendChild(card);
                card.style.display = "block";

                let iframe = card.querySelector("iframe");
                let videoUrl = card.dataset.video; // Obtener la URL del video de YouTube almacenada en el atributo data-video de la tarjeta
                if (iframe && videoUrl) {
                    iframe.setAttribute("src", videoUrl);
                }

            } else {
                card.style.display = "none";
            }
        });

        updatePagination();

        return true;
    };

    function updatePagination() {
        // $("paginacion li").slice(1, -1).remove();
        let paginationItems = document.querySelectorAll(".paginacion li");

        // Eliminar elementos desde el segundo hasta el penúltimo
        for (let i = 1; i < paginationItems.length - 1; i++) {
            paginationItems[i].parentNode.removeChild(paginationItems[i]);
        }

         // Actualizar la lista de páginas en la paginación
        getPageList(totalPages, currentPage, paginationSize).forEach(item => {
            // $("<li>").addClass("page-item").addClass(item ? "current-page" : "dots").toggleClass("active", item === currentPage).append($("<a>")
            // .addClass("page-link").attr({href: "javascript:void(0)"}).text(item || "...")).insertBefore(".next-page");

            // Crear el elemento <li>
            let liElement = document.createElement("li");

            // Agregar clases al elemento <li>
            liElement.classList.add("page-item");
            if (item) {
                liElement.classList.add("current-page");
            } else {
                liElement.classList.add("dots");
            }
            if (item === currentPage) {
                liElement.classList.add("active");
            }

            // Crear el elemento <a>
            let aElement = document.createElement("a");

            // Agregar clase al elemento <a>
            aElement.classList.add("page-link");

            // Agregar atributo href al elemento <a>
            aElement.setAttribute("href", "javascript:void(0)");

            // Agregar texto al elemento <a>
            aElement.textContent = item || "...";

            // Agregar el elemento <a> como hijo del elemento <li>
            liElement.appendChild(aElement);

            // Insertar el elemento <li> antes del elemento con la clase "next-page"
            let nextPageElement = document.querySelector(".next-page");
            nextPageElement.parentNode.insertBefore(liElement, nextPageElement);
        });

        // Desactivar/activar los botones de página anterior y siguiente según la página actual

        // $(".previous-page").toggleClass("disable", currentPage === 1);
        let previousPageElement = document.querySelector(".previous-page");
        previousPageElement.classList.toggle("disable", currentPage === 1);

        // $(".next-page").toggleClass("disable", currentPage === totalPages);
        let nextPageElement = document.querySelector(".next-page");
        nextPageElement.classList.toggle("disable", currentPage === totalPages);
    };

    // $(".paginacion").append(
    //     $("<li>").addClass("page-item").addClass("previous-page").append($("<a>").addClass("page-link").attr({href: "javascript:void(0)"}).text("<")),
    //     $("<li>").addClass("page-item").addClass("next-page").append($("<a>").addClass("page-link").attr({href: "javascript:void(0)"}).text(">"))
    // );

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

    let paginationList = document.querySelector(".paginacion");
    paginationList.appendChild(previousPageListItem);
    paginationList.appendChild(nextPageListItem);

    // $(".cards-container").show();
    let cardsContainer = document.querySelector(".cards-container");
    cardsContainer.style.display = "flex";

    showPage(currentPage);

    /*$(document).on("click", ".paginacion li.current-page:not(.active)", function() {
        return showPage(+$(this).text());
    })*/

    // Manejar eventos de clic en los enlaces de paginación para cambiar de página
    document.addEventListener("click", function(event) {
        // Verificar si el clic ocurrió en un elemento <a> dentro de un <li> con la clase "current-page"
        if (event.target.matches(".paginacion li.current-page:not(.active) a")) {
            console.log("Elemento clicado:", event.target.parentElement); // El elemento <li> padre del <a> clicado

            // Obtener el número de página del texto del elemento <a> clicado
            let pageNumber = +event.target.textContent;
            console.log("Número de página:", pageNumber); // Mostrar el número de página

            // Llamar a la función showPage con el número de página
            return showPage(pageNumber);
        }
    });   
    
    // $(".next-page").on("click", function() {
    //     return showPage(currentPage + 1);
    // });

     // Manejar evento de clic en el botón de página siguiente
    let nextPageElement = document.querySelector(".next-page");
    nextPageElement.addEventListener("click", function() {
        return showPage(currentPage + 1);
    });

    // Manejar evento de clic en el botón de página anterior
    let previousPageElement = document.querySelector(".previous-page");
    previousPageElement.addEventListener("click", function() {
        return showPage(currentPage - 1);
    });

});
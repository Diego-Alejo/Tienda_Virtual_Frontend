
let inventarioActual = [];
let productosInventario = [];

function crearInterfazInventario() {
    const contenedor = document.getElementById("inventario-container");

    contenedor.innerHTML = `
        <div class="panel module-panel">
            <div class="panel-header">
                <div>
                    <h3>Control de inventario</h3>
                    <p>Consulta y administra las existencias de tus productos</p>
                </div>
                <button class="btn-secondary" id="btn-recargar-inventario">
                    Actualizar
                </button>
            </div>

            <div class="inventory-summary" id="resumen-inventario">
                <div class="inventory-summary-card">
                    <span>Productos registrados</span>
                    <strong id="total-productos-stock">—</strong>
                </div>
                <div class="inventory-summary-card">
                    <span>Unidades disponibles</span>
                    <strong id="total-unidades-stock">—</strong>
                </div>
                <div class="inventory-summary-card">
                    <span>Stock bajo</span>
                    <strong id="total-stock-bajo">—</strong>
                </div>
            </div>

            <div class="module-search">
                <input id="buscar-inventario"
                    placeholder="Buscar por ID o nombre del producto...">
            </div>

            <div id="tabla-inventario" class="module-table-wrapper">
                <p class="module-empty">Cargando inventario...</p>
            </div>

            <p id="mensaje-inventario" class="module-message"></p>
        </div>
    `;

    document.getElementById("btn-recargar-inventario")
        .addEventListener("click", cargarInventario);

    document.getElementById("buscar-inventario")
        .addEventListener("input", filtrarInventario);

    document.getElementById("tabla-inventario")
        .addEventListener("submit", actualizarInventario);
}

async function cargarInventario() {
    const tabla = document.getElementById("tabla-inventario");

    if (!tabla) return;

    tabla.innerHTML = '<p class="module-empty">Cargando inventario...</p>';

    try {
        const [stock, productos] = await Promise.all([
            API.stock.listar(),
            API.productos.listar()
        ]);

        inventarioActual = Array.isArray(stock) ? stock : [];
        productosInventario = Array.isArray(productos) ? productos : [];

        actualizarResumenInventario();
        filtrarInventario();

    } catch (error) {
        tabla.innerHTML = `
            <p class="module-error">
                No se pudo cargar el inventario: ${escaparStock(error.message)}
            </p>
        `;
    }
}

function actualizarResumenInventario() {
    const totalUnidades = inventarioActual.reduce(
        (total, item) => total + Number(item.cantidad_disponible || 0),
        0
    );

    const stockBajo = inventarioActual.filter(
        item => Number(item.cantidad_disponible) <= Number(item.stock_minimo)
    ).length;

    document.getElementById("total-productos-stock").textContent =
        inventarioActual.length;

    document.getElementById("total-unidades-stock").textContent =
        totalUnidades;

    document.getElementById("total-stock-bajo").textContent =
        stockBajo;
}

function filtrarInventario() {
    const busqueda = document.getElementById("buscar-inventario")
        .value.trim().toLowerCase();

    const filtrados = inventarioActual.filter(stock => {
        const producto = productosInventario.find(
            p => p.producto_id === stock.producto_id
        );

        return String(stock.producto_id ?? "").toLowerCase().includes(busqueda) ||
            String(producto?.nombre ?? "").toLowerCase().includes(busqueda);
    });

    mostrarInventario(filtrados);
}

function mostrarInventario(registros) {
    const tabla = document.getElementById("tabla-inventario");

    if (!registros.length) {
        tabla.innerHTML = '<p class="module-empty">No se encontraron registros de inventario.</p>';
        return;
    }

    tabla.innerHTML = `
        <table class="module-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Existencias</th>
                    <th>Stock mínimo</th>
                    <th>Estado</th>
                    <th>Última actualización</th>
                    <th>Actualizar cantidad</th>
                </tr>
            </thead>
            <tbody>
                ${registros.map(stock => {
                    const producto = productosInventario.find(
                        p => p.producto_id === stock.producto_id
                    );

                    const cantidad = Number(stock.cantidad_disponible);
                    const minimo = Number(stock.stock_minimo);
                    const bajo = cantidad <= minimo;

                    return `
                        <tr>
                            <td>
                                <strong>${escaparStock(producto?.nombre || "Producto no encontrado")}</strong>
                                <small class="module-description">
                                    ${escaparStock(stock.producto_id)}
                                </small>
                            </td>
                            <td>
                                <strong class="inventory-quantity">${cantidad}</strong>
                            </td>
                            <td>${minimo}</td>
                            <td>
                                <span class="module-status ${bajo ? "status-low" : "status-active"}">
                                    ${bajo ? "Stock bajo" : "Disponible"}
                                </span>
                            </td>
                            <td>${formatearFechaStock(stock.ultima_actualizacion)}</td>
                            <td>
                                <form class="stock-update-form"
                                    data-producto="${escaparStock(stock.producto_id)}">
                                    <input type="number" min="0" step="1"
                                        value="${cantidad}" required
                                        aria-label="Nueva cantidad">
                                    <button type="submit" class="btn-table-edit">
                                        Guardar
                                    </button>
                                </form>
                            </td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}

async function actualizarInventario(event) {
    const formulario = event.target.closest(".stock-update-form");
    if (!formulario) return;

    event.preventDefault();

    const productoId = formulario.dataset.producto;
    const cantidad = Number(formulario.querySelector("input").value);

    if (!Number.isInteger(cantidad) || cantidad < 0) {
        mostrarMensajeStock("Ingresa una cantidad entera igual o mayor a cero.", true);
        return;
    }

    try {
        await API.stock.actualizar(productoId, cantidad);
        mostrarMensajeStock(`Inventario de ${productoId} actualizado correctamente.`);
        await cargarInventario();
    } catch (error) {
        mostrarMensajeStock(error.message, true);
    }
}

function formatearFechaStock(fecha) {
    if (!fecha) return "Sin registro";

    const fechaNormalizada = String(fecha).replace(" ", "T");
    const date = new Date(fechaNormalizada);

    if (Number.isNaN(date.getTime())) return escaparStock(fecha);

    return date.toLocaleString("es-CO", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function mostrarMensajeStock(mensaje, error = false) {
    const elemento = document.getElementById("mensaje-inventario");
    elemento.textContent = mensaje;
    elemento.className = `module-message ${error ? "message-error" : "message-success"}`;
}

function escaparStock(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

document.addEventListener("DOMContentLoaded", crearInterfazInventario);

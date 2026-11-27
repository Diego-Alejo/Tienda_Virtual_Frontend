const PEDIDOS_API_URL = "http://localhost:8080/api";

let pedidosCargados = [];

function crearInterfazPedidos() {
    const contenedor = document.getElementById("pedidos-container");

    contenedor.innerHTML = `
        <div class="panel module-panel">

            <div class="panel-header">
                <div>
                    <h3>Historial de ventas</h3>
                    <p>Consulta los pedidos registrados y sus productos.</p>
                </div>
            </div>

            <div class="module-search">
                <input
                    type="text"
                    id="buscar-pedido-id"
                    placeholder="Buscar pedido por su ID..."
                >
            </div>

            <div class="module-actions">
                <button class="btn-primary" id="btn-buscar-pedido">
                    Buscar pedido
                </button>

                <button class="btn-secondary" id="btn-mostrar-todos">
                    Mostrar historial completo
                </button>
            </div>

            <p id="mensaje-pedidos" class="module-message"></p>

            <div id="resultado-pedidos"></div>

        </div>
    `;

    document.getElementById("btn-buscar-pedido")
        .addEventListener("click", buscarPedido);

    document.getElementById("btn-mostrar-todos")
        .addEventListener("click", consultarHistorialVentas);

    consultarHistorialVentas();
}

async function consultarHistorialVentas() {
    try {
        const respuesta = await fetch(`${PEDIDOS_API_URL}/ventas`);

        if (!respuesta.ok) {
            throw new Error("No se pudo consultar el historial de ventas.");
        }

        const pedidos = await respuesta.json();

        pedidosCargados = Array.isArray(pedidos) ? pedidos : [];

        mostrarPedidos(pedidosCargados);

        mostrarMensajePedido(
            pedidosCargados.length === 0
                ? "No hay ventas registradas."
                : "Historial de ventas cargado correctamente.",
            pedidosCargados.length === 0 ? "message-error" : "message-success"
        );

    } catch (error) {
        mostrarMensajePedido("Error: " + error.message, "message-error");
    }
}

async function buscarPedido() {
    const id = document.getElementById("buscar-pedido-id")
        .value.trim();

    if (!id) {
        mostrarMensajePedido("Ingrese el ID del pedido.", "message-error");
        return;
    }

    try {
        const respuesta = await fetch(`${PEDIDOS_API_URL}/pedidos`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron consultar los pedidos.");
        }

        const pedidos = await respuesta.json();

        pedidosCargados = Array.isArray(pedidos) ? pedidos : [];

        const pedidoEncontrado = pedidosCargados.filter(
            pedido => String(pedido.pedido_id) === id
        );

        if (pedidoEncontrado.length === 0) {
            document.getElementById("resultado-pedidos").innerHTML = `
                <div class="module-empty">
                    No se encontró un pedido con ese ID.
                </div>
            `;
            mostrarMensajePedido("Pedido no encontrado.", "message-error");
            return;
        }

        mostrarPedidos(pedidoEncontrado);
        mostrarMensajePedido("Pedido encontrado correctamente.", "message-success");

    } catch (error) {
        mostrarMensajePedido("Error: " + error.message, "message-error");
    }
}

function mostrarPedidos(pedidos) {
    const resultado = document.getElementById("resultado-pedidos");

    if (!Array.isArray(pedidos) || pedidos.length === 0) {
        resultado.innerHTML = `
            <div class="module-empty">
                No hay pedidos para mostrar.
            </div>
        `;
        return;
    }

    resultado.innerHTML = `
        <div class="module-grid" style="grid-template-columns: 1fr;">
            ${pedidos.map(pedido => `
                <article class="panel module-panel">
                    <div class="panel-header">
                        <div>
                            <h3>Pedido #${escaparTexto(pedido.pedido_id)}</h3>
                            <p>Fecha: ${escaparTexto(pedido.fecha_pedido)}</p>
                        </div>
                        <span class="module-status status-active">
                            ${escaparTexto(pedido.estado)}
                        </span>
                    </div>

                    <div class="inventory-summary">
                        <div class="inventory-summary-card">
                            <span>Cliente</span>
                            <strong>${escaparTexto(pedido.cliente_id)}</strong>
                        </div>

                        <div class="inventory-summary-card">
                            <span>Valor total</span>
                            <strong>${escaparTexto(pedido.monto_total)}</strong>
                        </div>

                        <div class="inventory-summary-card">
                            <span>Dirección de envío</span>
                            <strong>${escaparTexto(pedido.direccion_envio)}</strong>
                        </div>
                    </div>

                    <h3>Productos del pedido</h3>

                    ${mostrarDetallesPedido(pedido.detalles)}
                </article>
            `).join("")}
        </div>
    `;
}

function mostrarDetallesPedido(detalles) {
    if (!Array.isArray(detalles) || detalles.length === 0) {
        return `
            <div class="module-empty">
                Este pedido no tiene detalles disponibles.
            </div>
        `;
    }

    return `
        <div class="module-table-wrapper">
            <table class="module-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio unitario</th>
                    </tr>
                </thead>
                <tbody>
                    ${detalles.map(detalle => `
                        <tr>
                            <td>${escaparTexto(detalle.producto_id)}</td>
                            <td>${escaparTexto(detalle.cantidad)}</td>
                            <td>${escaparTexto(detalle.precio_unitario)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function escaparTexto(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function mostrarMensajePedido(mensaje, tipo) {
    const elemento = document.getElementById("mensaje-pedidos");

    elemento.textContent = mensaje;
    elemento.className = `module-message ${tipo}`;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", crearInterfazPedidos);
} else {
    crearInterfazPedidos();
}
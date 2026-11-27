const PEDIDOS_API_URL = "http://localhost:8080/api";
let pedidosCargados = [];

// Crear la interfaz de pedidos
function crearInterfazPedidos() {
    const contenedor = document.getElementById("pedidos-container");

    contenedor.innerHTML = `
        <div class="panel">
            <h2>Historial de ventas y pedidos</h2>

            <button id="btn-historial-ventas">
                Consultar historial de ventas
            </button>

            <h3>Buscar pedido</h3>
            <input
                type="text"
                id="buscar-pedido-id"
                placeholder="Ingrese el ID del pedido"
            >
            <button id="btn-buscar-pedido">Buscar pedido</button>

            <div id="resultado-pedidos"></div>
            <p id="mensaje-pedidos"></p>
        </div>
    `;

    document.getElementById("btn-historial-ventas")
        .addEventListener("click", consultarHistorialVentas);

    document.getElementById("btn-buscar-pedido")
        .addEventListener("click", buscarPedido);
}

// Consultar historial de ventas
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
                : "Historial de ventas consultado correctamente."
        );

    } catch (error) {
        mostrarMensajePedido("Error: " + error.message);
    }
}

// Buscar un pedido por su ID
async function buscarPedido() {
    const id = document.getElementById("buscar-pedido-id")
        .value.trim();

    if (!id) {
        mostrarMensajePedido("Ingrese el ID del pedido.");
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
            pedido => pedido.pedido_id === id
        );

        if (pedidoEncontrado.length === 0) {
            document.getElementById("resultado-pedidos").innerHTML = "";
            mostrarMensajePedido("No se encontró un pedido con ese ID.");
            return;
        }

        mostrarPedidos(pedidoEncontrado);
        mostrarMensajePedido("Pedido encontrado correctamente.");

    } catch (error) {
        mostrarMensajePedido("Error: " + error.message);
    }
}

// Mostrar la información de los pedidos
function mostrarPedidos(pedidos) {
    const resultado = document.getElementById("resultado-pedidos");

    if (!Array.isArray(pedidos) || pedidos.length === 0) {
        resultado.textContent = "No hay pedidos para mostrar.";
        return;
    }

    resultado.innerHTML = pedidos.map(pedido => `
        <article class="pedido">
            <h3>Pedido: ${escaparTexto(pedido.pedido_id)}</h3>

            <p><strong>Cliente:</strong>
                ${escaparTexto(pedido.cliente_id)}
            </p>

            <p><strong>Dirección de envío:</strong>
                ${escaparTexto(pedido.direccion_envio)}
            </p>

            <p><strong>Fecha:</strong>
                ${escaparTexto(pedido.fecha_pedido)}
            </p>

            <p><strong>Valor total:</strong>
                ${escaparTexto(pedido.monto_total)}
            </p>

            <p><strong>Estado:</strong>
                ${escaparTexto(pedido.estado)}
            </p>

            <h4>Productos del pedido</h4>

            ${mostrarDetallesPedido(pedido.detalles)}

            <hr>
        </article>
    `).join("");
}

// Mostrar los productos incluidos en cada pedido
function mostrarDetallesPedido(detalles) {
    if (!Array.isArray(detalles) || detalles.length === 0) {
        return "<p>Este pedido no tiene detalles disponibles.</p>";
    }

    return `
        <ul>
            ${detalles.map(detalle => `
                <li>
                    <strong>Producto:</strong>
                    ${escaparTexto(detalle.producto_id)}
                    |
                    <strong>Cantidad:</strong>
                    ${escaparTexto(detalle.cantidad)}
                    |
                    <strong>Precio unitario:</strong>
                    ${escaparTexto(detalle.precio_unitario)}
                </li>
            `).join("")}
        </ul>
    `;
}

// Evitar interpretar los datos recibidos como código HTML
function escaparTexto(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

// Mostrar mensajes al usuario
function mostrarMensajePedido(mensaje) {
    document.getElementById("mensaje-pedidos").textContent = mensaje;
}
function listarPedidos() {
    consultarHistorialVentas();
}
// Iniciar la interfaz
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", crearInterfazPedidos);
} else {
    crearInterfazPedidos();
}
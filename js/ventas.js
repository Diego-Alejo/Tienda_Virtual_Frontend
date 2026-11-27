
let productosVenta = [];
let stockVenta = [];
let clientesVenta = [];
let numeroFilasVenta = 0;

function obtenerCampo(objeto, ...nombres) {
    for (const nombre of nombres) {
        if (objeto?.[nombre] !== undefined && objeto[nombre] !== null) {
            return objeto[nombre];
        }
    }
    return null;
}

function escaparVenta(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function obtenerStock(productoId) {
    const registro = stockVenta.find(item =>
        String(obtenerCampo(item, "producto_id", "productoId")) === String(productoId)
    );

    return Number(obtenerCampo(
        registro,
        "cantidad",
        "cantidad_disponible",
        "stock",
        "existencias"
    ) ?? 0);
}

function obtenerProductoId(producto) {
    return obtenerCampo(producto, "producto_id", "productoId", "id");
}

function obtenerClienteId(cliente) {
    return obtenerCampo(cliente, "cliente_id", "clienteId", "id");
}

function obtenerNombreProducto(producto) {
    return obtenerCampo(producto, "nombre", "nombre_producto", "descripcion")
        || "Producto sin nombre";
}

function obtenerNombreCliente(cliente) {
    const nombre = obtenerCampo(cliente, "nombre", "nombres") || "";
    const apellido = obtenerCampo(cliente, "apellido", "apellidos") || "";
    return `${nombre} ${apellido}`.trim() || "Cliente sin nombre";
}

window.inicializarVentas = async function () {
    const contenedor = document.getElementById("ventas-container");

    contenedor.innerHTML = `
        <div class="panel">
            <p>Consultando información de la tienda...</p>
        </div>
    `;

    try {
        const [productos, stock, clientes] = await Promise.all([
            API.productos.listar(),
            API.stock.listar(),
            API.clientes.listar()
        ]);

        productosVenta = productos;
        stockVenta = stock;
        clientesVenta = clientes;

        renderizarFormularioVenta();

    } catch (error) {
        contenedor.innerHTML = `
            <div class="panel">
                <h3>No se pudo cargar el módulo de ventas</h3>
                <p>${escaparVenta(error.message)}</p>
                <button class="btn-primary" onclick="inicializarVentas()">
                    Reintentar
                </button>
            </div>
        `;
    }
};

function renderizarFormularioVenta() {
    const contenedor = document.getElementById("ventas-container");

    const opcionesClientes = clientesVenta.map(cliente => {
        const id = obtenerClienteId(cliente);
        return `
            <option value="${escaparVenta(id)}">
                ${escaparVenta(obtenerNombreCliente(cliente))} 
                (${escaparVenta(id)})
            </option>
        `;
    }).join("");

    contenedor.innerHTML = `
        <form id="formulario-venta" class="panel sale-form">

            <div class="panel-header">
                <div>
                    <h3>Información de la venta</h3>
                    <p>Selecciona el cliente y los productos que deseas vender.</p>
                </div>
            </div>

            <div class="form-group">
                <label for="venta-cliente">Cliente *</label>
                <select id="venta-cliente" required>
                    <option value="">Selecciona un cliente</option>
                    ${opcionesClientes}
                </select>
                ${clientesVenta.length === 0
                    ? '<small>No hay clientes registrados.</small>'
                    : ""}
            </div>

            <div class="form-group">
                <label for="venta-direccion">Dirección de envío</label>
                <input
                    type="text"
                    id="venta-direccion"
                    placeholder="Dirección de entrega (opcional)"
                >
            </div>

            <div class="sale-products-header">
                <div>
                    <h3>Productos de la venta</h3>
                    <p>Agrega uno o varios productos.</p>
                </div>

                <button type="button" id="agregar-producto" class="btn-secondary">
                    + Agregar producto
                </button>
            </div>

            <div id="venta-detalles"></div>

            <div id="venta-mensaje" class="sale-message" aria-live="polite"></div>

            <div class="sale-footer">
                <button type="submit" id="confirmar-venta" class="btn-primary">
                    Confirmar venta
                </button>
            </div>
        </form>
    `;

    agregarFilaProducto();

    document.getElementById("agregar-producto").addEventListener("click", () => {
        agregarFilaProducto();
    });

    document.getElementById("venta-detalles").addEventListener("click", evento => {
        const boton = evento.target.closest(".eliminar-producto");
        if (!boton) return;

        const filas = document.querySelectorAll(".venta-producto-row");

        if (filas.length <= 1) {
            mostrarMensajeVenta("Debe existir al menos un producto.", "error");
            return;
        }

        boton.closest(".venta-producto-row").remove();
    });

    document.getElementById("formulario-venta").addEventListener("submit", registrarVenta);
}

function agregarFilaProducto() {
    const contenedor = document.getElementById("venta-detalles");
    const numero = ++numeroFilasVenta;

    const opcionesProductos = productosVenta.map(producto => {
        const id = obtenerProductoId(producto);
        const cantidad = obtenerStock(id);
        const nombre = obtenerNombreProducto(producto);

        return `
            <option value="${escaparVenta(id)}" ${cantidad <= 0 ? "disabled" : ""}>
                ${escaparVenta(nombre)} — ${escaparVenta(id)}
                (Disponible: ${cantidad})
            </option>
        `;
    }).join("");

    const fila = document.createElement("div");
    fila.className = "venta-producto-row";
    fila.dataset.fila = numero;

    fila.innerHTML = `
        <div class="form-group">
            <label>Producto</label>
            <select class="producto-select" required>
                <option value="">Selecciona un producto</option>
                ${opcionesProductos}
            </select>
        </div>

        <div class="form-group quantity-group">
            <label>Cantidad</label>
            <input
                type="number"
                class="producto-cantidad"
                min="1"
                step="1"
                value="1"
                required
            >
        </div>

        <button type="button" class="eliminar-producto btn-danger" title="Eliminar producto">
            ✕
        </button>
    `;

    contenedor.appendChild(fila);
}

function mostrarMensajeVenta(mensaje, tipo = "success") {
    const elemento = document.getElementById("venta-mensaje");
    if (!elemento) return;

    elemento.textContent = mensaje;
    elemento.className = `sale-message ${tipo}`;
}

async function registrarVenta(evento) {
    evento.preventDefault();

    const boton = document.getElementById("confirmar-venta");
    const clienteId = document.getElementById("venta-cliente").value;
    const direccion = document.getElementById("venta-direccion").value.trim();

    const filas = [...document.querySelectorAll(".venta-producto-row")];

    if (!clienteId) {
        mostrarMensajeVenta("Selecciona un cliente.", "error");
        return;
    }

    const detalles = [];

    for (const fila of filas) {
        const productoId = fila.querySelector(".producto-select").value;
        const cantidad = Number(fila.querySelector(".producto-cantidad").value);

        if (!productoId || !Number.isInteger(cantidad) || cantidad <= 0) {
            mostrarMensajeVenta("Selecciona productos y cantidades válidas.", "error");
            return;
        }

        detalles.push({
            producto_id: productoId,
            cantidad: cantidad
        });
    }

    // Comprueba el stock acumulado, incluso si se repite un producto.
    const cantidadesPorProducto = {};

    for (const detalle of detalles) {
        cantidadesPorProducto[detalle.producto_id] =
            (cantidadesPorProducto[detalle.producto_id] || 0) + detalle.cantidad;
    }

    for (const [productoId, cantidadSolicitada] of Object.entries(cantidadesPorProducto)) {
        const disponible = obtenerStock(productoId);

        if (cantidadSolicitada > disponible) {
            mostrarMensajeVenta(
                `Stock insuficiente para ${productoId}. Disponible: ${disponible}. Solicitado: ${cantidadSolicitada}.`,
                "error"
            );
            return;
        }
    }

    const venta = {
        cliente_id: clienteId,
        detalles: detalles
    };

    if (direccion) {
        venta.direccion_envio = direccion;
    }

    boton.disabled = true;
    boton.textContent = "Procesando venta...";

    try {
        const respuesta = await API.ventas.crear(venta);

        mostrarMensajeVenta(
            "¡Venta registrada correctamente! El backend ha procesado la operación.",
            "success"
        );

        const formulario = document.getElementById("formulario-venta");
        formulario.reset();

        // Recarga el inventario y los datos para reflejar la venta.
        const [stockActualizado] = await Promise.all([
            API.stock.listar(),
            window.verificarConexion?.()
        ]);

        stockVenta = stockActualizado;

        // Deja una fila nueva y limpia para otra venta.
        document.getElementById("venta-detalles").innerHTML = "";
        numeroFilasVenta = 0;
        agregarFilaProducto();

        console.log("Respuesta del backend:", respuesta);

    } catch (error) {
        mostrarMensajeVenta(
            `No se pudo registrar la venta: ${error.message}`,
            "error"
        );
    } finally {
        boton.disabled = false;
        boton.textContent = "Confirmar venta";
    }
}

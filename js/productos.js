
let productosActuales = [];
let productoEnEdicion = null;

function crearInterfazProductos() {
    const contenedor = document.getElementById("productos-container");

    contenedor.innerHTML = `
        <div class="module-grid">
            <div class="panel module-panel">
                <div class="panel-header">
                    <div>
                        <h3 id="titulo-form-producto">Registrar producto</h3>
                        <p>Completa la información del producto</p>
                    </div>
                </div>

                <form id="form-producto">
                    <div class="module-form-grid">
                        <div class="form-group">
                            <label for="producto-id">ID del producto</label>
                            <input id="producto-id" required maxlength="50"
                                placeholder="Ej. PROD005">
                        </div>

                        <div class="form-group">
                            <label for="producto-nombre">Nombre</label>
                            <input id="producto-nombre" required maxlength="150"
                                placeholder="Nombre del producto">
                        </div>

                        <div class="form-group module-full">
                            <label for="producto-descripcion">Descripción</label>
                            <textarea id="producto-descripcion" rows="3"
                                placeholder="Descripción del producto"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="producto-precio">Precio base</label>
                            <input id="producto-precio" type="number"
                                min="0" step="0.01" required placeholder="0">
                        </div>

                        <div class="form-group">
                            <label for="producto-activo">Estado</label>
                            <select id="producto-activo">
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </div>

                        <div class="form-group" id="grupo-cantidad-inicial">
                            <label for="producto-cantidad">Cantidad inicial</label>
                            <input id="producto-cantidad" type="number"
                                min="0" step="1" value="10" required>
                        </div>

                        <div class="form-group" id="grupo-stock-minimo">
                            <label for="producto-minimo">Stock mínimo</label>
                            <input id="producto-minimo" type="number"
                                min="0" step="1" value="2" required>
                        </div>
                    </div>

                    <div class="module-actions">
                        <button type="submit" class="btn-primary" id="btn-guardar-producto">
                            Registrar producto
                        </button>
                        <button type="button" class="btn-secondary"
                            id="btn-cancelar-producto" hidden>
                            Cancelar edición
                        </button>
                    </div>

                    <p id="mensaje-productos" class="module-message"></p>
                </form>
            </div>

            <div class="panel module-panel">
                <div class="panel-header">
                    <div>
                        <h3>Catálogo de productos</h3>
                        <p>Productos registrados en la tienda</p>
                    </div>
                    <button class="btn-secondary" id="btn-recargar-productos">
                        Actualizar
                    </button>
                </div>

                <div class="module-search">
                    <input id="buscar-producto"
                        placeholder="Buscar por ID o nombre...">
                </div>

                <div id="tabla-productos" class="module-table-wrapper">
                    <p class="module-empty">Cargando productos...</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById("form-producto")
        .addEventListener("submit", guardarProducto);

    document.getElementById("btn-cancelar-producto")
        .addEventListener("click", cancelarEdicionProducto);

    document.getElementById("btn-recargar-productos")
        .addEventListener("click", cargarProductos);

    document.getElementById("buscar-producto")
        .addEventListener("input", filtrarProductos);

    document.getElementById("tabla-productos")
        .addEventListener("click", gestionarAccionesProducto);
}

async function cargarProductos() {
    const tabla = document.getElementById("tabla-productos");

    if (!tabla) return;

    tabla.innerHTML = '<p class="module-empty">Cargando productos...</p>';

    try {
        const respuesta = await API.productos.listar();
        productosActuales = Array.isArray(respuesta) ? respuesta : [];
        filtrarProductos();
    } catch (error) {
        tabla.innerHTML = `
            <p class="module-error">No se pudieron cargar los productos: ${escaparProducto(error.message)}</p>
        `;
    }
}

function filtrarProductos() {
    const busqueda = document.getElementById("buscar-producto")
        .value.trim().toLowerCase();

    const filtrados = productosActuales.filter(producto =>
        String(producto.producto_id ?? "").toLowerCase().includes(busqueda) ||
        String(producto.nombre ?? "").toLowerCase().includes(busqueda)
    );

    mostrarProductos(filtrados);
}

function mostrarProductos(productos) {
    const tabla = document.getElementById("tabla-productos");

    if (!productos.length) {
        tabla.innerHTML = '<p class="module-empty">No se encontraron productos.</p>';
        return;
    }

    tabla.innerHTML = `
        <table class="module-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${productos.map(producto => `
                    <tr>
                        <td>${escaparProducto(producto.producto_id)}</td>
                        <td>
                            <strong>${escaparProducto(producto.nombre)}</strong>
                            <small class="module-description">
                                ${escaparProducto(producto.descripcion)}
                            </small>
                        </td>
                        <td>${formatearPrecio(producto.precio_base)}</td>
                        <td>
                            <span class="module-status ${producto.estado_activo ? "status-active" : "status-inactive"}">
                                ${producto.estado_activo ? "Activo" : "Inactivo"}
                            </span>
                        </td>
                        <td>
                            <div class="module-row-actions">
                                <button class="btn-table-edit"
                                    data-action="editar"
                                    data-id="${escaparProducto(producto.producto_id)}">
                                    Editar
                                </button>
                                <button class="btn-table-delete"
                                    data-action="eliminar"
                                    data-id="${escaparProducto(producto.producto_id)}">
                                    Eliminar
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

async function guardarProducto(event) {
    event.preventDefault();

    const producto = {
        producto_id: document.getElementById("producto-id").value.trim(),
        nombre: document.getElementById("producto-nombre").value.trim(),
        descripcion: document.getElementById("producto-descripcion").value.trim(),
        precio_base: Number(document.getElementById("producto-precio").value),
        estado_activo: document.getElementById("producto-activo").value === "true"
    };

    if (!producto.producto_id || !producto.nombre ||
        !Number.isFinite(producto.precio_base) || producto.precio_base < 0) {
        mostrarMensajeProducto("Revisa los datos ingresados.", true);
        return;
    }

    try {
        if (productoEnEdicion) {
            await API.productos.actualizar(productoEnEdicion, producto);
            mostrarMensajeProducto("Producto actualizado correctamente.");
        } else {
            producto.cantidad_inicial =
                Number(document.getElementById("producto-cantidad").value);
            producto.stock_minimo =
                Number(document.getElementById("producto-minimo").value);

            if (!Number.isInteger(producto.cantidad_inicial) ||
                !Number.isInteger(producto.stock_minimo) ||
                producto.cantidad_inicial < 0 || producto.stock_minimo < 0) {
                mostrarMensajeProducto("Las cantidades deben ser números enteros no negativos.", true);
                return;
            }

            await API.productos.crear(producto);
            mostrarMensajeProducto("Producto registrado correctamente.");
        }

        cancelarEdicionProducto();
        await cargarProductos();

    } catch (error) {
        mostrarMensajeProducto(error.message, true);
    }
}

function gestionarAccionesProducto(event) {
    const boton = event.target.closest("button[data-action]");
    if (!boton) return;

    const id = boton.dataset.id;
    const accion = boton.dataset.action;

    if (accion === "editar") {
        editarProducto(id);
    }

    if (accion === "eliminar") {
        eliminarProducto(id);
    }
}

function editarProducto(id) {
    const producto = productosActuales.find(p => p.producto_id === id);
    if (!producto) return;

    productoEnEdicion = id;

    document.getElementById("producto-id").value = producto.producto_id;
    document.getElementById("producto-id").disabled = true;
    document.getElementById("producto-nombre").value = producto.nombre ?? "";
    document.getElementById("producto-descripcion").value = producto.descripcion ?? "";
    document.getElementById("producto-precio").value = producto.precio_base ?? 0;
    document.getElementById("producto-activo").value =
        String(producto.estado_activo);

    document.getElementById("grupo-cantidad-inicial").hidden = true;
    document.getElementById("grupo-stock-minimo").hidden = true;
    document.getElementById("titulo-form-producto").textContent = "Editar producto";
    document.getElementById("btn-guardar-producto").textContent = "Guardar cambios";
    document.getElementById("btn-cancelar-producto").hidden = false;

    document.getElementById("form-producto").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function cancelarEdicionProducto() {
    productoEnEdicion = null;

    document.getElementById("form-producto").reset();
    document.getElementById("producto-id").disabled = false;
    document.getElementById("producto-cantidad").value = 10;
    document.getElementById("producto-minimo").value = 2;

    document.getElementById("grupo-cantidad-inicial").hidden = false;
    document.getElementById("grupo-stock-minimo").hidden = false;
    document.getElementById("titulo-form-producto").textContent = "Registrar producto";
    document.getElementById("btn-guardar-producto").textContent = "Registrar producto";
    document.getElementById("btn-cancelar-producto").hidden = true;
}

async function eliminarProducto(id) {
    if (!confirm(`¿Seguro que deseas eliminar el producto ${id}?`)) return;

    try {
        await API.productos.eliminar(id);
        mostrarMensajeProducto("Producto eliminado correctamente.");
        await cargarProductos();
    } catch (error) {
        mostrarMensajeProducto(error.message, true);
    }
}

function mostrarMensajeProducto(mensaje, error = false) {
    const elemento = document.getElementById("mensaje-productos");
    elemento.textContent = mensaje;
    elemento.className = `module-message ${error ? "message-error" : "message-success"}`;
}

function formatearPrecio(valor) {
    return Number(valor || 0).toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    });
}

function escaparProducto(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

document.addEventListener("DOMContentLoaded", crearInterfazProductos);

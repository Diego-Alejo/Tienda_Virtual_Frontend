const API_URL = "http://localhost:8080/api/clientes";

function crearInterfazClientes() {
    const contenedor = document.getElementById("clientes-container");

    contenedor.innerHTML = `
        <div class="module-grid">

            <div class="panel module-panel">
                <div class="panel-header">
                    <div>
                        <h3>Registrar cliente</h3>
                        <p>Ingresa los datos para registrar un nuevo cliente.</p>
                    </div>
                </div>

                <form id="form-cliente" class="module-form-grid">

                    <div class="form-group">
                        <label for="cliente-id">ID del cliente</label>
                        <input id="cliente-id" type="text"
                            placeholder="Ingrese el ID" required>
                    </div>

                    <div class="form-group">
                        <label for="cliente-nombre">Nombre</label>
                        <input id="cliente-nombre" type="text"
                            placeholder="Ingrese el nombre" required>
                    </div>

                    <div class="form-group">
                        <label for="cliente-apellido">Apellido</label>
                        <input id="cliente-apellido" type="text"
                            placeholder="Ingrese el apellido" required>
                    </div>

                    <div class="form-group">
                        <label for="cliente-email">Correo electrónico</label>
                        <input id="cliente-email" type="email"
                            placeholder="ejemplo@correo.com" required>
                    </div>

                    <div class="form-group module-full">
                        <label for="cliente-telefono">Teléfono</label>
                        <input id="cliente-telefono" type="tel"
                            placeholder="Ingrese el teléfono" required>
                    </div>

                    <div class="module-full module-actions">
                        <button type="submit" class="btn-primary">
                            Registrar cliente
                        </button>
                    </div>
                </form>

                <p id="mensaje-clientes" class="module-message"></p>
            </div>

            <div class="panel module-panel">
                <div class="panel-header">
                    <div>
                        <h3>Consultar clientes</h3>
                        <p>Busca un cliente por su número de identificación.</p>
                    </div>
                </div>

                <div class="module-search">
                    <input
                        id="buscar-cliente-id"
                        type="text"
                        placeholder="Ingrese el ID del cliente..."
                    >
                </div>

                <div class="module-actions">
                    <button id="btn-buscar-cliente" class="btn-primary">
                        Buscar cliente
                    </button>

                    <button id="btn-listar-clientes" class="btn-secondary">
                        Mostrar todos
                    </button>
                </div>

                <div id="resultado-clientes"></div>
            </div>

        </div>
    `;

    document.getElementById("form-cliente")
        .addEventListener("submit", registrarCliente);

    document.getElementById("btn-buscar-cliente")
        .addEventListener("click", buscarCliente);

    document.getElementById("btn-listar-clientes")
        .addEventListener("click", listarClientes);
}

async function registrarCliente(event) {
    event.preventDefault();

    const cliente = {
        cliente_id: document.getElementById("cliente-id").value.trim(),
        nombre: document.getElementById("cliente-nombre").value.trim(),
        apellido: document.getElementById("cliente-apellido").value.trim(),
        email: document.getElementById("cliente-email").value.trim(),
        telefono: document.getElementById("cliente-telefono").value.trim()
    };

    try {
        const respuesta = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(cliente)
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje || datos.error ||
                "No se pudo registrar el cliente."
            );
        }

        mostrarMensaje("Cliente registrado correctamente.", "message-success");
        document.getElementById("form-cliente").reset();

        listarClientes();

    } catch (error) {
        mostrarMensaje("Error: " + error.message, "message-error");
    }
}

async function listarClientes() {
    try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error("No se pudieron consultar los clientes.");
        }

        const clientes = await respuesta.json();
        mostrarClientes(clientes);

    } catch (error) {
        mostrarMensaje("Error: " + error.message, "message-error");
    }
}

async function buscarCliente() {
    const id = document.getElementById("buscar-cliente-id").value.trim();

    if (!id) {
        mostrarMensaje("Escriba el ID del cliente.", "message-error");
        return;
    }

    try {
        const respuesta = await fetch(
            `${API_URL}?id=${encodeURIComponent(id)}`
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo buscar el cliente.");
        }

        const cliente = await respuesta.json();

        mostrarClientes(Array.isArray(cliente) ? cliente : [cliente]);
        mostrarMensaje("Consulta realizada correctamente.", "message-success");

    } catch (error) {
        mostrarMensaje("Error: " + error.message, "message-error");
    }
}

function mostrarClientes(clientes) {
    const resultado = document.getElementById("resultado-clientes");

    if (!Array.isArray(clientes) || clientes.length === 0) {
        resultado.innerHTML = `
            <div class="module-empty">
                No se encontraron clientes.
            </div>
        `;
        return;
    }

    resultado.innerHTML = `
        <h3>Resultados (${clientes.length})</h3>

        <div class="module-table-wrapper">
            <table class="module-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Correo electrónico</th>
                        <th>Teléfono</th>
                    </tr>
                </thead>

                <tbody>
                    ${clientes.map(cliente => `
                        <tr>
                            <td>${escaparHTML(cliente.cliente_id)}</td>
                            <td>${escaparHTML(cliente.nombre)}</td>
                            <td>${escaparHTML(cliente.apellido)}</td>
                            <td>${escaparHTML(cliente.email)}</td>
                            <td>${escaparHTML(cliente.telefono)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function mostrarMensaje(mensaje, tipo) {
    const elemento = document.getElementById("mensaje-clientes");

    elemento.textContent = mensaje;
    elemento.className = `module-message ${tipo}`;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", crearInterfazClientes);
} else {
    crearInterfazClientes();
}
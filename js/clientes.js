const API_URL = "http://localhost:8080/api/clientes";

function crearInterfazClientes() {
    const contenedor = document.getElementById("clientes-container");

    contenedor.innerHTML = `
        <div class="panel">
            <h2>Gestión de clientes</h2>

            <h3>Registrar cliente</h3>
            <form id="form-cliente">
                <input id="cliente-id" placeholder="ID del cliente" required>
                <input id="cliente-nombre" placeholder="Nombre" required>
                <input id="cliente-apellido" placeholder="Apellido" required>
                <input id="cliente-email" type="email" placeholder="Correo electrónico" required>
                <input id="cliente-telefono" placeholder="Teléfono" required>
                <button type="submit">Registrar cliente</button>
            </form>

            <h3>Buscar cliente</h3>
            <input id="buscar-cliente-id" placeholder="Ingrese el ID del cliente">
            <button id="btn-buscar-cliente">Buscar</button>
            <button id="btn-listar-clientes">Mostrar todos</button>

            <div id="resultado-clientes"></div>
            <p id="mensaje-clientes"></p>
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
            throw new Error(datos.mensaje || datos.error || "No se pudo registrar el cliente.");
        }

        mostrarMensaje("Cliente registrado correctamente.");
        document.getElementById("form-cliente").reset();

        listarClientes();

    } catch (error) {
        mostrarMensaje("Error: " + error.message);
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
        mostrarMensaje("Error: " + error.message);
    }
}


async function buscarCliente() {
    const id = document.getElementById("buscar-cliente-id").value.trim();

    if (!id) {
        mostrarMensaje("Escriba el ID del cliente.");
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

    } catch (error) {
        mostrarMensaje("Error: " + error.message);
    }
}


function mostrarClientes(clientes) {
    const resultado = document.getElementById("resultado-clientes");

    if (!Array.isArray(clientes) || clientes.length === 0) {
        resultado.textContent = "No se encontraron clientes.";
        return;
    }

    resultado.innerHTML = `
        <h3>Resultados</h3>
        ${clientes.map(cliente => `
            <article>
                <p><strong>ID:</strong> ${escaparHTML(cliente.cliente_id)}</p>
                <p><strong>Nombre:</strong> ${escaparHTML(cliente.nombre)}</p>
                <p><strong>Apellido:</strong> ${escaparHTML(cliente.apellido)}</p>
                <p><strong>Email:</strong> ${escaparHTML(cliente.email)}</p>
                <p><strong>Teléfono:</strong> ${escaparHTML(cliente.telefono)}</p>
                <hr>
            </article>
        `).join("")}
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

function mostrarMensaje(mensaje) {
    document.getElementById("mensaje-clientes").textContent = mensaje;
}

document.addEventListener("DOMContentLoaded", crearInterfazClientes);
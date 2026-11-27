
document.addEventListener("DOMContentLoaded", () => {
    const botones = document.querySelectorAll(".nav-item");
    const paginas = document.querySelectorAll(".page-section");
    const nombrePagina = document.getElementById("current-page");

    const nombres = {
        inicio: "Inicio",
        productos: "Productos",
        inventario: "Inventario",
        clientes: "Clientes",
        ventas: "Ventas",
        pedidos: "Pedidos"
    };

    function navegar(seccion) {
        paginas.forEach(pagina => {
            pagina.classList.toggle("active", pagina.id === `section-${seccion}`);
        });

        botones.forEach(boton => {
            boton.classList.toggle("active", boton.dataset.section === seccion);
        });

        nombrePagina.textContent = nombres[seccion] || seccion;

        if (seccion === "productos") window.cargarProductos?.();
        if (seccion === "inventario") window.cargarInventario?.();
        if (seccion === "clientes") window.listarClientes?.();
        if (seccion === "ventas") window.inicializarVentas?.();
        if (seccion === "pedidos") window.listarPedidos?.();
    }

    botones.forEach(boton => {
        boton.addEventListener("click", () => navegar(boton.dataset.section));
    });

    document.querySelectorAll("[data-go]").forEach(boton => {
        boton.addEventListener("click", () => navegar(boton.dataset.go));
    });

    const fecha = document.getElementById("current-date");
    fecha.textContent = new Date().toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    window.navegar = navegar;

    verificarConexion();
});

async function verificarConexion() {
    const estado = document.getElementById("connection-status");

    try {
        const [productos, stock, clientes, ventas] = await Promise.all([
            API.productos.listar(),
            API.stock.listar(),
            API.clientes.listar(),
            API.ventas.listar()
        ]);

        document.getElementById("stat-productos").textContent =
            Array.isArray(productos) ? productos.length : "—";

        document.getElementById("stat-stock").textContent =
            Array.isArray(stock)
                ? stock.reduce((total, item) => total + Number(item.cantidad || 0), 0)
                : "—";

        document.getElementById("stat-clientes").textContent =
            Array.isArray(clientes) ? clientes.length : "—";

        document.getElementById("stat-ventas").textContent =
            Array.isArray(ventas) ? ventas.length : "—";

        estado.innerHTML = `
            <div class="status-indicator"></div>
            <span>Backend conectado correctamente</span>
        `;
        estado.classList.add("connected");

    } catch (error) {
        estado.innerHTML = `
            <div class="status-indicator offline"></div>
            <span>No se pudo conectar con el backend</span>
        `;
        estado.classList.add("disconnected");
        console.error("Error de conexión:", error);
    }
}

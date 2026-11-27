const API_BASE_URL = "http://localhost:8080/api";

async function apiRequest(endpoint, options = {}) {
    const config = {
        method: options.method || "GET",
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {})
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    const text = await response.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!response.ok) {
        const message =
            data?.mensaje ||
            data?.message ||
            data?.error ||
            (typeof data === "string" ? data : null) ||
            `Error HTTP ${response.status}`;

        throw new Error(message);
    }

    return data;
}

const API = {
    productos: {
        listar: () => apiRequest("/productos"),

        buscar: (id) =>
            apiRequest(`/productos?id=${encodeURIComponent(id)}`),

        crear: (producto) =>
            apiRequest("/productos", {
                method: "POST",
                body: producto
            }),

        actualizar: (id, producto) =>
            apiRequest(`/productos?id=${encodeURIComponent(id)}`, {
                method: "PUT",
                body: producto
            }),

        eliminar: (id) =>
            apiRequest(`/productos?id=${encodeURIComponent(id)}`, {
                method: "DELETE"
            })
    },

    stock: {
        listar: () => apiRequest("/stock"),

        buscar: (productoId) =>
            apiRequest(`/stock?producto_id=${encodeURIComponent(productoId)}`),

        actualizar: (productoId, cantidad) =>
            apiRequest("/stock", {
                method: "PUT",
                body: {
                    producto_id: productoId,
                    cantidad: cantidad
                }
            })
    },

    clientes: {
        listar: () => apiRequest("/clientes"),

        buscar: (id) =>
            apiRequest(`/clientes?id=${encodeURIComponent(id)}`),

        crear: (cliente) =>
            apiRequest("/clientes", {
                method: "POST",
                body: cliente
            })
    },

    ventas: {
        listar: () => apiRequest("/ventas"),

        crear: (venta) =>
            apiRequest("/ventas", {
                method: "POST",
                body: venta
            })
    },

    pedidos: {
        listar: () => apiRequest("/pedidos"),

        buscar: (id) =>
            apiRequest(`/pedidos?id=${encodeURIComponent(id)}`)
    }
};


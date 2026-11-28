/**
 * PORTAL DE CLIENTES - TIENDA VIRTUAL
 * Maneja la autenticación, catálogo, carrito de compras y gestión de pedidos
 * para usuarios con rol de cliente.
 */

(function () {
    // Claves de almacenamiento local (persistencia)
    const STORAGE_KEYS = {
        SESION: "tienda_cliente_sesion",
        CARRITO: "tienda_cliente_carrito",
        CLIENTES: "tienda_clientes_registrados",
        PEDIDOS_LOCALES: "tienda_pedidos_locales",
        PORTAL_ACTIVO: "tienda_portal_activo"
    };

    // Estado de la aplicación para el cliente
    const state = {
        clienteActual: null,
        carrito: [],
        catalogo: [],
        stockMap: {},
        pedidos: [],
        seccionActiva: "catalogo", // 'catalogo' | 'pedidos'
        filtroDisponibilidad: "todos", // 'todos' | 'disponibles' | 'agotados'
        ordenPrecio: "defecto", // 'defecto' | 'menor' | 'mayor' | 'az'
        terminoBusqueda: "",
        accionPendientePostLogin: null
    };

    // Productos de demostración / fallback en caso de que el backend esté desconectado
    const PRODUCTOS_FALLBACK = [
        {
            producto_id: "PROD001",
            nombre: "Camiseta Deportiva Dry-Fit",
            descripcion: "Camiseta transpirable de alto rendimiento para entrenamiento físico y deportes al aire libre.",
            precio_base: 45000,
            estado_activo: true,
            stock: 15
        },
        {
            producto_id: "PROD002",
            nombre: "Pantalón Jogger Urbano",
            descripcion: "Pantalón cómodo de algodón con ajuste elástico, ideal para uso diario o casual.",
            precio_base: 85000,
            estado_activo: true,
            stock: 8
        },
        {
            producto_id: "PROD003",
            nombre: "Zapatillas Running Nitro",
            descripcion: "Calzado con amortiguación ligera de última generación para corredores urbanos.",
            precio_base: 220000,
            estado_activo: true,
            stock: 12
        },
        {
            producto_id: "PROD004",
            nombre: "Gorra Deportiva Ajustable",
            descripcion: "Gorra con visera curva y protección solar UV con material repelente al agua.",
            precio_base: 35000,
            estado_activo: true,
            stock: 20
        },
        {
            producto_id: "PROD005",
            nombre: "Mochila Ergonómica Impermeable",
            descripcion: "Mochila con compartimento acolchado para portátil de 15.6 pulgadas y bolsillos organizadores.",
            precio_base: 130000,
            estado_activo: true,
            stock: 6
        },
        {
            producto_id: "PROD006",
            nombre: "Reloj Inteligente Deportivo",
            descripcion: "Smartwatch con monitor de ritmo cardíaco, GPS integrado y resistencia al agua 50m.",
            precio_base: 180000,
            estado_activo: true,
            stock: 4
        }
    ];

    // =========================================================================
    // INICIALIZACIÓN
    // =========================================================================
    document.addEventListener("DOMContentLoaded", () => {
        inicializarEstado();
        configurarConmutadorPortal();
        configurarNavegacionCliente();
        configurarFiltrosYBusqueda();
        configurarEventosCarrito();
        configurarEventosAuth();

        // Determinar qué vista abrir (si hay hash #cliente o preferencia guardada)
        const hash = window.location.hash.toLowerCase();
        const guardado = localStorage.getItem(STORAGE_KEYS.PORTAL_ACTIVO);

        if (hash === "#cliente" || (!hash && guardado === "cliente")) {
            activarPortalCliente();
        } else {
            activarPortalAdmin();
        }
    });

    function inicializarEstado() {
        // Cargar sesión del cliente
        try {
            const sesionGuardada = localStorage.getItem(STORAGE_KEYS.SESION);
            if (sesionGuardada) {
                state.clienteActual = JSON.parse(sesionGuardada);
            }
        } catch (e) {
            console.error("Error al leer sesión:", e);
        }

        // Cargar carrito de compras
        try {
            const carritoGuardado = localStorage.getItem(STORAGE_KEYS.CARRITO);
            if (carritoGuardado) {
                state.carrito = JSON.parse(carritoGuardado);
            }
        } catch (e) {
            console.error("Error al leer carrito:", e);
        }

        // Inicializar clientes locales de muestra si no existen
        try {
            const clientesGuardados = localStorage.getItem(STORAGE_KEYS.CLIENTES);
            if (!clientesGuardados) {
                const clientesIniciales = [
                    {
                        cliente_id: "CLI001",
                        nombre: "Carlos",
                        apellido: "Rodríguez",
                        email: "carlos@correo.com",
                        telefono: "3001234567",
                        direccion: "Calle 100 # 15-20, Bogotá",
                        password: "123"
                    },
                    {
                        cliente_id: "CLI002",
                        nombre: "Ana María",
                        apellido: "Gómez",
                        email: "ana@correo.com",
                        telefono: "3109876543",
                        direccion: "Carrera 43A # 1-50, Medellín",
                        password: "123"
                    }
                ];
                localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientesIniciales));
            }
        } catch (e) {
            console.error("Error al inicializar clientes demo:", e);
        }

        actualizarUIAutenticacion();
        actualizarBadgeCarrito();
    }

    // =========================================================================
    // CONMUTADOR ENTRE PANEL ADMIN Y TIENDA CLIENTES
    // =========================================================================
    function configurarConmutadorPortal() {
        // Botón en topbar del Admin
        const btnTopbar = document.getElementById("btn-cambiar-a-cliente");
        if (btnTopbar) {
            btnTopbar.addEventListener("click", () => activarPortalCliente());
        }

        // Botón en sidebar del Admin
        const btnSidebar = document.getElementById("btn-sidebar-cliente");
        if (btnSidebar) {
            btnSidebar.addEventListener("click", () => activarPortalCliente());
        }

        // Botón en topbar de Clientes para regresar al Admin
        const btnVolverAdmin = document.getElementById("btn-cambiar-a-admin");
        if (btnVolverAdmin) {
            btnVolverAdmin.addEventListener("click", () => activarPortalAdmin());
        }

        // Quick action en dashboard
        const quickActionCliente = document.getElementById("quick-action-cliente");
        if (quickActionCliente) {
            quickActionCliente.addEventListener("click", () => activarPortalCliente());
        }

        // Escuchar cambios de hash manuales (#cliente / #admin)
        window.addEventListener("hashchange", () => {
            if (window.location.hash.toLowerCase() === "#cliente") {
                activarPortalCliente();
            } else if (window.location.hash.toLowerCase() === "#admin") {
                activarPortalAdmin();
            }
        });
    }

    function activarPortalCliente() {
        document.body.classList.add("modo-cliente-activo");
        localStorage.setItem(STORAGE_KEYS.PORTAL_ACTIVO, "cliente");
        window.location.hash = "cliente";
        cargarCatalogoCliente();
    }

    function activarPortalAdmin() {
        document.body.classList.remove("modo-cliente-activo");
        localStorage.setItem(STORAGE_KEYS.PORTAL_ACTIVO, "admin");
        window.location.hash = "admin";
        if (typeof window.verificarConexion === "function") {
            window.verificarConexion();
        }
    }

    // =========================================================================
    // NAVEGACIÓN DENTRO DEL PORTAL DE CLIENTES
    // =========================================================================
    function configurarNavegacionCliente() {
        const enlacesNav = document.querySelectorAll("[data-cliente-tab]");
        enlacesNav.forEach(enlace => {
            enlace.addEventListener("click", (e) => {
                e.preventDefault();
                const seccion = enlace.dataset.clienteTab;
                cambiarSeccionCliente(seccion);
            });
        });
    }

    function cambiarSeccionCliente(seccion) {
        state.seccionActiva = seccion;

        // Actualizar botones de navegación
        document.querySelectorAll("[data-cliente-tab]").forEach(el => {
            el.classList.toggle("active", el.dataset.clienteTab === seccion);
        });

        // Alternar vistas
        const secCatalogo = document.getElementById("cliente-seccion-catalogo");
        const secPedidos = document.getElementById("cliente-seccion-pedidos");

        if (seccion === "catalogo") {
            if (secCatalogo) secCatalogo.classList.add("active");
            if (secPedidos) secPedidos.classList.remove("active");
        } else if (seccion === "pedidos") {
            if (secCatalogo) secCatalogo.classList.remove("active");
            if (secPedidos) secPedidos.classList.add("active");
            cargarMisPedidosCliente();
        }
    }

    // =========================================================================
    // CATÁLOGO DE PRODUCTOS (CONSULTA API + STOCK REAL)
    // =========================================================================
    async function cargarCatalogoCliente() {
        const grid = document.getElementById("cliente-productos-grid");
        if (!grid) return;

        grid.innerHTML = `
            <div class="cliente-empty-state" style="grid-column: 1 / -1;">
                <span class="cliente-empty-icon">⏳</span>
                <h3>Cargando catálogo de productos...</h3>
                <p>Consultando existencias y precios en tiempo real.</p>
            </div>
        `;

        try {
            let productosApi = [];
            let stockApi = [];

            // Consultar API del backend
            try {
                const [resProd, resStock] = await Promise.all([
                    API.productos.listar(),
                    API.stock.listar()
                ]);
                productosApi = Array.isArray(resProd) ? resProd : [];
                stockApi = Array.isArray(resStock) ? resStock : [];
            } catch (errApi) {
                console.warn("Backend no disponible, usando catálogo de demostración local:", errApi);
            }

            // Construir mapa de existencias
            const stockMap = {};
            stockApi.forEach(item => {
                const id = String(item.producto_id || item.productoId || "");
                const cantidad = Number(item.cantidad || item.cantidad_disponible || item.stock || 0);
                stockMap[id] = cantidad;
            });
            state.stockMap = stockMap;

            // Si la API devolvió productos, usarlos; de lo contrario, usar productos de fallback
            if (productosApi.length > 0) {
                state.catalogo = productosApi.map(prod => {
                    const id = String(prod.producto_id || prod.productoId || prod.id || "");
                    const stockDisponible = stockMap[id] !== undefined
                        ? stockMap[id]
                        : (prod.cantidad_inicial || 10);
                    return {
                        ...prod,
                        producto_id: id,
                        stock: stockDisponible
                    };
                });
            } else {
                state.catalogo = PRODUCTOS_FALLBACK.map(prod => ({
                    ...prod,
                    stock: stockMap[prod.producto_id] !== undefined ? stockMap[prod.producto_id] : prod.stock
                }));
            }

            renderizarCatalogo();

        } catch (error) {
            console.error("Error al cargar catálogo:", error);
            grid.innerHTML = `
                <div class="cliente-empty-state" style="grid-column: 1 / -1;">
                    <span class="cliente-empty-icon">⚠️</span>
                    <h3>Error al cargar productos</h3>
                    <p>${escapar(error.message)}</p>
                    <button class="btn-primary" style="margin-top: 12px;" onclick="window.cargarCatalogoCliente()">Reintentar</button>
                </div>
            `;
        }
    }
    window.cargarCatalogoCliente = cargarCatalogoCliente;

    function configurarFiltrosYBusqueda() {
        const inputBuscar = document.getElementById("cliente-buscar-input");
        if (inputBuscar) {
            inputBuscar.addEventListener("input", (e) => {
                state.terminoBusqueda = e.target.value.trim().toLowerCase();
                renderizarCatalogo();
            });
        }

        // Filtros de disponibilidad
        const botonesFiltro = document.querySelectorAll("[data-filtro-stock]");
        botonesFiltro.forEach(btn => {
            btn.addEventListener("click", () => {
                botonesFiltro.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                state.filtroDisponibilidad = btn.dataset.filtroStock;
                renderizarCatalogo();
            });
        });

        // Ordenamiento por precio
        const selectOrden = document.getElementById("cliente-ordenar-select");
        if (selectOrden) {
            selectOrden.addEventListener("change", (e) => {
                state.ordenPrecio = e.target.value;
                renderizarCatalogo();
            });
        }
    }

    function renderizarCatalogo() {
        const grid = document.getElementById("cliente-productos-grid");
        if (!grid) return;

        let productos = [...state.catalogo];

        // 1. Filtrar por búsqueda
        if (state.terminoBusqueda) {
            productos = productos.filter(p =>
                (p.nombre || "").toLowerCase().includes(state.terminoBusqueda) ||
                (p.producto_id || "").toLowerCase().includes(state.terminoBusqueda) ||
                (p.descripcion || "").toLowerCase().includes(state.terminoBusqueda)
            );
        }

        // 2. Filtrar por disponibilidad
        if (state.filtroDisponibilidad === "disponibles") {
            productos = productos.filter(p => Number(p.stock || 0) > 0);
        } else if (state.filtroDisponibilidad === "agotados") {
            productos = productos.filter(p => Number(p.stock || 0) <= 0);
        }

        // 3. Ordenar
        if (state.ordenPrecio === "menor") {
            productos.sort((a, b) => Number(a.precio_base || 0) - Number(b.precio_base || 0));
        } else if (state.ordenPrecio === "mayor") {
            productos.sort((a, b) => Number(b.precio_base || 0) - Number(a.precio_base || 0));
        } else if (state.ordenPrecio === "az") {
            productos.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
        }

        if (productos.length === 0) {
            grid.innerHTML = `
                <div class="cliente-empty-state" style="grid-column: 1 / -1;">
                    <span class="cliente-empty-icon">🔍</span>
                    <h3>No encontramos productos</h3>
                    <p>Intenta con otros términos de búsqueda o cambia los filtros de disponibilidad.</p>
                </div>
            `;
            return;
        }

        // Iconos según categorías comunes para enriquecer la interfaz
        const iconos = ["👟", "👕", "🎒", "🧢", "⌚", "🎧", "📦", "💻", "🕶️", "⚽"];

        grid.innerHTML = productos.map((prod, index) => {
            const stock = Number(prod.stock || 0);
            const agotado = stock <= 0;
            const bajoStock = stock > 0 && stock <= 3;
            const icono = iconos[Math.abs(hashString(prod.producto_id || prod.nombre)) % iconos.length];

            let tagClase = "disponible";
            let tagTexto = `✓ En stock (${stock})`;
            if (agotado) {
                tagClase = "agotado";
                tagTexto = "✗ Agotado";
            } else if (bajoStock) {
                tagClase = "bajo";
                tagTexto = `¡Últimas ${stock} unid!`;
            }

            return `
                <article class="producto-card" data-producto-id="${escapar(prod.producto_id)}">
                    <div class="producto-card-banner">
                        <div class="producto-card-icon">${icono}</div>
                        <span class="producto-card-stock-tag ${tagClase}">${tagTexto}</span>
                    </div>

                    <div class="producto-card-body">
                        <span class="producto-card-id">${escapar(prod.producto_id)}</span>
                        <h3 class="producto-card-nombre">${escapar(prod.nombre)}</h3>
                        <p class="producto-card-descripcion">${escapar(prod.descripcion || "Sin descripción disponible.")}</p>

                        <div class="producto-card-footer">
                            <div class="producto-card-pricing">
                                <span class="producto-card-precio">${formatearMoneda(prod.precio_base)}</span>
                                <span class="producto-card-stock-num">${stock} disponibles</span>
                            </div>

                            <div class="producto-card-actions">
                                <div class="producto-qty-control">
                                    <button type="button" class="producto-qty-btn" onclick="window.ajustarCantidadCard('${escapar(prod.producto_id)}', -1)">-</button>
                                    <input type="number" class="producto-qty-input" id="qty-${escapar(prod.producto_id)}" value="1" min="1" max="${stock}" ${agotado ? "disabled" : ""}>
                                    <button type="button" class="producto-qty-btn" onclick="window.ajustarCantidadCard('${escapar(prod.producto_id)}', 1)">+</button>
                                </div>
                                <button type="button" class="btn-add-carrito" ${agotado ? "disabled" : ""} onclick="window.agregarAlCarritoDesdeCard('${escapar(prod.producto_id)}')">
                                    <span>🛒</span> Añadir
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    // Funciones auxiliares para controles en tarjetas
    window.ajustarCantidadCard = function (productoId, delta) {
        const input = document.getElementById(`qty-${productoId}`);
        if (!input) return;
        const prod = state.catalogo.find(p => p.producto_id === productoId);
        const max = prod ? Number(prod.stock || 1) : 99;
        let actual = parseInt(input.value) || 1;
        actual += delta;
        if (actual < 1) actual = 1;
        if (actual > max) actual = max;
        input.value = actual;
    };

    window.agregarAlCarritoDesdeCard = function (productoId) {
        const input = document.getElementById(`qty-${productoId}`);
        const cantidad = input ? parseInt(input.value) || 1 : 1;
        agregarAlCarrito(productoId, cantidad);
    };

    // =========================================================================
    // CARRITO DE COMPRAS
    // =========================================================================
    function configurarEventosCarrito() {
        const btnAbrir = document.getElementById("btn-abrir-carrito");
        const modal = document.getElementById("modal-carrito");
        const btnCerrar = document.getElementById("btn-cerrar-carrito");
        const btnConfirmar = document.getElementById("btn-confirmar-pedido");

        if (btnAbrir) {
            btnAbrir.addEventListener("click", () => abrirModalCarrito());
        }

        if (btnCerrar) {
            btnCerrar.addEventListener("click", () => cerrarModalCarrito());
        }

        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) cerrarModalCarrito();
            });
        }

        if (btnConfirmar) {
            btnConfirmar.addEventListener("click", () => procesarPedidoCliente());
        }
    }

    function abrirModalCarrito() {
        renderizarCarritoModal();
        const modal = document.getElementById("modal-carrito");
        if (modal) modal.classList.add("active");
    }

    function cerrarModalCarrito() {
        const modal = document.getElementById("modal-carrito");
        if (modal) modal.classList.remove("active");
    }

    function agregarAlCarrito(productoId, cantidadDeseada = 1) {
        const producto = state.catalogo.find(p => p.producto_id === productoId);
        if (!producto) {
            mostrarToast("Producto no encontrado.", "error");
            return;
        }

        const stockDisponible = Number(producto.stock || 0);
        if (stockDisponible <= 0) {
            mostrarToast("Este producto se encuentra agotado.", "error");
            return;
        }

        const itemExistente = state.carrito.find(item => item.producto_id === productoId);
        const cantidadActual = itemExistente ? itemExistente.cantidad : 0;
        const nuevaCantidad = cantidadActual + cantidadDeseada;

        if (nuevaCantidad > stockDisponible) {
            mostrarToast(`Solo hay ${stockDisponible} unidades disponibles de este producto.`, "error");
            return;
        }

        if (itemExistente) {
            itemExistente.cantidad = nuevaCantidad;
        } else {
            state.carrito.push({
                producto_id: producto.producto_id,
                nombre: producto.nombre,
                precio_base: Number(producto.precio_base || 0),
                cantidad: cantidadDeseada,
                stock_disponible: stockDisponible
            });
        }

        guardarCarrito();
        actualizarBadgeCarrito();
        mostrarToast(`✓ ¡Añadido al carrito! (${cantidadDeseada} unid.)`, "success");
    }
    window.agregarAlCarrito = agregarAlCarrito;

    function guardarCarrito() {
        try {
            localStorage.setItem(STORAGE_KEYS.CARRITO, JSON.stringify(state.carrito));
        } catch (e) {
            console.error("Error al guardar carrito:", e);
        }
    }

    function actualizarBadgeCarrito() {
        const badges = document.querySelectorAll(".carrito-badge");
        const totalItems = state.carrito.reduce((acc, item) => acc + item.cantidad, 0);
        badges.forEach(b => {
            b.textContent = totalItems;
        });
    }

    function renderizarCarritoModal() {
        const contenedorItems = document.getElementById("carrito-items-contenedor");
        const resumenSubtotal = document.getElementById("carrito-subtotal-val");
        const resumenTotal = document.getElementById("carrito-total-val");
        const inputDireccion = document.getElementById("carrito-direccion-envio");
        const btnConfirmar = document.getElementById("btn-confirmar-pedido");

        if (!contenedorItems) return;

        // Si el cliente está autenticado y tiene dirección registrada, pre-llenar
        if (state.clienteActual && inputDireccion && !inputDireccion.value) {
            inputDireccion.value = state.clienteActual.direccion || "";
        }

        if (state.carrito.length === 0) {
            contenedorItems.innerHTML = `
                <div class="cliente-empty-state" style="padding: 30px 10px;">
                    <span class="cliente-empty-icon">🛒</span>
                    <h3>Tu carrito está vacío</h3>
                    <p>Agrega productos desde el catálogo para realizar tu pedido.</p>
                </div>
            `;
            if (resumenSubtotal) resumenSubtotal.textContent = "$ 0";
            if (resumenTotal) resumenTotal.textContent = "$ 0";
            if (btnConfirmar) btnConfirmar.disabled = true;
            return;
        }

        if (btnConfirmar) btnConfirmar.disabled = false;

        let total = 0;

        contenedorItems.innerHTML = state.carrito.map(item => {
            const subtotalItem = item.precio_base * item.cantidad;
            total += subtotalItem;

            return `
                <div class="carrito-item-row" data-id="${escapar(item.producto_id)}">
                    <div class="carrito-item-info">
                        <h4>${escapar(item.nombre)}</h4>
                        <small>${escapar(item.producto_id)} • ${formatearMoneda(item.precio_base)} c/u</small>
                    </div>

                    <div class="producto-qty-control" style="border-radius: 6px;">
                        <button type="button" class="producto-qty-btn" style="height: 30px; width: 24px;" onclick="window.cambiarCantidadItemCarrito('${escapar(item.producto_id)}', -1)">-</button>
                        <span style="padding: 0 10px; font-size: 13px; font-weight: 700; align-self: center;">${item.cantidad}</span>
                        <button type="button" class="producto-qty-btn" style="height: 30px; width: 24px;" onclick="window.cambiarCantidadItemCarrito('${escapar(item.producto_id)}', 1)">+</button>
                    </div>

                    <div class="carrito-item-price">
                        ${formatearMoneda(subtotalItem)}
                    </div>

                    <button type="button" class="carrito-item-remove" title="Eliminar del carrito" onclick="window.eliminarItemCarrito('${escapar(item.producto_id)}')">
                        ✕
                    </button>
                </div>
            `;
        }).join("");

        if (resumenSubtotal) resumenSubtotal.textContent = formatearMoneda(total);
        if (resumenTotal) resumenTotal.textContent = formatearMoneda(total);
    }

    window.cambiarCantidadItemCarrito = function (productoId, delta) {
        const item = state.carrito.find(i => i.producto_id === productoId);
        if (!item) return;

        const nuevaCant = item.cantidad + delta;
        if (nuevaCant <= 0) {
            window.eliminarItemCarrito(productoId);
            return;
        }

        if (nuevaCant > item.stock_disponible) {
            mostrarToast(`Stock máximo alcanzado (${item.stock_disponible} unid.)`, "error");
            return;
        }

        item.cantidad = nuevaCant;
        guardarCarrito();
        actualizarBadgeCarrito();
        renderizarCarritoModal();
    };

    window.eliminarItemCarrito = function (productoId) {
        state.carrito = state.carrito.filter(i => i.producto_id !== productoId);
        guardarCarrito();
        actualizarBadgeCarrito();
        renderizarCarritoModal();
        mostrarToast("Producto eliminado del carrito", "info");
    };

    // =========================================================================
    // PROCESAMIENTO DE PEDIDOS (CREAR VENTA EN BACKEND O FALLBACK LOCAL)
    // =========================================================================
    async function procesarPedidoCliente() {
        // 1. Verificar si hay productos en el carrito
        if (state.carrito.length === 0) {
            mostrarToast("Tu carrito está vacío.", "error");
            return;
        }

        // 2. Verificar autenticación del cliente
        if (!state.clienteActual) {
            state.accionPendientePostLogin = "confirmar_pedido";
            cerrarModalCarrito();
            abrirModalAuth("login", "Inicia sesión o regístrate para poder confirmar tu pedido.");
            return;
        }

        // 3. Obtener y validar dirección de entrega
        const inputDireccion = document.getElementById("carrito-direccion-envio");
        const direccion = inputDireccion ? inputDireccion.value.trim() : "";

        if (!direccion) {
            mostrarToast("Por favor, ingresa una dirección de envío para la entrega.", "error");
            if (inputDireccion) inputDireccion.focus();
            return;
        }

        const btnConfirmar = document.getElementById("btn-confirmar-pedido");
        if (btnConfirmar) {
            btnConfirmar.disabled = true;
            btnConfirmar.innerHTML = "<span>⏳</span> Procesando pedido...";
        }

        // Construir datos de la venta compatibles con la API del backend
        const venta = {
            cliente_id: state.clienteActual.cliente_id,
            direccion_envio: direccion,
            detalles: state.carrito.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad
            }))
        };

        const totalMonto = state.carrito.reduce((acc, item) => acc + (item.precio_base * item.cantidad), 0);
        const nuevoPedidoLocal = {
            pedido_id: `PED-${Date.now().toString().slice(-6)}`,
            cliente_id: state.clienteActual.cliente_id,
            cliente_nombre: `${state.clienteActual.nombre} ${state.clienteActual.apellido}`.trim(),
            direccion_envio: direccion,
            fecha_pedido: new Date().toISOString().slice(0, 19).replace("T", " "),
            monto_total: totalMonto,
            estado: "Procesado",
            detalles: state.carrito.map(item => ({
                producto_id: item.producto_id,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio_unitario: item.precio_base
            }))
        };

        try {
            // Intentar enviar al backend real a través de API.ventas.crear
            let respuestaBackend = null;
            try {
                respuestaBackend = await API.ventas.crear(venta);
                console.log("Pedido registrado en el backend:", respuestaBackend);
            } catch (errApi) {
                console.warn("Backend no disponible o error al registrar venta en API; guardando pedido en historial local:", errApi);
            }

            // Guardar en el historial local de pedidos para resiliencia y consulta
            guardarPedidoLocal(nuevoPedidoLocal);

            // Actualizar stock local y vaciar carrito
            state.carrito.forEach(item => {
                if (state.stockMap[item.producto_id] !== undefined) {
                    state.stockMap[item.producto_id] = Math.max(0, state.stockMap[item.producto_id] - item.cantidad);
                }
            });

            state.carrito = [];
            guardarCarrito();
            actualizarBadgeCarrito();
            cerrarModalCarrito();

            mostrarToast(`🎉 ¡Pedido #${nuevoPedidoLocal.pedido_id} realizado con éxito!`, "success");

            // Refrescar el catálogo para reflejar nuevo stock
            renderizarCatalogo();

            // Cambiar a la vista "Mis Pedidos" para que el cliente vea su orden de inmediato
            cambiarSeccionCliente("pedidos");

        } catch (error) {
            console.error("Error crítico al procesar pedido:", error);
            mostrarToast("No se pudo completar el pedido: " + error.message, "error");
        } finally {
            if (btnConfirmar) {
                btnConfirmar.disabled = false;
                btnConfirmar.innerHTML = "<span>✓</span> Confirmar y Realizar Pedido";
            }
        }
    }

    function guardarPedidoLocal(pedido) {
        try {
            let pedidos = [];
            const guardados = localStorage.getItem(STORAGE_KEYS.PEDIDOS_LOCALES);
            if (guardados) pedidos = JSON.parse(guardados);
            pedidos.unshift(pedido);
            localStorage.setItem(STORAGE_KEYS.PEDIDOS_LOCALES, JSON.stringify(pedidos));
        } catch (e) {
            console.error("Error al guardar pedido local:", e);
        }
    }

    // =========================================================================
    // SECCIÓN "MIS PEDIDOS" DEL CLIENTE
    // =========================================================================
    async function cargarMisPedidosCliente() {
        const contenedor = document.getElementById("cliente-pedidos-contenedor");
        if (!contenedor) return;

        // Si no ha iniciado sesión, invitar a iniciar sesión
        if (!state.clienteActual) {
            contenedor.innerHTML = `
                <div class="cliente-empty-state">
                    <span class="cliente-empty-icon">🔒</span>
                    <h3>Inicia sesión para ver tus pedidos</h3>
                    <p>Ingresa a tu cuenta de cliente para consultar tu historial de compras y el estado de tus entregas.</p>
                    <button class="btn-primary" style="margin-top: 16px;" onclick="window.abrirModalAuth('login')">
                        Iniciar Sesión
                    </button>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = `
            <div class="cliente-empty-state">
                <span class="cliente-empty-icon">⏳</span>
                <h3>Cargando tus pedidos...</h3>
            </div>
        `;

        try {
            let pedidosRemotos = [];

            // Consultar pedidos y ventas en el backend
            try {
                const resVentas = await API.pedidos.listar();
                if (Array.isArray(resVentas)) {
                    pedidosRemotos = resVentas.filter(p =>
                        String(p.cliente_id || "").toLowerCase() === String(state.clienteActual.cliente_id).toLowerCase()
                    );
                }
            } catch (errApi) {
                console.warn("Backend no disponible para listar pedidos remotos:", errApi);
            }

            // Consultar pedidos locales guardados en navegador
            let pedidosLocales = [];
            try {
                const guardados = localStorage.getItem(STORAGE_KEYS.PEDIDOS_LOCALES);
                if (guardados) {
                    pedidosLocales = JSON.parse(guardados).filter(p =>
                        String(p.cliente_id || "").toLowerCase() === String(state.clienteActual.cliente_id).toLowerCase()
                    );
                }
            } catch (e) {
                console.error("Error al leer pedidos locales:", e);
            }

            // Combinar pedidos sin duplicar IDs
            const mapaUnico = new Map();
            pedidosLocales.forEach(p => mapaUnico.set(p.pedido_id, p));
            pedidosRemotos.forEach(p => {
                const id = p.pedido_id || p.id;
                if (!mapaUnico.has(id)) mapaUnico.set(id, p);
            });

            const todosLosPedidos = Array.from(mapaUnico.values());

            if (todosLosPedidos.length === 0) {
                contenedor.innerHTML = `
                    <div class="cliente-empty-state">
                        <span class="cliente-empty-icon">📦</span>
                        <h3>No tienes pedidos registrados</h3>
                        <p>Aún no has realizado ninguna compra con tu cuenta. ¡Visita el catálogo y haz tu primer pedido!</p>
                        <button class="btn-primary" style="margin-top: 16px;" onclick="window.cambiarSeccionCliente('catalogo')">
                            Explorar Catálogo
                        </button>
                    </div>
                `;
                return;
            }

            contenedor.innerHTML = `
                <div class="cliente-pedidos-list">
                    ${todosLosPedidos.map(pedido => {
                        const id = pedido.pedido_id || pedido.id || "PED-S/N";
                        const fecha = pedido.fecha_pedido || pedido.fecha || "Reciente";
                        const direccion = pedido.direccion_envio || "Dirección registrada";
                        const estado = pedido.estado || "Procesado";
                        const monto = pedido.monto_total || pedido.total || 0;
                        const detalles = Array.isArray(pedido.detalles) ? pedido.detalles : [];

                        let claseEstado = "procesado";
                        if (estado.toLowerCase().includes("pend")) claseEstado = "pendiente";

                        return `
                            <article class="pedido-card-cliente">
                                <div class="pedido-card-header">
                                    <div class="pedido-card-info">
                                        <h4>Pedido #${escapar(id)}</h4>
                                        <div class="pedido-card-date">Fecha: ${escapar(fecha)}</div>
                                    </div>
                                    <span class="pedido-status-pill ${claseEstado}">${escapar(estado)}</span>
                                </div>

                                <table class="pedido-items-table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th style="text-align: center;">Cant.</th>
                                            <th style="text-align: right;">Precio Unit.</th>
                                            <th style="text-align: right;">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${detalles.length > 0 ? detalles.map(d => {
                                            const cant = Number(d.cantidad || 1);
                                            const precio = Number(d.precio_unitario || d.precio || 0);
                                            const nombre = d.nombre || d.producto_id || "Producto";
                                            return `
                                                <tr>
                                                    <td><strong>${escapar(nombre)}</strong> <small>(${escapar(d.producto_id || "")})</small></td>
                                                    <td style="text-align: center;">${cant}</td>
                                                    <td style="text-align: right;">${formatearMoneda(precio)}</td>
                                                    <td style="text-align: right;"><strong>${formatearMoneda(cant * precio)}</strong></td>
                                                </tr>
                                            `;
                                        }).join("") : `
                                            <tr>
                                                <td colspan="4" style="color: #94a3b8; font-style: italic;">Detalles de productos procesados en orden.</td>
                                            </tr>
                                        `}
                                    </tbody>
                                </table>

                                <div class="pedido-card-footer">
                                    <div class="pedido-direccion">
                                        <span>📍 Envío a: <strong>${escapar(direccion)}</strong></span>
                                    </div>
                                    <div class="pedido-total-box">
                                        <span>Total Pagado:</span>
                                        <strong>${formatearMoneda(monto)}</strong>
                                    </div>
                                </div>
                            </article>
                        `;
                    }).join("")}
                </div>
            `;

        } catch (error) {
            console.error("Error al cargar pedidos del cliente:", error);
            contenedor.innerHTML = `
                <div class="cliente-empty-state">
                    <span class="cliente-empty-icon">⚠️</span>
                    <h3>No se pudieron cargar tus pedidos</h3>
                    <p>${escapar(error.message)}</p>
                </div>
            `;
        }
    }
    window.cambiarSeccionCliente = cambiarSeccionCliente;

    // =========================================================================
    // AUTENTICACIÓN Y REGISTRO DE CLIENTES
    // =========================================================================
    function configurarEventosAuth() {
        const modal = document.getElementById("modal-auth-cliente");
        const btnCerrar = document.getElementById("btn-cerrar-auth");
        const tabLogin = document.getElementById("tab-auth-login");
        const tabRegistro = document.getElementById("tab-auth-registro");
        const formLogin = document.getElementById("form-cliente-login");
        const formRegistro = document.getElementById("form-cliente-registro");
        const btnAuthNav = document.getElementById("btn-cliente-auth-nav");

        if (btnAuthNav) {
            btnAuthNav.addEventListener("click", () => {
                if (state.clienteActual) {
                    // Si ya está autenticado, mostrar menú o confirmar cierre de sesión
                    if (confirm(`Sesión iniciada como: ${state.clienteActual.nombre} ${state.clienteActual.apellido}\n¿Deseas cerrar tu sesión?`)) {
                        cerrarSesionCliente();
                    }
                } else {
                    abrirModalAuth("login");
                }
            });
        }

        if (btnCerrar) {
            btnCerrar.addEventListener("click", () => cerrarModalAuth());
        }

        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) cerrarModalAuth();
            });
        }

        // Cambio de pestañas Login / Registro
        if (tabLogin) {
            tabLogin.addEventListener("click", () => alternarTabAuth("login"));
        }

        if (tabRegistro) {
            tabRegistro.addEventListener("click", () => alternarTabAuth("registro"));
        }

        // Envío de Login
        if (formLogin) {
            formLogin.addEventListener("submit", procesarLogin);
        }

        // Envío de Registro
        if (formRegistro) {
            formRegistro.addEventListener("submit", procesarRegistro);
        }
    }

    function abrirModalAuth(tab = "login", mensajeAviso = null) {
        alternarTabAuth(tab);
        const modal = document.getElementById("modal-auth-cliente");
        const aviso = document.getElementById("auth-mensaje-aviso");

        if (aviso) {
            if (mensajeAviso) {
                aviso.textContent = mensajeAviso;
                aviso.style.display = "block";
            } else {
                aviso.style.display = "none";
            }
        }

        if (modal) modal.classList.add("active");
    }
    window.abrirModalAuth = abrirModalAuth;

    function cerrarModalAuth() {
        const modal = document.getElementById("modal-auth-cliente");
        if (modal) modal.classList.remove("active");
    }

    function alternarTabAuth(tab) {
        const tabLogin = document.getElementById("tab-auth-login");
        const tabRegistro = document.getElementById("tab-auth-registro");
        const viewLogin = document.getElementById("view-auth-login");
        const viewRegistro = document.getElementById("view-auth-registro");

        if (tab === "login") {
            tabLogin?.classList.add("active");
            tabRegistro?.classList.remove("active");
            viewLogin?.classList.add("active");
            viewRegistro?.classList.remove("active");
        } else {
            tabRegistro?.classList.add("active");
            tabLogin?.classList.remove("active");
            viewRegistro?.classList.add("active");
            viewLogin?.classList.remove("active");
        }
    }

    async function procesarLogin(e) {
        e.preventDefault();
        const inputId = document.getElementById("login-cliente-id").value.trim();
        const inputPass = document.getElementById("login-cliente-pass").value;

        if (!inputId) {
            mostrarToast("Ingresa tu correo o ID de cliente.", "error");
            return;
        }

        let clienteEncontrado = null;

        // 1. Buscar en almacenamiento local
        try {
            const clientesLocales = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || "[]");
            clienteEncontrado = clientesLocales.find(c =>
                c.cliente_id.toLowerCase() === inputId.toLowerCase() ||
                c.email.toLowerCase() === inputId.toLowerCase()
            );
        } catch (err) {
            console.error("Error al buscar cliente local:", err);
        }

        // 2. Si no se encuentra localmente, buscar en backend mediante API.clientes
        if (!clienteEncontrado) {
            try {
                const clientesApi = await API.clientes.listar();
                if (Array.isArray(clientesApi)) {
                    clienteEncontrado = clientesApi.find(c =>
                        String(c.cliente_id || "").toLowerCase() === inputId.toLowerCase() ||
                        String(c.email || "").toLowerCase() === inputId.toLowerCase()
                    );
                }
            } catch (errApi) {
                console.warn("Backend no disponible para consultar clientes:", errApi);
            }
        }

        if (!clienteEncontrado) {
            mostrarToast("Cliente no encontrado. Revisa tu ID/correo o regístrate.", "error");
            return;
        }

        // Guardar sesión
        state.clienteActual = clienteEncontrado;
        localStorage.setItem(STORAGE_KEYS.SESION, JSON.stringify(clienteEncontrado));

        actualizarUIAutenticacion();
        cerrarModalAuth();
        mostrarToast(`👋 ¡Bienvenido de nuevo, ${clienteEncontrado.nombre}!`, "success");

        // Si tenía un pedido pendiente por confirmar
        if (state.accionPendientePostLogin === "confirmar_pedido") {
            state.accionPendientePostLogin = null;
            abrirModalCarrito();
        } else if (state.seccionActiva === "pedidos") {
            cargarMisPedidosCliente();
        }
    }

    async function procesarRegistro(e) {
        e.preventDefault();

        const cliente = {
            cliente_id: document.getElementById("reg-cliente-id").value.trim(),
            nombre: document.getElementById("reg-cliente-nombre").value.trim(),
            apellido: document.getElementById("reg-cliente-apellido").value.trim(),
            email: document.getElementById("reg-cliente-email").value.trim(),
            telefono: document.getElementById("reg-cliente-telefono").value.trim(),
            direccion: document.getElementById("reg-cliente-direccion").value.trim(),
            password: document.getElementById("reg-cliente-pass").value
        };

        if (!cliente.cliente_id || !cliente.nombre || !cliente.email) {
            mostrarToast("Por favor completa los campos requeridos.", "error");
            return;
        }

        const btnSubmit = document.getElementById("btn-submit-registro");
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Registrando...";
        }

        try {
            // 1. Guardar en Backend a través de API.clientes.crear (solo campos admitidos por el backend)
            try {
                await API.clientes.crear({
                    cliente_id: cliente.cliente_id,
                    nombre: cliente.nombre,
                    apellido: cliente.apellido,
                    email: cliente.email,
                    telefono: cliente.telefono
                });
                console.log("Cliente registrado en el backend correctamente.");
            } catch (errApi) {
                console.warn("Aviso: No se pudo conectar con el backend; se guardará cliente localmente:", errApi);
            }

            // 2. Guardar en almacenamiento local del navegador
            let clientesLocales = [];
            try {
                clientesLocales = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || "[]");
            } catch (err) {
                clientesLocales = [];
            }

            // Evitar duplicados por ID
            clientesLocales = clientesLocales.filter(c => c.cliente_id !== cliente.cliente_id);
            clientesLocales.push(cliente);
            localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientesLocales));

            // Iniciar sesión automáticamente
            state.clienteActual = cliente;
            localStorage.setItem(STORAGE_KEYS.SESION, JSON.stringify(cliente));

            actualizarUIAutenticacion();
            cerrarModalAuth();
            document.getElementById("form-cliente-registro").reset();

            mostrarToast(`🎉 ¡Cuenta creada con éxito! Bienvenido, ${cliente.nombre}`, "success");

            if (state.accionPendientePostLogin === "confirmar_pedido") {
                state.accionPendientePostLogin = null;
                abrirModalCarrito();
            } else if (state.seccionActiva === "pedidos") {
                cargarMisPedidosCliente();
            }

        } catch (error) {
            console.error("Error al registrar cliente:", error);
            mostrarToast("Error al registrar cliente: " + error.message, "error");
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Crear Cuenta de Cliente";
            }
        }
    }

    function cerrarSesionCliente() {
        state.clienteActual = null;
        localStorage.removeItem(STORAGE_KEYS.SESION);
        actualizarUIAutenticacion();
        mostrarToast("Sesión cerrada.", "info");

        if (state.seccionActiva === "pedidos") {
            cargarMisPedidosCliente();
        }
    }

    function actualizarUIAutenticacion() {
        const btnAuthNav = document.getElementById("btn-cliente-auth-nav");
        const heroSessionBox = document.getElementById("cliente-hero-session-status");

        if (!btnAuthNav) return;

        if (state.clienteActual) {
            const iniciales = (state.clienteActual.nombre?.[0] || "C") + (state.clienteActual.apellido?.[0] || "");
            btnAuthNav.innerHTML = `
                <div class="cliente-user-avatar">${iniciales.toUpperCase()}</div>
                <span>${escapar(state.clienteActual.nombre)}</span>
                <small style="color: #ef4444; margin-left: 4px; font-size: 11px;">(Salir)</small>
            `;
            btnAuthNav.title = "Sesión iniciada. Clic para cerrar sesión.";

            if (heroSessionBox) {
                heroSessionBox.innerHTML = `
                    <p>Sesión activa como cliente</p>
                    <strong>👤 ${escapar(state.clienteActual.nombre)} ${escapar(state.clienteActual.apellido)}</strong>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">ID: ${escapar(state.clienteActual.cliente_id)}</div>
                `;
            }
        } else {
            btnAuthNav.innerHTML = `
                <span>👤</span>
                <span>Ingresar / Registrarse</span>
            `;
            btnAuthNav.title = "Iniciar sesión o registrar cuenta de cliente";

            if (heroSessionBox) {
                heroSessionBox.innerHTML = `
                    <p>¿Nuevo cliente?</p>
                    <button class="btn-primary" style="padding: 7px 14px; font-size: 12px;" onclick="window.abrirModalAuth('registro')">
                        Crear Cuenta Gratis
                    </button>
                `;
            }
        }
    }

    // Inicio de sesión rápido para pruebas / demo
    window.demoLogin = function (id) {
        const inputId = document.getElementById("login-cliente-id");
        const inputPass = document.getElementById("login-cliente-pass");
        if (inputId) inputId.value = id;
        if (inputPass) inputPass.value = "123";
        const form = document.getElementById("form-cliente-login");
        if (form) form.dispatchEvent(new Event("submit"));
    };

    // =========================================================================
    // UTILIDADES: TOAST, MONEDA, ESCAPADO, HASH
    // =========================================================================
    function mostrarToast(mensaje, tipo = "info") {
        let contenedor = document.getElementById("cliente-toast-container");
        if (!contenedor) {
            contenedor = document.createElement("div");
            contenedor.id = "cliente-toast-container";
            contenedor.className = "cliente-toast-container";
            document.body.appendChild(contenedor);
        }

        const toast = document.createElement("div");
        toast.className = `cliente-toast ${tipo}`;
        toast.textContent = mensaje;

        contenedor.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(8px)";
            toast.style.transition = "all 0.25s ease";
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    }
    window.mostrarToast = mostrarToast;

    function formatearMoneda(valor) {
        return Number(valor || 0).toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        });
    }

    function escapar(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caracter]);
    }

    function hashString(str) {
        let hash = 0;
        const s = String(str || "");
        for (let i = 0; i < s.length; i++) {
            hash = ((hash << 5) - hash) + s.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }
})();

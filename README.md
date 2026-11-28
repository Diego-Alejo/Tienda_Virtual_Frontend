# Tienda Virtual - Frontend

Interfaz web de una aplicación de tienda virtual. Se conecta con el backend mediante una API REST y ofrece módulos de administración y un portal para clientes.

## Funcionalidades

### Panel administrativo

- **Dashboard:** visualización general de la información de la tienda.
- **Productos:** consulta y administración del catálogo.
- **Inventario:** consulta y gestión de existencias.
- **Ventas:** registro de ventas.
- **Clientes:** consulta y administración de clientes.
- **Pedidos:** consulta y gestión de pedidos.

### Portal del cliente

- Registro e inicio de sesión.
- Cierre de sesión.
- Consulta del catálogo de productos.
- Búsqueda y organización de productos.
- Carrito de compras.
- Selección de cantidades y cálculo de totales.
- Creación de pedidos.
- Consulta del historial de pedidos.

## Tecnologías

- HTML5
- CSS3
- JavaScript
- Fetch API
- API REST

No requiere React, Node.js ni un proceso de compilación.

## Estructura del proyecto

```text
Tienda_Virtual_Frontend/
├── index.html
├── css/
│   ├── styles.css
│   └── portal-cliente.css
├── js/
│   ├── api.js
│   ├── app.js
│   ├── productos.js
│   ├── stock.js
│   ├── ventas.js
│   ├── clientes.js
│   ├── pedidos.js
│   └── portal-cliente.js
└── README.md
```

## Requisitos

- Navegador web actualizado.
- Visual Studio Code.
- Extensión Live Server.
- Backend de Tienda Virtual configurado y en ejecución.

## Ejecución

1. Clonar o descargar el repositorio.
2. Abrir la carpeta del proyecto en Visual Studio Code.
3. Verificar que el backend esté ejecutándose.
4. Abrir `index.html` con la extensión Live Server.
5. Utilizar los módulos administrativos o ingresar al portal del cliente.

## Conexión con el backend

La aplicación consume la API REST del backend.

Dirección local utilizada durante el desarrollo:

```text
http://localhost:8080/api
```

Si el backend se ejecuta en otra dirección o puerto, se debe ajustar la configuración de conexión en el archivo JavaScript correspondiente.

## Backend

El backend se encuentra en un repositorio independiente:

[GitHub - Tienda Virtual Backend](https://github.com/ALEXGB09/Tienda_Virtual)

## Repositorio

[GitHub - Tienda Virtual Frontend](https://github.com/Diego-Alejo/Tienda_Virtual_Frontend)
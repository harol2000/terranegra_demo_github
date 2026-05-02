# Terranegra Demo GitHub

Demo estática e interactiva de Terranegra pensada para publicarse en GitHub Pages.

Incluye:

- Tienda web demo con catálogo, ofertas, carrito y checkout
- Login simulado por roles
- Panel cliente con pedidos
- Panel vendedor/admin con dashboard, pedidos, pagos por verificar, inventario, kardex, venta presencial, productos, categorías, ofertas, reportes y configuración
- Persistencia en `localStorage`
- Datos mock iniciales y botón para restablecer la demo

## Tecnologías

- React
- Vite
- CSS
- `localStorage`
- Datos mock/falsos

## Usuarios demo

- Cliente
  - Email: `cliente@cliente.com`
  - Password: `password`
- Vendedor
  - Email: `vendedor@gmail.com`
  - Password: `password`
- Admin
  - Email: `admin@terranegra.com`
  - Password: `password`

## Comandos

```bash
npm install
npm run dev
npm run build
```

## Cómo publicar en GitHub Pages

1. Sube este proyecto al repositorio `harol2000/terranegra_demo_github`.
2. Verifica que en `vite.config.js` el valor `base` siga siendo `/terranegra_demo_github/`.
3. Ejecuta localmente:

```bash
npm install
npm run build
```

4. Haz `push` a la rama `main`.
5. El workflow de GitHub Actions compilará la app y publicará `dist` en GitHub Pages.
6. En GitHub, revisa que Pages esté configurado para usar `GitHub Actions`.
7. Espera unos minutos y abre la URL pública del repositorio.

## Datos y comportamiento

- La sesión se guarda en `localStorage`.
- Los productos, pedidos, lotes, kardex y configuración también se guardan en `localStorage`.
- El botón `Restablecer datos demo` vuelve a crear los datos iniciales de prueba.
- La app usa `HashRouter` para que la navegación funcione bien en GitHub Pages.

## Nota importante

Esta es una demo estática. La versión real usa Laravel, MySQL, inventario real y kardex real.

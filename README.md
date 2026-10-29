# Evaluación II - Programación Web

Desarrollo de aplicaciones web con integración Frontend - Backend.
Universidad Centroamericana (UCA) · Programación Web · Ciclo 02, 2026

Dos proyectos independientes, cada uno con `backend/` (Express) y `frontend/` (Vite + React + Reactstrap).

## Integrantes

| Nombre | Carnet |
|---|---|
| Anderson José Turcios Flores | 00003925 |
| Rodrigo Josué Medrano Márquez | 00148625 |
| Andres Eduardo Vega Mena | 00077125 |
| Josue Emiliano Valdes Jacobo | 00003525 |

## Proyectos

| Proyecto | Descripción | Backend | Frontend |
|---|---|---|---|
| adivina-numero | Juego de adivinar un número del 1 al 100 | http://localhost:3005 | http://localhost:5173 |
| food-dei | Reserva de almuerzos con stock limitado, saldo y tiempo límite | http://localhost:3006 | http://localhost:5174 |

## Tecnologías

- JavaScript, Node.js y Express (backend)
- React, Vite y Reactstrap / Bootstrap (frontend)
- Estado y datos en memoria (sin base de datos)

## Cómo levantar cada parte

Requiere **Node.js 22 o superior**. Abrir una terminal por cada parte y ejecutar:

```bash
cd <proyecto>/<backend|frontend>
npm install
npm run dev
```

Ejemplo: `cd food-dei/backend && npm install && npm run dev`

### Atajo para adivina-numero

```bash
cd adivina-numero
npm run install:all
npm run dev   # levanta backend y frontend a la vez
npm test      # pruebas del backend
```

## Variables de entorno

Cada carpeta trae un `.env.example`. Copiarlo como `.env` y ajustar los valores.
Si falta el `.env`, el proyecto igual arranca con los puertos por defecto de la tabla de arriba.

## Endpoints de Food DEI

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/menu` | Lista el menú con precio y stock |
| GET | `/api/reserva` | Reserva activa y saldo disponible |
| POST | `/api/reserva/agregar` | Agrega un platillo a la reserva |
| PUT | `/api/reserva/actualizar-porciones/:id` | Sube o baja las porciones de un platillo |
| DELETE | `/api/reserva/eliminar/:id` | Quita un platillo y devuelve el stock |
| POST | `/api/reserva/confirmar` | Confirma la reserva (bloquea el stock y descuenta el saldo) |
| POST | `/api/reserva/reiniciar` | Inicia una reserva nueva (tras expirar o confirmar) |
| POST | `/api/reserva/restablecer` | Reinicio total: saldo y stock vuelven a sus valores iniciales |

## Códigos HTTP usados

| Código | Cuándo |
|---|---|
| 200 OK | Consulta, actualización, eliminación o confirmación exitosa |
| 201 Created | `POST /api/reserva/agregar` exitoso |
| 400 Bad Request | Datos inválidos, "Stock insuficiente", "Saldo insuficiente para esta cantidad", reserva vacía |
| 403 Forbidden | Origen no permitido por CORS |
| 404 Not Found | Ruta o platillo inexistente |
| 409 Conflict | La reserva ya expiró o ya fue confirmada |
| 500 Internal Server Error | Fallo inesperado del servidor |

## CORS

Configurado en `src/app.js` de cada backend para aceptar el origen de su frontend.
Si cambian el puerto del frontend, actualicen la variable `CORS_ORIGIN` del `.env`.

## Uso de inteligencia artificial generativa

Durante el desarrollo de este proyecto se utilizó **IA generativa (Claude, de Anthropic)** como herramienta de apoyo. Su uso se limitó a:

- Revisión del código para detectar errores y malas prácticas.
- Sugerencias para el manejo de códigos de respuesta HTTP y mensajes de error.
- Apoyo en la implementación de la confirmación de reserva.
- Redacción de comentarios explicativos en el código y de esta documentación.
- Explicación de conceptos (middleware, hooks de React, promesas) para comprender mejor la solución.

Todo el código fue revisado, probado y comprendido por los integrantes del equipo, quienes pueden explicar el funcionamiento de cada parte de la solución.
# Evaluación II - Programación Web 

Dos proyectos independientes, cada uno con `backend/` (Express) y `frontend/` (Vite + React).

| Proyecto | Backend | Frontend |
|---|---|---|
| adivina-numero | http://localhost:3001 | http://localhost:5173 |
| food-dei | http://localhost:3002 | http://localhost:5174 |

## Cómo levantar cada parte

Abrir una terminal por cada parte y ejecutar:

```bash
cd <proyecto>/<backend|frontend>
npm install
npm run dev
```

Ejemplo: `cd food-dei/backend && npm install && npm run dev`

## Variables de entorno
Cada carpeta trae un `.env.example`. Copiarlo en el .env y configurar las propias variables

## CORS
Configurado en `server.js` de cada backend para aceptar el origen de su frontend.
Si cambian el puerto del frontend, actualicen la lista `origin`.

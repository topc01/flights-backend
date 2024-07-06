## Conexión ssh a la instancia EC2

```
ssh -i E1-key.pem ubuntu@ec2-44-218-105-104.compute-1.amazonaws.com
```

## Ejecución de contenedores
Construir imagenes de docker:
```
bash scripts/imagenator.sh
```

Ejecutar contenedores:
```
sudo docker compose up
```

## Ejecución en local

1. Construir y ejecutar los contenedores de Docker.
2. Crear archivo .env en la raíz del proyecto a partir del archivo `.env.template`.
3. Acceder a la dirección `http://localhost:3000/` en el navegador.

## Nginx

Ruta del archivo de configuración: `/etc/nginx/sites-enabled/e1`

## Pasos CI

Existe un pipeline de CI con un job por cada aplicación en el backend que se ejecutará cuando se crea una pull request a las branch main y develop, el pipeline delegará cada ejecución a una máquina con la última versión de ubuntu. Los jobs son los siguientes.

1. **API**: Primero añade el código del repositorio a la máquina que ejecutará el job y luego crea un ambiente de Node instalando todas las dependencias para ejecutar aplicaciones en node. Finalmente ejecuta una instalación limpia de las dependencias recomendada para pipelines de CI, finalmente se ejecutan lint y test con npm para verificar que las reglas del linter se cumplen y que todos los test se ejecutan correctamente. Cada comando de `npm` se ejecuta dentro de la carpeta `exp-api` donde se encuentra el código de la aplicación.

2. **Suscriber_flights**: Primero añade el código del repositorio a la máquina que ejecutará el job y luego crea un ambiente de Node instalando todas las dependencias para ejecutar aplicaciones en node. Finalmente ejecuta una instalación limpia de las dependencias recomendada para pipelines de CI, finalmente se ejecuta lint con npm para verificar que las reglas del linter se cumplen. Cada comando de `npm` se ejecuta dentro de la carpeta `suscriber_flights` donde se encuentra el código de la aplicación.

3. **auth**: Se realizan los mismos pasos que en el job `suscriber_flights` pero ejecutandose los comandos en la carpeta `auth-service`.

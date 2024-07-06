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

O utilizar el script rebuild con flag opcional `-w n_workers` para especificar el número de workers:
```
bash scripts/rebuild.sh -w 3
```

## Nginx

Ruta del archivo de configuración: `/etc/nginx/sites-enabled/e1`

## UI worker service

`https://workers.nukor.xyz/admin/queues/`

## Documentación API

[Worker-service]{https://documenter.getpostman.com/view/18143890/2sA3QpBDRv}
[Requests]{https://documenter.getpostman.com/view/18143890/2sA3QmDuJD}

## Pasos CI

Existe un pipeline de CI con un job por cada aplicación en el backend que se ejecutará cuando se crea una pull request a las branch main y develop, el pipeline delegará cada ejecución a una máquina con la última versión de ubuntu. Los jobs son los siguientes.

1. **API**: Primero añade el código del repositorio a la máquina que ejecutará el job y luego crea un ambiente de Node instalando todas las dependencias para ejecutar aplicaciones en node. Finalmente ejecuta una instalación limpia de las dependencias recomendada para pipelines de CI, finalmente se ejecutan lint y test con npm para verificar que las reglas del linter se cumplen y que todos los test se ejecutan correctamente. Cada comando de `npm` se ejecuta dentro de la carpeta `exp-api` donde se encuentra el código de la aplicación.

2. **Suscriber_flights**: Primero añade el código del repositorio a la máquina que ejecutará el job y luego crea un ambiente de Node instalando todas las dependencias para ejecutar aplicaciones en node. Finalmente ejecuta una instalación limpia de las dependencias recomendada para pipelines de CI, finalmente se ejecuta lint con npm para verificar que las reglas del linter se cumplen. Cada comando de `npm` se ejecuta dentro de la carpeta `suscriber_flights` donde se encuentra el código de la aplicación.

3. **auth**: Se realizan los mismos pasos que en el job `suscriber_flights` pero ejecutandose los comandos en la carpeta `auth-service`.


## IaC

Se importa el proveedor de aws para terraform, el cual se utiliza para conectarse a la cuenta de aws y crear la infraestructura.

Se crea vpc con cidr block coomo un ip de uso interno.

Se crea tabla de ruteo para asociar las subnets con la gateway de internet.

Se crean 6 subnets en la vpc creada para cada una de las zonas de disponibilidad de la región us-east-1.L uego se definen asociaciones por cada subnet.

Se crea security group dentro de la vpc creada, permitiendo tráfico por los puertos 80 y 443 para http y https, además de permitir tráfico de entrada y salida por el puerto 22.

Se utiliza network interface en zona de disponibilidad us-east-1c

Se crea network interface en zona de disponibilidad us-east-1a dado el security group creado anteriormente.

Se crea ip elastica asociada a la instancia EC2.

Se crea instancia EC2 free tier, utilizando el AMI ID de la instancia de la entrega pasada para mantener la misma configuración, ejecutando un script de instalación de docker y nginx, dejando preparada a la instancia para recibir con el deploy del CD las imágenes de docker y ejecutarlas.


Finalmente se instancia la api gateway, luego se agregan los recursos o paths de la api, indicando sus jerarquía, por ejemplo el recursos {identifier} es hijo de flights y en la api se utiliza como `/flights/{identifier}`. Por último se crean los métodos de la api, asociandolos a los recursos creados.
# Diagrama UML
![Alt text](https://github.com/MrBased/back-e1/blob/main/docs/entrega1uml.jpg)
# Resumen del sistema
## Flujo de usuario
El usuario entra a una app web desplegada en Cloudfront, la cual tiene como fuente la build de la app en un bucket S3. Dicha web app funciona mediante requests realizadas a un Api Gateway capaz de autorizar/autenticar enviar y obtener información correspondiente a la compra y revisión de la lista de vuelos personal. Dicha Gateway conecta con la Flight Booking API encargada de delegar todas las requests al sistema interno de la web app.
## API y Componentes
La API permite manipular la DB que guarda vuelos, usuarios y solicitudes de vuelos
## Subscriber
Este componente es la interfaz entre la información entrante del broker y la API.

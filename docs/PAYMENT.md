
# Transbank
Para la implementación de la pasarela de pago se utilizó la API de Transbank, específicamente los servicios de Webpay. Para ello se creó un módulo en el backend que se encarga de generar la URL de pago y de recibir la respuesta de Transbank. La URL de pago se genera a partir de la información de la compra y se envía al frontend para que el usuario sea redirigido a la página de pago de Transbank. Una vez que el usuario realiza el pago, Transbank envía una respuesta al backend con la información de la transacción, la cual es validada y almacenada en la base de datos logrando actualizar el estado de una solicitud de compra. La implementación de la pasarela de pago se realizó siguiendo la [documentación oficial de Transbank](https://www.transbankdevelopers.cl/).

# Módulo de pago
`trx.js` es el módulo que se encarga de gestionar la pasarela de pago. Este módulo se encarga de instanciar el controlador de transacciones de Webpay desde el SDK de Transkbank (`transbank-sdk`). Además, contiene la función `createTransaction` que se inicializa el flujo de una transacción desde Transbank:

```javascript
const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));

const createTransaction = async (buyOrder, company, amount, returnUrl) => {
  const result = await tx.create(buyOrder, company, amount, returnUrl);
  return result;
};
```
Por otro lado, se utilizaron las funciones proporcionadas por el SDK de Transbank para validar la información de la transacción y actualizar el estado de la `Request` de compra en la base de datos:

```javascript
const transactionCommit = await trx.tx.commit(token);

const transactionStatus = await trx.tx.status(token);
```

## Pruebas
Para realizar las pruebas de la pasarela de pago se utilizó la API de integración en Transbank y se realizaron pruebas de pago exitoso y fallido. En el caso de un pago exitoso, se verifica que la información de la transacción sea correcta y se actualiza la `Request` de compra con el estado: `accepted`. En el caso de un pago fallido, se verifica que la información de la transacción sea correcta y se atualiza la `Request` base de datos con el estado: `rejected`. Bajo este último caso también se considera el caso en que el usuario cancele la transacción.

## Flujo
El flujo de la pasarela de pago es el siguiente:
1. El usuario selecciona un vuelo y procede a realizar la compra.
2. El backend crea la `Request` de compra, genera la URL de pago y la envía al frontend.
3. El usuario es redirigido a la página de pago de Transbank.
4. El usuario realiza/rechaza/falla el pago.
5. Transbank redirige al usuario a la vista de validación del pago.
6. El backend valida la información de la transacción y actualiza el estado de la `Request` de compra.
7. El usuario recibe una notificación via email de la compra en caso de pago exitoso.

## Referencias
- [Documentación oficial de Transbank](https://www.transbankdevelopers.cl/)

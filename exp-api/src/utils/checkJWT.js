const jwt = require('jsonwebtoken');

const { JWT_SECRET } = process.env;

function verifyJWT(req, res, next) {
  try {
    const token = req.headers.authorization || req.header('Authorization');
    // console.log('Permission:', permission);
    if (!token) {
      return res.status(401).json({ error: 'Access denied' });
    }
    // tira error si no esta autorizado
    const user_id = jwt.verify(token, JWT_SECRET).subject;
    req.body.user_id = user_id;
    next();
  } catch (error) {
    return res.status(400).json({ error: `Error verifying JWT: ${error}` });
  }
}

module.exports = verifyJWT;

const bcrypt = require('bcryptjs');

async function generarHash() {
  const contraseña = 'catita1008';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(contraseña, salt);
  console.log('Contraseña:', contraseña);
  console.log('Hash:', hash);
}

generarHash();

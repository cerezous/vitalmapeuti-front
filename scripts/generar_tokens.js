const jwt = require('jsonwebtoken');

// Crear un token válido para el usuario ID 2 usando el secret correcto
const token = jwt.sign(
  { 
    id: 2, 
    usuario: 'mcerezo', 
    estamento: 'Enfermería' 
  },
  'Fac20und15o',
  { expiresIn: '24h' }
);

console.log('🔑 Token generado para usuario ID 2:');
console.log(token);

// También crear un token para el usuario mcerezo (ID 16) que sabemos que existe
const token16 = jwt.sign(
  { 
    id: 16, 
    usuario: 'mcerezo', 
    estamento: 'Enfermería' 
  },
  'Fac20und15o',
  { expiresIn: '24h' }
);

console.log('\n🔑 Token generado para usuario ID 16:');
console.log(token16);

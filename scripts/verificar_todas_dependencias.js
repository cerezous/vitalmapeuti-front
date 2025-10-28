const Usuario = require('./models/Usuario');
const sequelize = require('./config/database');

// Configurar asociaciones
require('./config/associations');

async function verificarTodasLasDependencias() {
  try {
    await sequelize.authenticate();
    
    const userId = 3;
    
    // Verificar todas las tablas que pueden tener registros relacionados con el usuario
    const queries = [
      { tabla: 'nas', query: 'SELECT COUNT(*) as count FROM nas WHERE usuarioId = ?' },
      { tabla: 'apache2', query: 'SELECT COUNT(*) as count FROM apache2 WHERE usuarioId = ?' },
      { tabla: 'categorizacion_kinesiologia', query: 'SELECT COUNT(*) as count FROM categorizacion_kinesiologia WHERE usuarioId = ?' },
      { tabla: 'procedimiento_kinesiologia', query: 'SELECT COUNT(*) as count FROM procedimiento_kinesiologia WHERE usuarioId = ?' },
      { tabla: 'procedimiento_auxiliar', query: 'SELECT COUNT(*) as count FROM procedimiento_auxiliar WHERE usuarioId = ?' },
      { tabla: 'procedimiento_medicina', query: 'SELECT COUNT(*) as count FROM procedimiento_medicina WHERE usuarioId = ?' },
      { tabla: 'cuestionario_burnout', query: 'SELECT COUNT(*) as count FROM cuestionario_burnout WHERE usuarioId = ?' },
      { tabla: 'registro_procedimientos', query: 'SELECT COUNT(*) as count FROM registro_procedimientos WHERE usuarioId = ?' },
      { tabla: 'registro_procedimientos_tens', query: 'SELECT COUNT(*) as count FROM registro_procedimientos_tens WHERE usuarioId = ?' },
    ];
    
    
    for (const item of queries) {
      try {
        const [results] = await sequelize.query(item.query, {
          replacements: [userId],
          type: sequelize.QueryTypes.SELECT
        });
      } catch (error) {
      }
    }
    
    // Verificar también las tablas de procedimientos individuales que pueden tener dependencias
    const procedimientosQueries = [
      { tabla: 'procedimiento_registro', query: 'SELECT COUNT(*) as count FROM procedimiento_registro pr INNER JOIN registro_procedimientos rp ON pr.registroId = rp.id WHERE rp.usuarioId = ?' },
      { tabla: 'procedimiento_tens', query: 'SELECT COUNT(*) as count FROM procedimiento_tens pt INNER JOIN registro_procedimientos_tens rpt ON pt.registroId = rpt.id WHERE rpt.usuarioId = ?' }
    ];
    
    for (const item of procedimientosQueries) {
      try {
        const [results] = await sequelize.query(item.query, {
          replacements: [userId],
          type: sequelize.QueryTypes.SELECT
        });
      } catch (error) {
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

verificarTodasLasDependencias();
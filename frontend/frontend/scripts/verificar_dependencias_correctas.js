const sequelize = require('./config/database');

async function verificarDependenciasCorrectas() {
  try {
    await sequelize.authenticate();
    
    const userId = 3;
    
    // Usar los nombres correctos de las tablas
    const queries = [
      { tabla: 'nas', query: 'SELECT COUNT(*) as count FROM nas WHERE usuarioId = ?' },
      { tabla: 'apache2', query: 'SELECT COUNT(*) as count FROM apache2 WHERE usuarioId = ?' },
      { tabla: 'categorizaciones_kinesiologia', query: 'SELECT COUNT(*) as count FROM categorizaciones_kinesiologia WHERE usuarioId = ?' },
      { tabla: 'procedimientos_kinesiologia', query: 'SELECT COUNT(*) as count FROM procedimientos_kinesiologia WHERE usuarioId = ?' },
      { tabla: 'procedimientos_auxiliares', query: 'SELECT COUNT(*) as count FROM procedimientos_auxiliares WHERE usuarioId = ?' },
      { tabla: 'procedimientos_medicina', query: 'SELECT COUNT(*) as count FROM procedimientos_medicina WHERE usuarioId = ?' },
      { tabla: 'CuestionarioBurnout', query: 'SELECT COUNT(*) as count FROM CuestionarioBurnout WHERE usuarioId = ?' },
      { tabla: 'registros_procedimientos', query: 'SELECT COUNT(*) as count FROM registros_procedimientos WHERE usuarioId = ?' },
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
    
    // Verificar también las tablas de procedimientos individuales
    const procedimientosQueries = [
      { tabla: 'procedimientos_registro', query: 'SELECT COUNT(*) as count FROM procedimientos_registro pr INNER JOIN registros_procedimientos rp ON pr.registroId = rp.id WHERE rp.usuarioId = ?' },
      { tabla: 'procedimientos_tens', query: 'SELECT COUNT(*) as count FROM procedimientos_tens pt INNER JOIN registro_procedimientos_tens rpt ON pt.registroId = rpt.id WHERE rpt.usuarioId = ?' }
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

verificarDependenciasCorrectas();
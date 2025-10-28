const sequelize = require('./config/database');

async function verificarDependenciasUsuarios() {
  try {
    await sequelize.authenticate();
    
    const usuarios = [1, 4, 5, 8, 9];
    
    for (const userId of usuarios) {
      
      const queries = [
        { tabla: 'nas', query: 'SELECT COUNT(*) as count FROM nas WHERE usuarioId = ?' },
        { tabla: 'apache2', query: 'SELECT COUNT(*) as count FROM apache2 WHERE usuarioId = ?' },
        { tabla: 'procedimientos_medicina', query: 'SELECT COUNT(*) as count FROM procedimientos_medicina WHERE usuarioId = ?' },
        { tabla: 'procedimientos_kinesiologia', query: 'SELECT COUNT(*) as count FROM procedimientos_kinesiologia WHERE usuarioId = ?' },
        { tabla: 'procedimientos_auxiliares', query: 'SELECT COUNT(*) as count FROM procedimientos_auxiliares WHERE usuarioId = ?' },
        { tabla: 'registros_procedimientos', query: 'SELECT COUNT(*) as count FROM registros_procedimientos WHERE usuarioId = ?' },
      ];
      
      let totalDependencias = 0;
      
      for (const item of queries) {
        try {
          const [results] = await sequelize.query(item.query, {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT
          });
          if (results.count > 0) {
            totalDependencias += results.count;
          }
        } catch (error) {
        }
      }
      
      if (totalDependencias === 0) {
      } else {
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

verificarDependenciasUsuarios();
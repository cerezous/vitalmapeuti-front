const sequelize = require('../backend/config/database');
const RegistroProcedimientos = require('../backend/models/RegistroProcedimientos');
const ProcedimientoRegistro = require('../backend/models/ProcedimientoRegistro');
const CategorizacionKinesiologia = require('../backend/models/CategorizacionKinesiologia');
const { Op } = require('sequelize');

async function testMetricasUsuario() {
  try {
    console.log('🔍 Probando métricas de usuario localmente...');
    
    const usuarioId = 2; // ID del usuario de prueba
    
    console.log('\n1. Probando RegistroProcedimientos.findAll...');
    const registrosUsuario = await RegistroProcedimientos.findAll({
      where: { usuarioId },
      attributes: ['id']
    });
    console.log('Registros encontrados:', registrosUsuario.length);
    console.log('IDs:', registrosUsuario.map(r => r.id));
    
    const registrosIds = registrosUsuario.map(r => r.id);
    
    console.log('\n2. Probando ProcedimientoRegistro.count...');
    let totalProcedimientos = 0;
    if (registrosIds.length > 0) {
      totalProcedimientos = await ProcedimientoRegistro.count({
        where: { registroId: { [Op.in]: registrosIds } }
      });
    }
    console.log('Total procedimientos:', totalProcedimientos);
    
    console.log('\n3. Probando RegistroProcedimientos.sum...');
    const tiempoTotalResult = await RegistroProcedimientos.sum('tiempoTotal', {
      where: { usuarioId }
    });
    console.log('Tiempo total:', tiempoTotalResult);
    
    console.log('\n4. Probando CategorizacionKinesiologia.count...');
    const totalCategorizaciones = await CategorizacionKinesiologia.count({
      where: { usuarioId }
    });
    console.log('Total categorizaciones:', totalCategorizaciones);
    
    console.log('\n5. Probando pacientes únicos...');
    let numeroPacientesAtendidos = 0;
    if (registrosIds.length > 0) {
      const pacientesUnicos = await ProcedimientoRegistro.findAll({
        where: { 
          registroId: { [Op.in]: registrosIds },
          pacienteRut: { [Op.ne]: null }
        },
        attributes: ['pacienteRut'],
        group: ['pacienteRut'],
        raw: true
      });
      numeroPacientesAtendidos = pacientesUnicos.length;
    }
    console.log('Pacientes únicos:', numeroPacientesAtendidos);
    
    console.log('\n✅ Todas las consultas funcionaron correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testMetricasUsuario();

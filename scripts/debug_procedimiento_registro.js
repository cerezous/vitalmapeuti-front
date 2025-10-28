const sequelize = require('../backend/config/database');
const ProcedimientoRegistro = require('../backend/models/ProcedimientoRegistro');

async function debugProcedimientoRegistro() {
  try {
    console.log('🔍 Debugging ProcedimientoRegistro...');
    
    // Probar una consulta simple con Sequelize
    console.log('\n1. Probando consulta simple con findAll...');
    const procedimientos = await ProcedimientoRegistro.findAll({
      limit: 1,
      raw: true
    });
    console.log('Resultado:', procedimientos);
    
    // Probar count
    console.log('\n2. Probando count...');
    const count = await ProcedimientoRegistro.count();
    console.log('Count:', count);
    
    // Probar con where específico
    console.log('\n3. Probando con where...');
    const procedimientosConPaciente = await ProcedimientoRegistro.findAll({
      where: {
        pacienteRut: { [require('sequelize').Op.ne]: null }
      },
      limit: 1,
      raw: true
    });
    console.log('Con paciente:', procedimientosConPaciente);
    
    // Probar group by
    console.log('\n4. Probando group by...');
    const pacientesUnicos = await ProcedimientoRegistro.findAll({
      attributes: ['pacienteRut'],
      group: ['pacienteRut'],
      raw: true,
      limit: 5
    });
    console.log('Pacientes únicos:', pacientesUnicos);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

debugProcedimientoRegistro();

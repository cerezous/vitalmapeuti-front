const sequelize = require('../backend/config/database');

async function consultarDatosOrganizados() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos PostgreSQL');
    
    // 1. USUARIOS
    console.log('\n👥 USUARIOS REGISTRADOS:');
    console.log('='.repeat(60));
    const [usuarios] = await sequelize.query(`
      SELECT id, usuario, nombres, apellidos, estamento, correo, "createdAt"
      FROM usuarios 
      ORDER BY id;
    `);
    
    usuarios.forEach(user => {
      console.log(`ID: ${user.id} | Usuario: ${user.usuario} | Nombre: ${user.nombres} ${user.apellidos}`);
      console.log(`   Estamento: ${user.estamento} | Email: ${user.correo}`);
      console.log(`   Registrado: ${new Date(user.createdAt).toLocaleDateString()}`);
      console.log('');
    });
    
    // 2. PACIENTES
    console.log('\n🏥 PACIENTES EN UTI:');
    console.log('='.repeat(60));
    const [pacientes] = await sequelize.query(`
      SELECT id, "nombreCompleto", rut, "numeroFicha", edad, "camaAsignada", 
             "fechaIngresoUTI", "fechaEgresoUTI", "createdAt"
      FROM pacientes 
      ORDER BY id;
    `);
    
    pacientes.forEach(paciente => {
      const estado = paciente.fechaEgresoUTI ? 'EGRESADO' : 'ACTIVO';
      const diasEstadia = paciente.fechaEgresoUTI ? 
        Math.floor((new Date(paciente.fechaEgresoUTI) - new Date(paciente.fechaIngresoUTI)) / (1000 * 60 * 60 * 24)) :
        Math.floor((new Date() - new Date(paciente.fechaIngresoUTI)) / (1000 * 60 * 60 * 24));
      
      console.log(`ID: ${paciente.id} | Nombre: ${paciente.nombreCompleto}`);
      console.log(`   RUT: ${paciente.rut} | Ficha: ${paciente.numeroFicha} | Edad: ${paciente.edad}`);
      console.log(`   Cama: ${paciente.camaAsignada || 'Sin asignar'} | Estado: ${estado}`);
      console.log(`   Ingreso: ${new Date(paciente.fechaIngresoUTI).toLocaleDateString()} | Días: ${diasEstadia}`);
      if (paciente.fechaEgresoUTI) {
        console.log(`   Egreso: ${new Date(paciente.fechaEgresoUTI).toLocaleDateString()}`);
      }
      console.log('');
    });
    
    // 3. EVALUACIONES APACHE II
    console.log('\n📊 EVALUACIONES APACHE II:');
    console.log('='.repeat(60));
    const [apache2] = await sequelize.query(`
      SELECT a.id, a."pacienteId", p."nombreCompleto", a."puntajeTotal", 
             a."riesgoMortalidad", a."nivelRiesgo", a."fechaEvaluacion", a."usuarioId"
      FROM apache2 a
      LEFT JOIN pacientes p ON a."pacienteId" = p.id
      ORDER BY a."fechaEvaluacion" DESC;
    `);
    
    apache2.forEach(apache => {
      console.log(`ID: ${apache.id} | Paciente: ${apache.nombreCompleto || 'ID: ' + apache.pacienteId}`);
      console.log(`   Puntaje: ${apache.puntajeTotal} | Riesgo: ${apache.riesgoMortalidad} | Nivel: ${apache.nivelRiesgo}`);
      console.log(`   Evaluación: ${new Date(apache.fechaEvaluacion).toLocaleDateString()}`);
      console.log('');
    });
    
    // 4. CATEGORIZACIONES KINESIOLOGÍA
    console.log('\n🏃 CATEGORIZACIONES KINESIOLOGÍA:');
    console.log('='.repeat(60));
    const [categorizaciones] = await sequelize.query(`
      SELECT id, "pacienteRut", "puntajeTotal", complejidad, "cargaAsistencial", 
             "fechaCategorizacion", "usuarioId"
      FROM categorizaciones_kinesiologia 
      ORDER BY "fechaCategorizacion" DESC;
    `);
    
    categorizaciones.forEach(cat => {
      console.log(`ID: ${cat.id} | RUT Paciente: ${cat.pacienteRut}`);
      console.log(`   Puntaje: ${cat.puntajeTotal} | Complejidad: ${cat.complejidad}`);
      console.log(`   Carga: ${cat.cargaAsistencial} | Fecha: ${new Date(cat.fechaCategorizacion).toLocaleDateString()}`);
      console.log('');
    });
    
    // 5. ESTADÍSTICAS GENERALES
    console.log('\n📈 ESTADÍSTICAS GENERALES:');
    console.log('='.repeat(60));
    const [stats] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM pacientes) as total_pacientes,
        (SELECT COUNT(*) FROM pacientes WHERE "fechaEgresoUTI" IS NULL) as pacientes_activos,
        (SELECT COUNT(*) FROM apache2) as evaluaciones_apache,
        (SELECT COUNT(*) FROM categorizaciones_kinesiologia) as categorizaciones_kine,
        (SELECT COUNT(*) FROM nas) as evaluaciones_nas,
        (SELECT COUNT(*) FROM "CuestionarioBurnout") as cuestionarios_burnout;
    `);
    
    const s = stats[0];
    console.log(`👥 Total Usuarios: ${s.total_usuarios}`);
    console.log(`🏥 Total Pacientes: ${s.total_pacientes}`);
    console.log(`🟢 Pacientes Activos: ${s.pacientes_activos}`);
    console.log(`📊 Evaluaciones Apache II: ${s.evaluaciones_apache}`);
    console.log(`🏃 Categorizaciones Kinesiología: ${s.categorizaciones_kine}`);
    console.log(`🧠 Evaluaciones NAS: ${s.evaluaciones_nas}`);
    console.log(`😰 Cuestionarios Burnout: ${s.cuestionarios_burnout}`);
    
    // 6. DISTRIBUCIÓN POR ESTAMENTO
    console.log('\n👨‍⚕️ DISTRIBUCIÓN POR ESTAMENTO:');
    console.log('='.repeat(60));
    const [estamentos] = await sequelize.query(`
      SELECT estamento, COUNT(*) as cantidad
      FROM usuarios 
      GROUP BY estamento 
      ORDER BY cantidad DESC;
    `);
    
    estamentos.forEach(est => {
      console.log(`${est.estamento}: ${est.cantidad} usuarios`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  consultarDatosOrganizados();
}

module.exports = consultarDatosOrganizados;

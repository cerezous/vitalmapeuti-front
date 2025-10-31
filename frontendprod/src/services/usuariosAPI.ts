import api from './api';

export interface Usuario {
  id: number;
  usuario: string;
  nombres: string;
  apellidos: string;
  correo: string;
  estamento: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioFormData {
  usuario: string;
  nombres: string;
  apellidos: string;
  correo: string;
  estamento: string;
  contraseña?: string;
}

const usuariosAPI = {
  // Obtener todos los usuarios (solo administradores)
  async obtenerTodos(): Promise<Usuario[]> {
    try {
      const response = await api.get('/usuarios');
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener usuarios:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener los usuarios');
    }
  },

  // Crear nuevo usuario
  async crear(data: UsuarioFormData): Promise<Usuario> {
    try {
      const response = await api.post('/usuarios', data);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el usuario');
    }
  },

  // Actualizar usuario existente
  async actualizar(id: number, data: Partial<UsuarioFormData>): Promise<Usuario> {
    try {
      const response = await api.put(`/usuarios/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar el usuario');
    }
  },

  // Eliminar usuario
  async eliminar(id: number): Promise<void> {
    try {
      await api.delete(`/usuarios/${id}`);
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar el usuario');
    }
  },

  // Obtener usuario por ID
  async obtenerPorId(id: number): Promise<Usuario> {
    try {
      const response = await api.get(`/usuarios/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener usuario:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener el usuario');
    }
  }
};

export default usuariosAPI;

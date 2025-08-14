import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Box, AlertTriangle } from 'lucide-react';
import { useApp, Packaging } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { savePackage, deletePackage } from '../../utils/db';

const PackagingTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { state: auth } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPackaging, setEditingPackaging] = useState<Packaging | null>(null);
  const [formData, setFormData] = useState({
    tipo: '',
    quantidadeTotal: 0,
    precoTotal: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const precoUnitario = formData.quantidadeTotal > 0 ? formData.precoTotal / formData.quantidadeTotal : 0;
    const packagingData: Packaging = {
      id: editingPackaging ? editingPackaging.id : Date.now().toString(),
      ...formData,
      precoUnitario,
      estoqueAtual: editingPackaging ? editingPackaging.estoqueAtual : formData.quantidadeTotal,
    };

    if (editingPackaging) {
      dispatch({ type: 'UPDATE_PACKAGING', payload: packagingData });
    } else {
      dispatch({ type: 'ADD_PACKAGING', payload: packagingData });
    }

    try {
      setSaving(true);
      await savePackage(auth.currentUser.id, packagingData);
    } finally {
      setSaving(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ tipo: '', quantidadeTotal: 0, precoTotal: 0 });
    setEditingPackaging(null);
    setIsFormOpen(false);
  };

  const handleEdit = (packaging: Packaging) => {
    setFormData({
      tipo: packaging.tipo,
      quantidadeTotal: packaging.quantidadeTotal,
      precoTotal: packaging.precoTotal,
    });
    setEditingPackaging(packaging);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) return;
    if (!window.confirm('Tem certeza que deseja excluir esta embalagem?')) return;

    dispatch({ type: 'DELETE_PACKAGING', payload: id });
    try { await deletePackage(auth.currentUser.id, id); } catch {}
  };

  const getStockStatus = (current: number, total: number) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    if (percentage <= 10) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Crítico' };
    if (percentage <= 30) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Baixo' };
    return { color: 'text-green-600', bg: 'bg-green-100', label: 'Bom' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Box className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-semibold text-gray-900">Embalagens</h3>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2 disabled:opacity-60"
          disabled={saving}
        >
          <Plus className="w-4 h-4" />
          <span>{saving ? 'Salvando...' : 'Nova Embalagem'}</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h4 className="text-lg font-semibold mb-4">
              {editingPackaging ? 'Editar Embalagem' : 'Nova Embalagem'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <input
                  type="text"
                  required
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Ex: Caixa pequena, Envelope bolha, Saco plástico..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade Total *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantidadeTotal}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidadeTotal: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Total (R$) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.precoTotal}
                    onChange={(e) => setFormData(prev => ({ ...prev, precoTotal: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>

              {formData.quantidadeTotal > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Preço unitário: <span className="font-medium">R$ {(formData.precoTotal / formData.quantidadeTotal).toFixed(4)}</span>
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : editingPackaging ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg overflow-hidden">
        {state.packaging.length === 0 ? (
          <div className="text-center py-12">
            <Box className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma embalagem cadastrada</p>
            <button onClick={() => setIsFormOpen(true)} className="mt-2 text-yellow-500 hover:text-yellow-600">
              Cadastre sua primeira embalagem
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Investido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.packaging.map((packaging, index) => {
                  const stockStatus = getStockStatus(packaging.estoqueAtual, packaging.quantidadeTotal);
                  return (
                    <tr key={packaging.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{packaging.tipo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {packaging.precoUnitario.toFixed(4)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {packaging.estoqueAtual} / {packaging.quantidadeTotal}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {packaging.precoTotal.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                          {packaging.estoqueAtual <= packaging.quantidadeTotal * 0.1 && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onClick={() => handleEdit(packaging)} className="text-yellow-600 hover:text-yellow-900">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(packaging.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackagingTab;

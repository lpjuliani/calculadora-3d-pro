// src/utils/db.ts
import { supabase } from '../lib/supabase';

// Tipos "de banco" (colunas) – alinhados ao AppState que você já usa
// Se quiser, pode importar tipos do AppContext e trocar os "any" de payloads.

export async function ensureProfileId(email: string, role: 'admin' | 'user' = 'user'): Promise<string> {
  // tenta achar
  const { data: got, error: e0 } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('email', email)
    .maybeSingle();

  if (e0) throw e0;

  if (got) {
    if (got.role !== role) {
      const { error: eUpd } = await supabase.from('profiles').update({ role }).eq('id', got.id);
      if (eUpd) throw eUpd;
    }
    return got.id as string;
  }

  // cria
  const { data, error } = await supabase
    .from('profiles')
    .insert({ email, role })
    .select('id')
    .single();

  if (error) throw error;
  return data!.id as string;
}

/** ---------- LOAD ALL (preenche AppState) ---------- */
export async function loadAllForUser(userId: string) {
  // PRINTERS
  const { data: printers, error: ePrinters } = await supabase
    .from('printers')
    .select('id, name, brand, model, potencia, vida_util, valor_pago, percentual_falhas, notes, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (ePrinters) throw ePrinters;

  // FILAMENTS
  const { data: filaments, error: eF } = await supabase
    .from('filaments')
    .select('id, brand, material, color, custo_rolo, peso_rolo, estoque_atual, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (eF) throw eF;

  // ACCESSORIES
  const { data: accessories, error: eA } = await supabase
    .from('accessories')
    .select('id, tipo, quantidade_total, preco_total, preco_unitario, estoque_atual, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (eA) throw eA;

  // PACKAGING
  const { data: packages, error: eP } = await supabase
    .from('packages')
    .select('id, tipo, quantidade_total, preco_total, preco_unitario, estoque_atual, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (eP) throw eP;

  // CATEGORIES
  const { data: categories, error: eC } = await supabase
    .from('categories')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (eC) throw eC;

  // COMPANY SETTINGS (pega a última)
  const { data: companyRows, error: eCS } = await supabase
    .from('company_settings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (eCS) throw eCS;

  // HISTORY (print records)
  const { data: history, error: eH } = await supabase
    .from('history')
    .select('id, data, cliente, produto, categoria, impressora, peso_total, tempo_total, quantidade, custo_total, preco_unitario, lucro_unitario, lucro_total, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (eH) throw eH;

  // mapear para o formato do AppState
  return {
    printers: (printers ?? []).map(p => ({
      id: p.id,
      marca: p.brand ?? '',
      modelo: p.model ?? '',
      potencia: p.potencia ?? 0,
      vidaUtil: p.vida_util ?? 0,
      valorPago: p.valor_pago ?? 0,
      percentualFalhas: p.percentual_falhas ?? 0,
    })),
    filaments: (filaments ?? []).map(f => ({
      id: f.id,
      marca: f.brand ?? '',
      tipo: f.material ?? '',
      cor: f.color ?? '',
      custoRolo: f.custo_rolo ?? 0,
      pesoRolo: f.peso_rolo ?? 0,
      estoqueAtual: f.estoque_atual ?? 0,
    })),
    accessories: (accessories ?? []).map(a => ({
      id: a.id,
      tipo: a.tipo ?? '',
      quantidadeTotal: a.quantidade_total ?? 0,
      precoTotal: a.preco_total ?? 0,
      precoUnitario: a.preco_unitario ?? 0,
      estoqueAtual: a.estoque_atual ?? 0,
    })),
    packaging: (packages ?? []).map(p => ({
      id: p.id,
      tipo: p.tipo ?? '',
      quantidadeTotal: p.quantidade_total ?? 0,
      precoTotal: p.preco_total ?? 0,
      precoUnitario: p.preco_unitario ?? 0,
      estoqueAtual: p.estoque_atual ?? 0,
    })),
    categories: (categories ?? []).map(c => ({
      id: c.id,
      nome: c.name ?? '',
    })),
    printHistory: (history ?? []).map(h => ({
      id: h.id,
      data: h.data ?? '',
      cliente: h.cliente ?? '',
      produto: h.produto ?? '',
      categoria: h.categoria ?? '',
      impressora: h.impressora ?? '',
      pesoTotal: h.peso_total ?? 0,
      tempoTotal: h.tempo_total ?? 0,
      quantidade: h.quantidade ?? 0,
      custoTotal: h.custo_total ?? 0,
      precoUnitario: h.preco_unitario ?? 0,
      lucroUnitario: h.lucro_unitario ?? 0,
      lucroTotal: h.lucro_total ?? 0,
    })),
    companySettings: companyRows?.[0] ? {
      nomeFantasia: companyRows[0].company_name ?? '',
      razaoSocial: companyRows[0].razao_social ?? '',
      cnpj: companyRows[0].cnpj ?? '',
      endereco: companyRows[0].endereco ?? '',
      telefone: companyRows[0].telefone ?? '',
      email: companyRows[0].email ?? '',
      site: companyRows[0].site ?? '',
      logo: companyRows[0].logo ?? '',
      pixChave: companyRows[0].pix_chave ?? '',
      dadosBancarios: companyRows[0].dados_bancarios ?? '',
      qrCodePix: companyRows[0].qr_code_pix ?? '',
      prazoEntrega: companyRows[0].prazo_entrega ?? '7 dias úteis',
      validadeOrcamento: companyRows[0].validade_orcamento ?? '30 dias',
      observacoes: companyRows[0].observacoes ?? '',
    } : {
      nomeFantasia: '', razaoSocial: '', cnpj: '', endereco: '', telefone: '', email: '',
      site: '', logo: '', pixChave: '', dadosBancarios: '', qrCodePix: '',
      prazoEntrega: '7 dias úteis', validadeOrcamento: '30 dias', observacoes: ''
    }
  };
}

/** ---------- SAVE/DELETE helpers por entidade ---------- */
// PRINTERS
export async function savePrinter(userId: string, p: any) {
  // se tem id → update, senão insert
  if (p.id) {
    const { error } = await supabase.from('printers').update({
      brand: p.marca, model: p.modelo, potencia: p.potencia, vida_util: p.vidaUtil,
      valor_pago: p.valorPago, percentual_falhas: p.percentualFalhas
    }).eq('id', p.id).eq('user_id', userId);
    if (error) throw error;
    return p;
  }
  const { data, error } = await supabase.from('printers').insert({
    user_id: userId,
    name: `${p.marca} ${p.modelo}`.trim(),
    brand: p.marca, model: p.modelo, potencia: p.potencia, vida_util: p.vidaUtil,
    valor_pago: p.valorPago, percentual_falhas: p.percentualFalhas
  }).select('id').single();
  if (error) throw error;
  return { ...p, id: data!.id };
}
export async function deletePrinter(userId: string, id: string) {
  const { error } = await supabase.from('printers').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// FILAMENTS
export async function saveFilament(userId: string, f: any) {
  if (f.id) {
    const { error } = await supabase.from('filaments').update({
      brand: f.marca, material: f.tipo, color: f.cor,
      custo_rolo: f.custoRolo, peso_rolo: f.pesoRolo, estoque_atual: f.estoqueAtual
    }).eq('id', f.id).eq('user_id', userId);
    if (error) throw error;
    return f;
  }
  const { data, error } = await supabase.from('filaments').insert({
    user_id: userId,
    brand: f.marca, material: f.tipo, color: f.cor,
    custo_rolo: f.custoRolo, peso_rolo: f.pesoRolo, estoque_atual: f.estoqueAtual
  }).select('id').single();
  if (error) throw error;
  return { ...f, id: data!.id };
}
export async function deleteFilament(userId: string, id: string) {
  const { error } = await supabase.from('filaments').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// ACCESSORIES
export async function saveAccessory(userId: string, a: any) {
  if (a.id) {
    const { error } = await supabase.from('accessories').update({
      tipo: a.tipo, quantidade_total: a.quantidadeTotal, preco_total: a.precoTotal,
      preco_unitario: a.precoUnitario, estoque_atual: a.estoqueAtual
    }).eq('id', a.id).eq('user_id', userId);
    if (error) throw error;
    return a;
  }
  const { data, error } = await supabase.from('accessories').insert({
    user_id: userId,
    tipo: a.tipo, quantidade_total: a.quantidadeTotal, preco_total: a.precoTotal,
    preco_unitario: a.precoUnitario, estoque_atual: a.estoqueAtual
  }).select('id').single();
  if (error) throw error;
  return { ...a, id: data!.id };
}
export async function deleteAccessory(userId: string, id: string) {
  const { error } = await supabase.from('accessories').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// PACKAGING
export async function savePackage(userId: string, p: any) {
  if (p.id) {
    const { error } = await supabase.from('packages').update({
      tipo: p.tipo, quantidade_total: p.quantidadeTotal, preco_total: p.precoTotal,
      preco_unitario: p.precoUnitario, estoque_atual: p.estoqueAtual
    }).eq('id', p.id).eq('user_id', userId);
    if (error) throw error;
    return p;
  }
  const { data, error } = await supabase.from('packages').insert({
    user_id: userId,
    tipo: p.tipo, quantidade_total: p.quantidadeTotal, preco_total: p.precoTotal,
    preco_unitario: p.precoUnitario, estoque_atual: p.estoqueAtual
  }).select('id').single();
  if (error) throw error;
  return { ...p, id: data!.id };
}
export async function deletePackage(userId: string, id: string) {
  const { error } = await supabase.from('packages').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// CATEGORIES
export async function saveCategory(userId: string, c: any) {
  if (c.id) {
    const { error } = await supabase.from('categories').update({
      name: c.nome
    }).eq('id', c.id).eq('user_id', userId);
    if (error) throw error;
    return c;
  }
  const { data, error } = await supabase.from('categories').insert({
    user_id: userId,
    name: c.nome
  }).select('id').single();
  if (error) throw error;
  return { ...c, id: data!.id };
}
export async function deleteCategory(userId: string, id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// PRINT HISTORY
export async function savePrintRecord(userId: string, r: any) {
  if (r.id) {
    const { error } = await supabase.from('history').update({
      data: r.data, cliente: r.cliente, produto: r.produto, categoria: r.categoria, impressora: r.impressora,
      peso_total: r.pesoTotal, tempo_total: r.tempoTotal, quantidade: r.quantidade,
      custo_total: r.custoTotal, preco_unitario: r.precoUnitario, lucro_unitario: r.lucroUnitario, lucro_total: r.lucroTotal
    }).eq('id', r.id).eq('user_id', userId);
    if (error) throw error;
    return r;
  }
  const { data, error } = await supabase.from('history').insert({
    user_id: userId,
    data: r.data, cliente: r.cliente, produto: r.produto, categoria: r.categoria, impressora: r.impressora,
    peso_total: r.pesoTotal, tempo_total: r.tempoTotal, quantidade: r.quantidade,
    custo_total: r.custoTotal, preco_unitario: r.precoUnitario, lucro_unitario: r.lucroUnitario, lucro_total: r.lucroTotal
  }).select('id').single();
  if (error) throw error;
  return { ...r, id: data!.id };
}
export async function deletePrintRecord(userId: string, id: string) {
  const { error } = await supabase.from('history').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// COMPANY SETTINGS (sempre insert nova linha; o LOAD pega a última)
export async function saveCompanySettings(userId: string, s: any) {
  const { error } = await supabase.from('company_settings').insert({
    user_id: userId,
    company_name: s.nomeFantasia,
    razao_social: s.razaoSocial,
    cnpj: s.cnpj,
    endereco: s.endereco,
    telefone: s.telefone,
    email: s.email,
    site: s.site,
    logo: s.logo,
    pix_chave: s.pixChave,
    dados_bancarios: s.dadosBancarios,
    qr_code_pix: s.qrCodePix,
    prazo_entrega: s.prazoEntrega,
    validade_orcamento: s.validadeOrcamento,
    observacoes: s.observacoes,
  });
  if (error) throw error;
}

/** ---------- ALIASES para casar com os componentes ---------- */
// upsert* = save*
export const upsertPrinter = savePrinter;
export const upsertFilament = saveFilament;
export const upsertAccessory = saveAccessory;
export const upsertPackaging = savePackage;
export const upsertCategory = saveCategory;
export const upsertCompanySettings = saveCompanySettings;

// deletePackaging = deletePackage
export const deletePackaging = deletePackage;

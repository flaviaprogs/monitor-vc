"use client";

import { useState, useEffect, useMemo } from "react";
import { PRIORITY_SET } from "../utils/prioridade.js";
import {
  splitSala,
  mapLocalidade,
  normalizeEquipe,
  salaBaseParaPrioridade,
} from "../utils/salas.js";
import { diffIndisponibilidade } from "../utils/datas.js";

const BACKEND_URL = "http://10.22.142.57:4000";

export const camposIniciais = {
  id: null,

  // essenciais
  numeroChamado: "",
  nomeCompleto: "",
  status: "ABERTO",
  tipoFalha: "",

  // localização
  local: "",
  predio: "",
  andar: "",
  sala: "",
  equipamento: "",

  // operação
  dataQueda: "",
  dataRestauracao: "",
  equipeAcionada: "",
  emChamada: false,

  // análise
  prioridade: false,
  tempoIndisponibilidade: "",

  // registro
  criadoEm: "",
  origem: "manual",

  // texto livre
  observacoes: "",
  solucao: "",
};

function mapFromDB(row) {
  return {
    ...camposIniciais,
    ...row,
    id: row.id,
    emChamada: Boolean(row.emChamada),
    prioridade: Boolean(row.prioridade),
  };
}

export function useChamados() {
  const [chamados, setChamados] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editChamado, setEditChamado] = useState(null);
  const [novoChamado, setNovoChamado] = useState(camposIniciais);

  /* ===============================
     🔄 LOAD
  =============================== */
  const carregar = async () => {
    const res = await fetch(`${BACKEND_URL}/chamados`);
    const data = await res.json();
    setChamados(Array.isArray(data) ? data.map(mapFromDB) : []);
  };

  useEffect(() => {
    carregar().catch(console.error);
  }, []);

  /* ===============================
     MODAL
  =============================== */
  const abrirModal = (chamado = null) => {
    if (chamado) {
      setEditChamado(chamado);
      setNovoChamado({ ...camposIniciais, ...chamado });
    } else {
      setEditChamado(null);
      setNovoChamado({ ...camposIniciais });
    }
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditChamado(null);
    setNovoChamado({ ...camposIniciais });
  };

  /* ===============================
     FORM
  =============================== */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setNovoChamado((p) => ({ ...p, [name]: checked }));
      return;
    }

    const v = typeof value === "string" ? value.toUpperCase() : value;

    if (name === "nomeCompleto") {
      const salaInfo = splitSala(v);
      setNovoChamado((p) => ({ ...p, ...salaInfo, nomeCompleto: v }));
      return;
    }

    if (name === "equipeAcionada") {
      setNovoChamado((p) => ({
        ...p,
        equipeAcionada: normalizeEquipe(v),
      }));
      return;
    }

    setNovoChamado((p) => ({ ...p, [name]: v }));
  };

  const formValido = useMemo(() => {
    return Boolean(
      novoChamado.nomeCompleto &&
      novoChamado.numeroChamado &&
      novoChamado.dataQueda
    );
  }, [novoChamado]);

  /* ===============================
     💾 SAVE (POST / PUT)
  =============================== */
  const salvarChamado = async () => {
    if (!formValido) {
      alert("Preencha Nome, Nº Chamado e Data da Queda");
      return;
    }

    const payload = {
      ...novoChamado,
      predio: mapLocalidade(novoChamado.predio),
      local: mapLocalidade(novoChamado.local),
      status: novoChamado.dataRestauracao ? "ENCERRADO" : "ABERTO",
      criadoEm: novoChamado.criadoEm || new Date().toISOString(),
      prioridade: PRIORITY_SET.has(
        salaBaseParaPrioridade(novoChamado.nomeCompleto)
      ),
      tempoIndisponibilidade: diffIndisponibilidade(
        novoChamado.dataQueda,
        novoChamado.dataRestauracao
      ),
    };

    const isEdit = Boolean(editChamado?.id);
    const url = isEdit
      ? `${BACKEND_URL}/chamados/${editChamado.id}`
      : `${BACKEND_URL}/chamados`;

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Erro ao salvar");
    }

    await carregar();
    fecharModal();
  };

  /* ===============================
     🗑️ DELETE
  =============================== */
  const excluirChamado = async (id) => {
    if (!id) return;
    if (!confirm("Excluir chamado?")) return;

    await fetch(`${BACKEND_URL}/chamados/${id}`, { method: "DELETE" });
    await carregar();
  };

  return {
    chamados,
    setChamados,
    showModal,
    editChamado,
    novoChamado,
    setNovoChamado,
    abrirModal,
    fecharModal,
    handleChange,
    formValido,
    salvarChamado,
    excluirChamado,
  };
}

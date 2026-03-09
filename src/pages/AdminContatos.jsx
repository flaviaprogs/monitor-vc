import React, { useEffect, useState } from "react";
import { Table, Card, Form, Button } from "react-bootstrap";

export default function AdminContatos() {
  const [db, setDb] = useState({ contatos: [], links: [] });
  const [novoContato, setNovoContato] = useState({ equipe: "", contato: "", telefone: "" });
  const [novoLink, setNovoLink] = useState({ nome: "", url: "" });

  const load = async () => {
    const r = await fetch("/api/contatos");
    const j = await r.json();
    setDb(j);
  };
  useEffect(() => { load(); }, []);

  const addContato = async () => {
    const r = await fetch("/api/contatos", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(novoContato)
    });
    if (r.ok) { setNovoContato({ equipe: "", contato: "", telefone: "" }); load(); }
  };
  const saveContato = async (row) => {
    await fetch(`/api/contatos/${row.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) });
    load();
  };
  const delContato = async (id) => { await fetch(`/api/contatos/${id}`, { method: "DELETE" }); load(); };

  const addLink = async () => {
    const r = await fetch("/api/links", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(novoLink)
    });
    if (r.ok) { setNovoLink({ nome: "", url: "" }); load(); }
  };
  const saveLink = async (row) => {
    await fetch(`/api/links/${row.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) });
    load();
  };
  const delLink = async (id) => { await fetch(`/api/links/${id}`, { method: "DELETE" }); load(); };

  return (
    <div className="container-fluid py-3">
      <h2 className="mb-3">Admin • Contatos & Links</h2>

      <Card className="mb-3 p-3">
        <h5>Contatos</h5>
        <Table striped responsive>
          <thead><tr><th>Equipe</th><th>Email</th><th>Telefone</th><th style={{width:120}}>Ações</th></tr></thead>
          <tbody>
            {db.contatos.map(c => (
              <tr key={c.id}>
                <td><Form.Control defaultValue={c.equipe} onChange={e => c.equipe=e.target.value} /></td>
                <td><Form.Control defaultValue={c.contato} onChange={e => c.contato=e.target.value} /></td>
                <td><Form.Control defaultValue={c.telefone||""} onChange={e => c.telefone=e.target.value} /></td>
                <td>
                  <Button size="sm" variant="primary" className="me-2" onClick={() => saveContato({...c})}>Salvar</Button>
                  <Button size="sm" variant="danger" onClick={() => delContato(c.id)}>Excluir</Button>
                </td>
              </tr>
            ))}
            <tr>
              <td><Form.Control placeholder="Equipe" value={novoContato.equipe} onChange={e=>setNovoContato({...novoContato, equipe:e.target.value})}/></td>
              <td><Form.Control placeholder="Email" value={novoContato.contato} onChange={e=>setNovoContato({...novoContato, contato:e.target.value})}/></td>
              <td><Form.Control placeholder="Telefone" value={novoContato.telefone} onChange={e=>setNovoContato({...novoContato, telefone:e.target.value})}/></td>
              <td><Button size="sm" onClick={addContato}>Adicionar</Button></td>
            </tr>
          </tbody>
        </Table>
      </Card>

      <Card className="p-3">
        <h5>Links</h5>
        <Table striped responsive>
          <thead><tr><th>Nome</th><th>URL</th><th style={{width:120}}>Ações</th></tr></thead>
          <tbody>
            {db.links.map(l => (
              <tr key={l.id}>
                <td><Form.Control defaultValue={l.nome} onChange={e => l.nome=e.target.value} /></td>
                <td><Form.Control defaultValue={l.url} onChange={e => l.url=e.target.value} /></td>
                <td>
                  <Button size="sm" variant="primary" className="me-2" onClick={() => saveLink({...l})}>Salvar</Button>
                  <Button size="sm" variant="danger" onClick={() => delLink(l.id)}>Excluir</Button>
                </td>
              </tr>
            ))}
            <tr>
              <td><Form.Control placeholder="Nome" value={novoLink.nome} onChange={e=>setNovoLink({...novoLink, nome:e.target.value})}/></td>
              <td><Form.Control placeholder="URL" value={novoLink.url} onChange={e=>setNovoLink({...novoLink, url:e.target.value})}/></td>
              <td><Button size="sm" onClick={addLink}>Adicionar</Button></td>
            </tr>
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

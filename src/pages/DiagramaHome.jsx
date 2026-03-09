// 📁 src/pages/DiagramaHome.jsx
import React, { useMemo, useState } from "react";
import { Accordion, Modal, Button } from "react-bootstrap";
import { ZoomIn } from "lucide-react";

/* ========= Loader de imagens em src/assets (tolerante a nome/extensão) ========= */
function buildAssetIndex() {
  // Carrega QUALQUER imagem diretamente em src/assets (nível raiz da pasta)
  const ctx = require.context("../assets", false, /\.(png|jpe?g|gif|svg)$/i);
  const idx = new Map(); // chave minúscula -> caminho real do require.context

  ctx.keys().forEach((k) => {
    const lowerFull = k.toLowerCase();       // ex.: "./JB695_3AND.png" (minúsculas)
    const lowerOnly = k.replace("./", "").toLowerCase(); // "JB695_3AND.png"
    idx.set(lowerFull, k);
    idx.set(lowerOnly, k);
  });

  const getUrl = (baseNames) => {
    // tenta base + cada extensão
    for (const base of baseNames) {
      for (const ext of [".png", ".jpg", ".jpeg", ".svg", ".gif"]) {
        const try1 = `./${base}${ext}`.toLowerCase();
        const try2 = `${base}${ext}`.toLowerCase();
        if (idx.has(try1)) return ctx(idx.get(try1));
        if (idx.has(try2)) return ctx(idx.get(try2));
      }
    }
    return null;
  };

  return { getUrl };
}
const ASSETS = buildAssetIndex();

/* ========= Mapa de andares -> nomes de arquivo (sem extensão) ========= */
const MAPPING = {
  jb695: {
    nome: "JB695",
    andares: [
      { label: "Térreo / 1º / 2º", key: "te-1e2", bases: ["JB695_TE_1E2AND", "jb695_te_1e2and"] },
      { label: "3º Andar", key: "3", bases: ["JB695_3AND"] },
      { label: "4º Andar", key: "4", bases: ["JB695_4AND"] },
      { label: "5º Andar", key: "5", bases: ["JB695_5AND"] },
      { label: "6º / 7º Andar", key: "6e7", bases: ["JB695_6E7ND", "JB695_6E7AND"] },
    ],
  },
  pl70: {
    nome: "PL70",
    andares: [
      { label: "1º / 2º Andar", key: "1e2", bases: ["PL70_1E2AND"] },
    ],
  },
  vm: {
    nome: "VM/PRJ",
    andares: [
      { label: "3º Andar / Projeto 1º", key: "3e1proj", bases: ["VM_3AND_E_PRJ1AND", "VM_3AND_E_PRJ_1AND"] },
    ],
  },
  lq: {
    nome: "LQ",
    andares: [
      { label: "Térreo", key: "terreo",  bases: ["LQ_Terreo", "LQ_TERREO", "LQ_TÉRREO", "LQ_TERREO_"] },
      { label: "1º / 2º", key: "1e2",    bases: ["LQ_1E2AND"] },
      { label: "3º / 4º", key: "3e4",    bases: ["LQ_3E4AND"] },
      { label: "5º",      key: "5",      bases: ["LQ_5ND"] },
      { label: "6º / 7º", key: "6e7",    bases: ["LQ_6E7ND"] },
      { label: "8º",      key: "8",      bases: ["LQ_8ND"] },
      { label: "9º / 10º",key: "9e10",   bases: ["LQ_9E10AND"] },
    ],
  },
};

export default function DiagramaHome() {
  // Modal de tela cheia da imagem
  const [modalImg, setModalImg] = useState(null);

  // Resolve todas as URLs de imagem uma única vez
  const sitesResolved = useMemo(() => {
    const out = {};
    Object.entries(MAPPING).forEach(([siteKey, site]) => {
      out[siteKey] = {
        nome: site.nome,
        andares: site.andares.map((a) => ({
          ...a,
          url: ASSETS.getUrl(a.bases),
        })),
      };
    });
    return out;
  }, []);

  return (
    <div className="container-fluid py-3" style={{ minHeight: "100vh" }}>
      {/* ===== CSS embutido (tons “corporativos Globo”) ===== */}
      <style>{`
        .dg-hero {
          background: linear-gradient(90deg, #0b1a36 0%, #2f80ed 50%, #56ccf2 100%);
          color: #fff;
          padding: 16px 20px;
          border-radius: 14px;
          box-shadow: 0 8px 28px rgba(13,110,253,.25);
        }
        .dg-title { font-weight: 700; letter-spacing: .2px; margin: 0; }
        .dg-sub   { font-weight: 600; color: #0b1a36; margin: 18px 0 12px; }

        .dg-card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid rgba(13,110,253,.08);
          box-shadow: 0 8px 24px rgba(0,0,0,.06);
        }
        .dg-floor {
          background: #fafbff;
          border-radius: 12px;
          border: 1px dashed rgba(13,110,253,.18);
          padding: 10px;
          transition: background .2s ease;
        }
        .dg-floor:hover { background: #f4f7ff; }

        .dg-img-wrap {
          background: linear-gradient(180deg, rgba(11,26,54,.03), rgba(11,26,54,.02));
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        .dg-img {
          width: 100%;
          height: auto;
          max-height: 85vh;
          object-fit: contain;
          cursor: zoom-in;
        }
        .dg-zoom {
          position: absolute;
          right: 10px;
          bottom: 10px;
          background: rgba(11,26,54,.6);
          color: #fff;
          border-radius: 999px;
          padding: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .dg-missing {
          padding: 18px;
          color: #6c757d;
          background: #fff;
          border: 1px dashed #ced4da;
          border-radius: 12px;
          text-align: center;
        }
      `}</style>

      <div className="dg-hero mb-3">
        <h2 className="dg-title">Diagrama de Rede — Videoconferência</h2>
      </div>

      <h5 className="dg-sub">Toque/ clique para expandir</h5>

      {/* Accordion por site, e dentro “cards” por andar (sem botão; a própria área expande) */}
      <Accordion alwaysOpen className="mb-4">
        {Object.entries(sitesResolved).map(([siteKey, site], i) => (
          <Accordion.Item eventKey={String(i)} key={siteKey} className="mb-2 dg-card">
            <Accordion.Header>
              <strong className="me-2">{site.nome}</strong>
              <span className="text-muted">({site.andares.length} andares/peças)</span>
            </Accordion.Header>
            <Accordion.Body>
              <div className="row g-3">
                {site.andares.map((andar, j) => (
                  <div className="col-12" key={`${siteKey}-${andar.key}`}>
                    {/* bloco expandível simples: título + imagem logo abaixo (sem necessidade de outro botão) */}
                    <div className="dg-floor">
                      <div className="d-flex align-items-center justify-content-between">
                        <h6 className="m-0">{andar.label}</h6>
                      </div>

                      <div className="dg-img-wrap mt-2">
                        {andar.url ? (
                          <>
                            <img
                              src={andar.url}
                              alt={`${site.nome} - ${andar.label}`}
                              className="dg-img"
                              loading="lazy"
                              onClick={() => setModalImg({ url: andar.url, title: `${site.nome} — ${andar.label}` })}
                            />
                            <div className="dg-zoom">
                              <ZoomIn size={18} />
                            </div>
                          </>
                        ) : (
                          <div className="dg-missing">
                            <div><strong>Imagem não encontrada no bundle:</strong></div>
                            <div className="small mt-1 text-break">
                              {andar.bases.join(" / ")} (.png/.jpg/.jpeg/.svg/.gif)
                            </div>
                            <div className="small mt-1">
                              Coloque a imagem em <code>src/assets/</code> com um destes nomes.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>

      {/* Modal de tela cheia da imagem */}
      <Modal
        show={!!modalImg}
        onHide={() => setModalImg(null)}
        size="xl"
        centered
        fullscreen="md-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>{modalImg?.title || "Visualização"}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          {modalImg && (
            <img
              src={modalImg.url}
              alt={modalImg.title || "Imagem"}
              style={{ width: "100%", height: "auto", objectFit: "contain" }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalImg(null)}>Fechar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

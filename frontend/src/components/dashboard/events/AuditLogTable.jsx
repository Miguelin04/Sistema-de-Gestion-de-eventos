/**
 * @author Antigravity
 * @date 24/06/2026
 * @version 1.0
 * @description Tabla de visualización nativa de auditoría del sistema de eventos,
 * integrando filtros por acción, búsqueda libre y detalles formateados.
 */
import { useEffect, useState } from "react";
import { getAuditoria } from "./eventService";
import toast from "react-hot-toast";

// Iconos SVG
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const obtenerEstiloAccion = (accion) => {
  switch (accion) {
    case "CREAR":
    case "CREAR_UBICACION":
      return { background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" };
    case "MODIFICAR":
    case "MODIFICAR_UBICACION":
      return { background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" };
    case "CANCELAR":
    case "ELIMINAR_UBICACION":
      return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" };
    case "SUBIR_IMAGEN":
      return { background: "#f3e8ff", color: "#6b21a8", border: "1px solid #e9d5ff" };
    case "LIKE":
    case "DISLIKE":
      return { background: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5" };
    default:
      return { background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0" };
  }
};

export default function AuditLogTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAccion, setFilterAccion] = useState("TODOS");

  const cellStyle = {
    padding: "14px 20px",
    fontSize: "13px",
    color: "var(--text-main)",
    borderBottom: "1px solid #f1f5f9",
    textAlign: "left",
    verticalAlign: "middle"
  };

  const thStyle = {
    padding: "12px 20px",
    fontSize: "11px",
    fontWeight: "800",
    color: "var(--text-muted)",
    background: "var(--bg-app)",
    borderBottom: "1px solid #DBE3E0",
    textAlign: "left",
    letterSpacing: "0.5px"
  };

  const cargarAuditoria = async () => {
    setLoading(true);
    try {
      const data = await getAuditoria();
      // Asegurarse de que data sea siempre un array
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar la auditoría:", error);
      const msg = error?.response?.data?.detail || "Error al cargar los registros de auditoría";
      toast.error(msg);
      // Mantener la tabla visible aunque vacía
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAuditoria();
  }, []);

  const logsFiltrados = logs.filter((log) => {
    const matchesSearch =
      (log.detalle && log.detalle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.tabla_afectada && log.tabla_afectada.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(log.id_usuario).includes(searchTerm);

    const matchesAccion = filterAccion === "TODOS" || log.accion === filterAccion;

    return matchesSearch && matchesAccion;
  });

  const accionesDisponibles = ["TODOS", ...new Set(logs.map((l) => l.accion))];

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px", boxSizing: "border-box" }}>
      
      {/* HEADER DE LA SECCIÓN DE AUDITORÍA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }}>
          <span style={{ color: "#0F766E", display: "flex", alignItems: "center" }}>
            <IconShield />
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0F766E", letterSpacing: "-0.3px" }}>
              REGISTROS DE AUDITORÍA NATIVA
            </h2>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.2px" }}>
              Visualización directa en tiempo real de transacciones, creaciones, modificaciones e interacciones en la base de datos.
            </p>
          </div>
        </div>
        <button
          onClick={cargarAuditoria}
          disabled={loading}
          style={{
            background: "transparent",
            color: "#0F766E",
            border: "1px solid #0F766E",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "800",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "#f0fdfa"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <IconRefresh /> {loading ? "CARGANDO..." : "ACTUALIZAR LOGS"}
        </button>
      </div>

      {/* FILTROS Y CONTENEDOR DE TABLA */}
      <div style={{ background: "var(--bg-card)", border: "1px solid #DBE3E0", borderRadius: "0px", overflow: "hidden", width: "100%" }}>
        
        {/* BARRA DE FILTROS */}
        <div style={{ padding: "16px", borderBottom: "1px solid #DBE3E0", background: "var(--bg-card)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: "300px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar por detalle, entidad o ID usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                background: "var(--bg-app)",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "13px",
                color: "var(--text-main)",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)" }}>TIPO DE ACCIÓN:</label>
            <select
              value={filterAccion}
              onChange={(e) => setFilterAccion(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "var(--bg-app)",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "12px",
                color: "var(--text-main)",
                outline: "none",
                fontWeight: "700"
              }}
            >
              {accionesDisponibles.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLA DE AUDITORÍA */}
        <div style={{ overflowX: "auto", width: "100%" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontWeight: "600" }}>
              Cargando logs de auditoría...
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: "15%" }}>FECHA / HORA</th>
                  <th style={{ ...thStyle, width: "12%" }}>USUARIO (ID)</th>
                  <th style={{ ...thStyle, width: "15%" }}>CATEGORÍA (TABLA)</th>
                  <th style={{ ...thStyle, width: "15%" }}>ACCIÓN</th>
                  <th style={{ ...thStyle, width: "33%" }}>DETALLES DEL EVENTO (RESULTADO)</th>
                  <th style={{ ...thStyle, width: "10%", textAlign: "right" }}>RESULTADO</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.map((log, index) => (
                  <tr
                    key={log.id_auditoria ?? index}
                    style={{ transition: "background 0.2s" }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "var(--bg-app)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* FECHA Y HORA */}
                    <td style={cellStyle}>
                      <div style={{ fontWeight: "700" }}>
                        {log.fecha ? new Date(log.fecha).toLocaleDateString("es-EC", { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {log.fecha ? new Date(log.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ""}
                      </div>
                    </td>

                    {/* ACTOR / ID DE USUARIO (referencia externa al ms-usuarios) */}
                    <td style={cellStyle}>
                      <span style={{
                        background: "#f0fdfa",
                        color: "#0F766E",
                        border: "1px solid #99f6e4",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "800",
                        display: "inline-block",
                        letterSpacing: "0.3px"
                      }}>
                        ID #{log.id_usuario ?? "—"}
                      </span>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>
                        ms-usuarios
                      </div>
                    </td>

                    {/* CATEGORÍA / TABLA AFECTADA */}
                    <td style={{ ...cellStyle, textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>
                      {log.tabla_afectada ?? "—"}
                    </td>

                    {/* ACCIÓN BADGE */}
                    <td style={cellStyle}>
                      <span style={{
                        ...obtenerEstiloAccion(log.accion),
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "800",
                        display: "inline-block",
                        letterSpacing: "0.5px"
                      }}>
                        {log.accion?.replace(/_/g, ' ') ?? "—"}
                      </span>
                    </td>

                    {/* DETALLE */}
                    <td style={{ ...cellStyle, color: "var(--text-muted)", lineHeight: "1.4" }}>
                      {log.detalle || `Operación ${log.accion} → Registro #${log.id_registro_afectado ?? "?"}`}
                    </td>

                    {/* RESULTADO (ÉXITO) */}
                    <td style={{ ...cellStyle, textAlign: "right" }}>
                      <span style={{
                        background: "#d1fae5",
                        color: "#065f46",
                        border: "1px solid #a7f3d0",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "800",
                        display: "inline-block",
                        letterSpacing: "0.5px"
                      }}>
                        ÉXITO (200)
                      </span>
                    </td>
                  </tr>
                ))}

                {logsFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ ...cellStyle, padding: "40px", textAlign: "center", color: "var(--text-muted)", fontWeight: "600" }}>
                      No se encontraron registros de auditoría que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

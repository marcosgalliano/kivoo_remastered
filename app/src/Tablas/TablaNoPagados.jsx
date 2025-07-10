// components/TablaNoPagados.jsx
import React from "react";

const TablaNoPagados = ({ pedidos, atendidos, handleCheck }) => {
  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>Pedidos no pagados (Estado Correo no vacío):</h3>
      <table
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th>Atendido</th>
            <th>ID Pedido</th>
            <th>Cliente</th>
            <th>Monto</th>
            <th>Codigos de seguimiento</th>
            <th>Estado Correo</th>
            <th>Whatsapp</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido, index) => {
            const mensaje = `Hola ${pedido.Cliente}, ¿cómo estás? Te escribo de Kivoo para recordarte que todavía está pendiente la transferencia del pedido de buzos 💸. Quedamos atentos a la confirmación. Gracias.`;
            const urlWhatsapp = `https://api.whatsapp.com/send/?phone=${
              pedido.Whatsapp
            }&text=${encodeURIComponent(mensaje)}`;
            return (
              <tr
                key={index}
                style={
                  atendidos[pedido["ID Pedido"]]
                    ? { background: "#e0ffe0" }
                    : {}
                }
              >
                <td>
                  <input
                    type="checkbox"
                    checked={!!atendidos[pedido["ID Pedido"]]}
                    onChange={() => handleCheck(pedido["ID Pedido"])}
                  />
                </td>
                <td>{pedido["ID Pedido"]}</td>
                <td>{pedido.Cliente}</td>
                <td>${pedido.Monto}</td>
                <td>{pedido.TN}</td>
                <td>{pedido["Estado Correo"]}</td>
                <td>{pedido.Whatsapp}</td>
                <td>
                  {pedido.Whatsapp ? (
                    <a
                      href={urlWhatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button>Enviar mensaje</button>
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TablaNoPagados;

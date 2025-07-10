// components/TablaSeguimientos.jsx
import React from "react";

const TablaSeguimientos = ({ resultados, atendidos, handleCheck }) => {
  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>📋 Resultados del seguimiento:</h3>
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
            <th>Estado actual</th>
            <th>Whatsapp</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {resultados.map((pedido, index) => {
            let mensaje = "";
            if (
              pedido["Estado actual"] === "ENTREGADO" ||
              (pedido["Estado actual"] === "ENTREGA EN SUCURSAL" &&
                pedido.Whatsapp)
            ) {
              mensaje = `Hola ${pedido.Cliente}, Me acaban de decir los chicos de correo que ya te entregaron el paquete 🙏🏻 por favor realizas la transferencia al siguiente:  CVU: 0000147800000057214968 el importe total es de ${pedido.Monto} 💵 *DESPUES ENVIAME EL COMPROBANTE POR FAVOR 🧾*`;
            } else if (pedido["Estado actual"] === "EN ESPERA EN SUCURSAL") {
              mensaje = `Sucursal 🏤 ¡Hola ${pedido.Cliente}! 😊 Tu pedido ya está esperando para ser retirado en una sucursal. En un ratito te vamos a avisar exactamente cuál es la sucursal 📍. Tenés 3 días para ir a buscarlo, ¡gracias por tu compra! 🙌`;
            }
            const urlWhatsapp = `https://api.whatsapp.com/send/?phone=${
              pedido.Whatsapp
            }&text=${encodeURIComponent(mensaje)}`;
            return (
              <tr
                key={index}
                style={
                  atendidos[pedido["ID Pedido"]]
                    ? { background: "#b4ffb4" }
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
                <td>{pedido["Codigos de seguimiento"]}</td>
                <td>{pedido["Estado actual"]}</td>
                <td>{pedido.Whatsapp}</td>
                <td>
                  {(pedido["Estado actual"] === "ENTREGADO" ||
                    pedido["Estado actual"] === "ENTREGA EN SUCURSAL" ||
                    pedido["Estado actual"] === "EN ESPERA EN SUCURSAL") &&
                  pedido.Whatsapp ? (
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

export default TablaSeguimientos;

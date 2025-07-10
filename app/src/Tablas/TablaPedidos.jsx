// components/TablaPedidos.jsx
import React from "react";

const TablaPedidos = ({
  pedidos,
  atendidos,
  handleCheck,
  tipo,
  titulo,
  exportar,
  handleTextChange: handleStatusChange,
}) => {
  const calcularDiasDesde = (fechaTexto) => {
    if (!fechaTexto) return null;

    // Intenta parsear "24-06-2025 16:13" (formato del backend)
    const [dia, mes, anioHora] = fechaTexto.split("-");
    const [anio, hora] = anioHora.split(" ");
    const fechaEstado = new Date(`${anio}-${mes}-${dia}T${hora || "00:00"}`);

    const hoy = new Date();
    const diferenciaMs = hoy - fechaEstado;

    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

    return dias >= 0 ? dias : null;
  };

  return (
    <div
      style={{
        marginTop: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h3>{titulo}</h3>
      <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        <span style={{ fontWeight: "bold" }}>
          {tipo === "perdidos"
            ? "💸 Ingreso potencial perdido: $"
            : "💰 Ingreso potencial: $"}
          {pedidos.reduce(
            (total, pedido) => total + Number(pedido.Monto || 0),
            0
          )}
        </span>
        <span style={{ fontWeight: "bold" }}>
          📦 Cantidad de pedidos: {pedidos.length}
        </span>
      </div>
      <button
        onClick={exportar}
        style={{ backgroundColor: "#4CAF50", color: "white" }}
      >
        Exportar tabla a Excel
      </button>
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
            {tipo !== "seguimientos" ? <th>¿Pagado?</th> : null}
            <th>
              {tipo === "seguimientos" ? "Estado actual" : "Estado Correo"}
            </th>
            <th>Whatsapp</th>
            <th>Status</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido, index) => {
            const mensaje =
              tipo === "no_pagados"
                ? `Hola ${pedido.Cliente}, ¿cómo estás? Te escribo de Kivoo para recordarte que todavía está pendiente la transferencia del pedido de buzos 💸. Quedamos atentos a la confirmación. Gracias.`
                : pedido["Estado actual"]?.toUpperCase() === "ENTREGADO" ||
                  (pedido["Estado actual"]?.toUpperCase() ===
                    "ENTREGA EN SUCURSAL" &&
                    pedido.Whatsapp)
                ? `Hola ${pedido.Cliente}, te habla Ezequiel de Kivoo 😊 Me acaban de decir los chicos de correo que ya te entregaron el paquete 🙏🏻 

Por favor realizá la transferencia:

📌 *Si transferís desde una cuenta bancaria* (Santander, Galicia, Cuenta DNI, etc):  
👉🏻 *CVU:* 0720126088000003241736

📌 *Si transferís desde Mercado Pago*:  
👉🏻 *CVU:* 3840200500000002756437

💵 El importe total es de *$${pedido.Monto}*  
*Después enviame el comprobante por favor 🧾*`
                : pedido["Estado actual"]?.toUpperCase() ===
                  "EN ESPERA EN SUCURSAL"
                ? `Sucursal 🏤 ¡Hola ${pedido.Cliente}! Te habla Ezequiel de Kivoo 😊 Tu pedido ya está esperando para ser retirado en una sucursal. En un ratito te vamos a avisar exactamente cuál es la sucursal 📍. Tenés 3 días para ir a buscarlo, ¡gracias por tu compra! 🙌`
                : pedido["Estado actual"]?.toUpperCase() ===
                  "EN PODER DEL DISTRIBUIDOR"
                ? `Hola ${pedido.Cliente}, te habla Ezequiel de Kivoo 😊 ¿Cómo estás? Te quería decir que hoy mismo vas a estar recibiendo tu pedido en tu domicilio.

Cuando lo tengas, por favor realizá la transferencia:

📌 *Si transferís desde una cuenta bancaria* (Santander, Galicia, Cuenta DNI, etc):  
👉🏻 *CVU:* 0720126088000003241736

📌 *Si transferís desde Mercado Pago*:  
👉🏻 *CVU:* 3840200500000002756437

💵 El importe total es de *$${pedido.Monto}*  
*Por favor recordá que al chico de Correo Argentino no hay que pagarle nada*`
                : "";

            const urlWhatsapp =
              pedido.Whatsapp && mensaje
                ? `https://api.whatsapp.com/send/?phone=${
                    pedido.Whatsapp
                  }&text=${encodeURIComponent(mensaje)}`
                : null;

            return (
              <tr
                key={index}
                style={
                  atendidos[pedido["ID Pedido"]]
                    ? { background: "#006a00" }
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
                {tipo !== "seguimientos" ? <td>{pedido["¿Pagado?"]}</td> : null}
                <td>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span>
                      {tipo === "seguimientos" || tipo === "restantes"
                        ? pedido["Estado actual"]
                        : pedido["Estado Correo"]}
                    </span>

                    {(() => {
                      const dias = calcularDiasDesde(pedido.fechaDeEstado);

                      if (dias === null) return null;

                      let color = "black";
                      if (dias <= 1) color = "green";
                      else if (dias <= 3) color = "orange";
                      else color = "red";

                      return (
                        <span
                          style={{ color, fontSize: "0.9em", marginTop: "4px" }}
                        >
                          Hace {dias} día{dias !== 1 ? "s" : ""}
                        </span>
                      );
                    })()}
                  </div>
                </td>

                <td>{pedido.Whatsapp}</td>
                <td>
                  <textarea
                    rows="2"
                    cols="30"
                    value={tipo === "no_pagados" ? pedido.Status : pedido.STATUS}
                    onChange={(e) =>
                      handleStatusChange(pedido["ID Pedido"], e.target.value)
                    }
                  />
                </td>
                <td>
                  {urlWhatsapp ? (
                    <a href={urlWhatsapp} target="_blank" rel="noreferrer">
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

export default TablaPedidos;

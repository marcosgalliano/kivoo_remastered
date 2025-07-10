const { google } = require("googleapis");
const puppeteer = require("puppeteer");

const auth = new google.auth.GoogleAuth({
  keyFile: "./botcorreoseguimiento-9352db6f9e87.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = "14KaaQ6iAWJQeN_-fLPaQdYh0_RTsvESuGzF5bgV9QWo";
const HOJA_PEDIDOS = "PEDIDOS";

const consultarEnviosHandler = async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${HOJA_PEDIDOS}!A1:Z1000`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0)
      return res.status(404).json({ error: "No se encontraron pedidos" });

    const headers = rows[0];
    const pedidos = rows.slice(1).map((row) => {
      const pedido = {};
      headers.forEach((header, index) => {
        pedido[header] = row[index] || "";
      });
      return pedido;
    });

    const pedidosPerdidos = pedidos
      .filter((p) => p["Observaciones"] === "Perdido")
      .map((p) => ({ ...p, TN: p["Codigos de seguimiento"] }));
    const pedidosNoPagados = pedidos
      .filter(
        (p) =>
          p["Observaciones"] !== "Perdido" &&
          (p["¿Pagado?"] === "No" ||
            ((p["¿Pagado?"] === "" || p["¿Pagado?"] === "-") &&
              p["Estado Correo"] === "Entregado"))
      )
      .map((p) => ({ ...p, TN: p["Codigos de seguimiento"] }));

    const pedidosValidos = pedidos
      .filter(
        (p) =>
          p["Observaciones"] !== "Perdido" &&
          !(
            p["¿Pagado?"] === "No" ||
            ((p["¿Pagado?"] === "" || p["¿Pagado?"] === "-") &&
              p["Estado Correo"] === "Entregado")
          ) &&
          p["Estado Correo"] === "" &&
          p["Codigos de seguimiento"] &&
          p["Codigos de seguimiento"].trim() !== ""
      )
      .map((p) => ({ ...p, TN: p["Codigos de seguimiento"] }));

    const resultados = [];

    if (pedidosValidos.length > 0) {
      const browser = await puppeteer.launch({
        executablePath:
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      const estadosPermitidos = [
        "ENTREGA EN SUCURSAL",
        "ENTREGADO",
        "EN ESPERA EN SUCURSAL",
        "EN PODER DEL DISTRIBUIDOR",
        "DOMICILIO CERRADO/1 VISITA",
        "RETORNANDO",
        "RETORNAND0",
      ];

      for (const pedido of pedidosValidos) {
        const codigo = pedido.TN;
        try {
          await page.goto(
            `https://www.correoargentino.com.ar/formularios/e-commerce?id=${codigo}`
          );
          await Promise.all([page.click('button[id="btsubmit"]')]);
          await page.waitForSelector("table.table-hover tbody tr");

          const datos = await page.evaluate(() => {
            const filas = Array.from(
              document.querySelectorAll("table.table-hover tbody tr")
            );
            const eventos = filas.map((fila) => {
              const celdas = Array.from(fila.querySelectorAll("td")).map(
                (celda) => celda.innerText.trim()
              );
              return {
                fechaHora: celdas[0],
                historia: celdas[2],
                estado: celdas[3],
              };
            });

            const eventoConEstado = eventos.find((e) => e.estado !== "");
            if (eventoConEstado) return eventoConEstado;

            const eventoDistribuidor = eventos.find((e) =>
              e.historia.toUpperCase().includes("EN PODER DEL DISTRIBUIDOR")
            );
            if (eventoDistribuidor)
              return {
                estado: "EN PODER DEL DISTRIBUIDOR",
                historia: eventoDistribuidor.historia,
                fechaHora: eventoDistribuidor.fechaHora,
              };

            return { estado: "Sin datos", fechaHora: "" };
          });

          if (estadosPermitidos.includes(datos.estado)) {
            resultados.push({
              "ID Pedido": pedido["ID Pedido"],
              Cliente: pedido.Cliente,
              Monto: pedido.Monto,
              TN: codigo,
              "Estado actual": datos.estado,
              fechaDeEstado: datos.fechaHora,
              Whatsapp: pedido.Whatsapp,
              STATUS: pedido.Status,
            });
          }
        } catch (error) {
          resultados.push({ ...pedido, "Estado actual": "Error al consultar" });
        }
      }

      await browser.close();
    }

    res.json({
      consultados: resultados,
      perdidos: pedidosPerdidos,
      noPagados: pedidosNoPagados,
    });
  } catch (error) {
    console.error("❌ Error general:", error.message);
    res.status(500).json({ error: "Error general del servidor" });
  }
};

const updateStatusInExcelHandler = async (req, res) => {
  const pedidosParaActualizar = req.body; // [{ "ID Pedido": "1182", "STATUS": "Nuevo status" }, ...]

  if (
    !Array.isArray(pedidosParaActualizar) ||
    pedidosParaActualizar.length === 0
  ) {
    return res.status(400).json({ error: "Debes enviar un array de pedidos." });
  }

  try {
    // 1. Leer la hoja completa
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${HOJA_PEDIDOS}!A1:Z1000`,
    });

    const rows = response.data.values;
    
    const headers = rows[0];
    const pedidos = rows.slice(1).map((row) => {
      const pedido = {};
      headers.forEach((header, index) => {
        pedido[header] = row[index] || "";
      });
      return pedido;
    });
    

    const idIndex = headers.indexOf("ID Pedido");
    const statusIndex = headers.indexOf("Status");

    if (idIndex === -1 || statusIndex === -1) {
      return res
        .status(500)
        .json({
          error:
            "No se encontró la columna 'ID Pedido' o 'Status' en el Excel.",
        });
    }

    const updates = [];
    const noUpdates = [];

    pedidosParaActualizar.forEach((pedidoReq) => {
      const pedidoExcelIndex = pedidos.findIndex(
        (p) => p["ID Pedido"] === pedidoReq["ID Pedido"]
      );

      if (pedidoExcelIndex === -1) {
        noUpdates.push({ ...pedidoReq, motivo: "Pedido no encontrado" });
        return;
      }

      const rowNumber = pedidoExcelIndex + 2; // +2 porque el array empieza en 0 y hay encabezado
      const statusActual = pedidos[pedidoExcelIndex]["Status"] || "";
      const statusNuevo = pedidoReq["STATUS"] || "";

      if (statusNuevo === statusActual) {
        noUpdates.push({ ...pedidoReq, motivo: "Status idéntico al actual" });
        return;
      }

      if (statusNuevo === "" && statusActual !== "") {
        noUpdates.push({
          ...pedidoReq,
          motivo: "Status vacío, pero ya existe uno en Excel",
        });
        return;
      }

      updates.push({
        range: `${HOJA_PEDIDOS}!${colNumberToLetter(
          statusIndex + 1
        )}${rowNumber}`,
        values: [[statusNuevo]],
        id: pedidoReq["ID Pedido"],
      });
    });

    const batchUpdateRequests = updates.map((u) =>
      sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: u.range,
        valueInputOption: "RAW",
        requestBody: { values: u.values },
      })
    );

    await Promise.all(batchUpdateRequests);

    res.json({
      actualizados: updates.map((u) => u.id),
      noActualizados: noUpdates,
    });
  } catch (error) {
    console.error("❌ Error actualizando status:", error.message);
    res.status(500).json({ error: "Error actualizando status" });
  }
};

// Helper para convertir número de columna a letra (ej: 1 => A, 2 => B, etc.)
const colNumberToLetter = (num) => {
  let str = "";
  while (num > 0) {
    let rem = (num - 1) % 26;
    str = String.fromCharCode(65 + rem) + str;
    num = Math.floor((num - 1) / 26);
  }
  return str;
};

module.exports = {
  consultarEnviosHandler,
  updateStatusInExcelHandler,
};

'use strict';
var dotenv = require('dotenv');
dotenv.load();
let datos = {};
const express = require('express');
const app = express();
const uuidv1 = require('uuid/v1');

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const AI_SESSION_ID = uuidv1();

const dialogflow = require('apiai');
const ai = dialogflow(ACCESS_TOKEN);

const MENU = "menu";
const TIPO_DOC = "tipoDoc";
const NUM_DOC = "numDoc";

const servicioAfiliadoEPS = require('./services/consultaAfiliadoEPS');
const utilities = require('./public/js/utilities');
var arregloDias = [];
var fechaActual = new Date();
var dia = fechaActual.getDate();
var mes = fechaActual.getMonth();
var anio = fechaActual.getFullYear();
var mesString;
var estadoFlujo = "menu";
var estadoFlujoTipoDoc = "";
var usuario = "Gomito98";
var opcion = "inicial";
var mensajeNroDoc = "";
var tipoDoc = "";
var abreviatura = "";
var numDocumento;
app.use(express.static(__dirname + '/views')); // HTML Pages
app.use(express.static(__dirname + '/public')); // CSS, JS & Images

const server = app.listen(process.env.PORT || 9780, function () {
  console.log('listening on  port %d', server.address().port);
});

const socketio = require('socket.io')(server);
socketio.on('connection', function (socket) {
  console.log('a user connected');
});

//Serve UI
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/app.html');
});


socketio.on('connection', function (socket) {
  socket.on('chat request', (text) => {
    console.log('Message: ' + text);

    // Get a reply from API.ai

    let aiReq = ai.textRequest(text, {
      sessionId: AI_SESSION_ID
    });

    aiReq.on('response', (response) => {
      console.log("TODO: " + JSON.stringify(response));

      let aiResponse = response.result.fulfillment.speech;
      let intentId = response.result.metadata.intentId;
      /*  console.log('AI Response: ' + aiResponse);
       
       console.log('Intent ID: ', intentId);
       socket.emit('Intent ID: ', intentId); */

      /*Si el intent de DialogFlow es el de ingresar documento,
      llamar el servicio para confirmar afiliación.*/
      console.log("Estado iniciando: " + estadoFlujo);

      if (text.trim() == 'hola' && estadoFlujo == "menu") {
        let mensajeHola = "Hola " + usuario + ", Bienvenido a la línea de <b>Comfenalco Valle de la gente</b>.<br />" +
          "¿Qué desea realizar? <br /> " +
          "(AYUDA: indica el número o escriba la palabra. ejemplo: 'AF' o la palabra completa 'Estado de afiliación')<br />" +
          " - <b>(AF)</b> Estado de afiliación<br />" +
          " - <b>(PA)</b> Pagos en línea<br />" +
          " - <b>(SU)</b> Afiliación<br />" +
          " - <b>(PR)</b> Pre-afiliación<br />" +
          " - <b>(YA)</b> Yanaconas<br />" +
          " - <b>(VA)</b> Valle del lili<br />" +
          " - <b>(PQ)</b> PQRS´s<br />";
        socket.emit('ai response', mensajeHola);
        estadoFlujo = "tipoDoc";
        console.log(estadoFlujo);

      } else if (estadoFlujo == "tipoDoc") {

        console.log("Tipo Doc:" + text);

        if (text.trim() == 'AF' || opcion == 'AF') {
          console.log("Entro AF");
          console.log("OPCIÓN: " + opcion);


          if (opcion == 'inicial') {
            let mensajeAF = usuario + ", escoje tu tipo de documento</br>" +
              "- <b>(CC)</b> Cédula de ciudadanía.</br>" +
              "- <b>(CE)</b> Cédula de extranjería.</br>";
            socket.emit('ai response', mensajeAF);
            opcion = "AF";

            //Estado sólo para el flujo de tipo documento
            estadoFlujoTipoDoc = "numDoc";
            console.log(estadoFlujoTipoDoc);
          }

          if (estadoFlujoTipoDoc == "numDoc") {
            console.log("Entro " + text);

            if (text.trim() == 'CC' || text.trim() == 'CE') {
              abreviatura = text;
              tipoDoc = text == "CC" ? "Cédula de ciudadanía" : "Cédula de extranjería";
              mensajeNroDoc = "<b>" + usuario + "</b>, digita tu número de " + tipoDoc + " (EJEMPLO: 1107063182)";
              socket.emit('ai response', mensajeNroDoc);
              estadoFlujoTipoDoc = "validacionDoc";
              console.log(estadoFlujoTipoDoc);
              
            }
          }

          if (estadoFlujoTipoDoc == "validacionDoc") {
            
            if (text.trim().match(/([^a-zA-Z])/g)) {
              //Consultar el servicio
              console.log("Entró a conslar el servicio");
              numDocumento = Number(text);
              consultarServicio(abreviatura, numDocumento);
              let afiliado = JSON.parse(datos).responseMessageOut.body.response.consultaAfiliadoResponse.afiliado;
              let calidadAfiliado = afiliado.calidadAfiliado;
              let fechaAfiliacion = afiliado.fechaAfiliacionSistema;
              let tipoAfiliado = afiliado.tipoAfiliado;
              let correos = afiliado.email;

              let mensajeAfilaido = "<b>" + usuario + " se ha verificado exitosamente tu número de documento." +
                "</br> Tu calidad de afiliado es: " + calidadAfiliado +
                "</br> La fecha de tu afiliación es: " + fechaAfiliacion +
                "</br> IPS de atención: " + tipoAfiliado +
                "</br> Estos son los días que tenemos citas disponibles: </br>";
              socket.emit('ai response', mensajeAfilaido);

            } /* else {
              let cedulaValida = "<b>" + usuario + "</b>, por favor digita una " + tipoDoc + " válida";
              socket.emit('ai response', cedulaValida);
            } */
          }
        }


      }

      /*  if (intentId == '26cf2070-fed7-4bff-b1db-6ba04b5d8f25') {
         consultarServicio("CC", text);
         availableDates();
         let promise = new Promise((resolve, reject) => {
           setTimeout(() => {
             resolve(datos);
           }, 1000);
         });
     
         promise.then((res) => {
     
           console.log('res', res);
           var availableDate = '';
     
           arregloDias.forEach((element, index) => {
             console.log('heyy', index, element);
             index = index + 1;
             availableDate += index + '.' + element.text;
           });
     
     
           if (JSON.parse(res).responseMessageOut.body.response.consultaAfiliadoResponse.afiliado != undefined) {
             let afiliado = JSON.parse(res).responseMessageOut.body.response.consultaAfiliadoResponse.afiliado;
             let calidadAfiliado = afiliado.calidadAfiliado;
             let fechaAfiliacion = afiliado.fechaAfiliacionSistema;
             let tipoAfiliado = afiliado.tipoAfiliado;
             let correos = afiliado.email;
             console.log("Calidad afiliado: " + calidadAfiliado + "  Fecha afiliación: " + fechaAfiliacion);
             let mensaje = "Tu calidad es de: " + calidadAfiliado + ",\n estás afiliado desde: " + fechaAfiliacion + "\n y tu tipo de afiliación es: " + tipoAfiliado + "\n y los días disponibles para citas son: " + availableDate;
             socket.emit('ai response', mensaje);
           }
         });
       } else {
         socket.emit('ai response', aiResponse);
       } */
    });

    aiReq.on('error', (error) => {
      console.log(error);
    });

    aiReq.end();

  });
});


function consultarServicio(tipo, cedula) {

  setTimeout(() => {
    servicioAfiliadoEPS.servicioAfiliadoEPS.armaObjetos(tipo, cedula, (x) => {
      console.log('RESPONSE: ', x);
      datos = x;
    });
  }, 5000);
  return datos;
}


function availableDates() {
  switch (mes) {
    case 0: { mesString = 'January' } break;
    case 1: { mesString = 'February' } break;
    case 2: { mesString = 'March' } break;
    case 3: { mesString = 'April' } break;
    case 4: { mesString = 'May' } break;
    case 5: { mesString = 'June' } break;
    case 6: { mesString = 'July' } break;
    case 7: { mesString = 'August' } break;
    case 8: { mesString = 'September' } break;
    case 9: { mesString = 'October' } break;
    case 10: { mesString = 'November' } break;
    case 11: { mesString = 'December' } break;
  }

  let diasDisponibles = fechaActual.getDay();
  let contador = 0;
  /// ESTO ES EN CASO DE QUE EL HORARIO DE ATENFCIÓN SEA DE LUNES A VIERNES, EN CAOS DE QUE SE VA ATENDER FINES DE SEMANA HAY QUE HACER ALGO ADICIONAL
  for (let i = diasDisponibles; i <= 5; i++) {
    if (i == diasDisponibles) {
      arregloDias.push({ "text": 'Hoy ' + utilities.utilities.diaSemana(dia, mesString, anio) + ' ' + dia + '/' + (fechaActual.getMonth() + 1) + '/' + anio });
    } else if (i > diasDisponibles) {
      arregloDias.push({ "text": utilities.utilities.diaSemana(dia + contador, mesString, anio) + ' ' + (dia + contador) + '/' + (fechaActual.getMonth() + 1) + '/' + anio });
    }
    contador++;
  }
}

function cambiarEstado(texto) {

  switch (texto) {
    case "AF" || "Estado afiliación":
      estadoFlujo == "AF"
      break;
    default:
      break;
  }
  return estadoFlujo;
}
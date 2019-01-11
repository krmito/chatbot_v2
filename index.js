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
var estadoFlujo = "init";
var estadoFlujoTipoDoc = "";
var estadoFlujoTipoDocPA = "";
var usuario;
var opcion = "inicial";
var mensajeNroDoc = "";
var tipoDoc = "";
var abreviatura = "";
var numDocumento = 0;
var mensajeHola = "";
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
      console.log("Estado  sub: " + estadoFlujoTipoDocPA);

      if (estadoFlujo == "init") {
        let nombre = "Hola, por favor dime tu nombre";
        socket.emit('ai response', nombre);
        estadoFlujo = "menu";
      } else if (text.trim().match(/([a-zA-Z])/g) && estadoFlujo == "menu") {
        usuario = text.trim();
        mensajeHola = "Hola <b>" + usuario + "</b>, Bienvenido a la línea de <b>Comfenalco Valle de la gente</b>.<br />" +
          "¿Qué desea realizar? <br /> " +
          "(AYUDA: indica el número o escriba la palabra. ejemplo: 'AF' o la palabra completa 'Estado de afiliación')<br />" +
          " - <b>(AF)</b> Estado de afiliación<br />" +
          " - <b>(PA)</b> Pagos en línea<br />" +
          " - <b>(SU)</b> Afiliación<br />" +
          " - <b>(PR)</b> Pre-afiliación<br />" +
          " - <b>(YA)</b> Yanaconas<br />" +
          " - <b>(VA)</b> Valle del lilí<br />" +
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
              abreviatura = text.trim();
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
              numDocumento = text.trim();

              utilities.utilities.functionWithCallBack(consultarServicio(abreviatura, numDocumento), 4000).then(res => {
                if (JSON.parse(datos).responseMessageOut.body.response.consultaAfiliadoResponse.afiliado != undefined) {
                  let afiliado = JSON.parse(datos).responseMessageOut.body.response.consultaAfiliadoResponse.afiliado;
                  let calidadAfiliado = afiliado.calidadAfiliado;
                  let fechaAfiliacion = afiliado.fechaAfiliacionSistema;
                  let tipoAfiliado = afiliado.tipoAfiliado;
                  let correos = afiliado.email;

                  let mensajeAfilaido = "<b>" + usuario + "</b> se ha verificado exitosamente tu número de documento." +
                    "</br> Tu calidad de afiliado es:</br> <b>" + calidadAfiliado + "</b>" +
                    "</br> La fecha de tu afiliación es:</br> <b>" + fechaAfiliacion + "</b>" +
                    "</br> IPS de atención:</br> <b>" + tipoAfiliado + "</b>" +
                    "</br> Tu correo es:</br> <b>" + correos + ".</b>" +
                    "</br> Que desear hacer ahora :" + usuario + "?</b>" +
                    "</br>" +
                    "</br> 1. Volver al menú" +
                    "</br> 2. Nada";
                  socket.emit('ai response', mensajeAfilaido);
                  estadoFlujo = "deseo";
                } else {
                  let userNoFound = "Número de cédula no registrado";
                  socket.emit('ai response', userNoFound);
                }
              });
            }
          }
        }

        if (text.trim() == 'PA' || opcion == 'PA') {
          console.log("Entró a PA");

          let mensajeCerti = "<b>" + usuario + " </b>, ¿ Qué tipo de certificado deseas generar ? </br>" +
            " <b> - (AFI) </b> Certificado de afiliación individual.</br>" +
            " <b> - (SF) </b> Extracto subsidio familiar.</br>" +
            " <b> - (CR) </b> Certificado afiliación retirado.</br>";
          socket.emit('ai response', mensajeCerti);
          estadoFlujo = "tipoDocPA";
        }

      } else if (estadoFlujo == "tipoDocPA") {
        console.log("Entro a AFI");

        if (text.trim() == "AFI" || text.trim() == "SF" || text.trim() == "CR") {

          console.log(opcion);

          if (opcion == 'inicial') {
            let mensajeAFS = usuario + ", escoje tu tipo de documento</br>" +
              "- <b>(CC)</b> Cédula de ciudadanía.</br>" +
              "- <b>(CE)</b> Cédula de extranjería.</br>";
            socket.emit('ai response', mensajeAFS);
            opcion = "AF_PA";

            //Estado sólo para el flujo de tipo documento
            estadoFlujoTipoDocPA = "numDocPA";
            console.log(estadoFlujoTipoDoc);
          }

          if (estadoFlujoTipoDocPA == "numDocPA") {
            console.log("Entro " + text);

            if (text.trim() == 'CC' || text.trim() == 'CE') {
              abreviatura = text.trim();
              tipoDoc = text == "CC" ? "Cédula de ciudadanía" : "Cédula de extranjería";
              mensajeNroDoc = "<b>" + usuario + "</b>, digita tu número de " + tipoDoc + " (EJEMPLO: 1107063182)";
              socket.emit('ai response', mensajeNroDoc);
              estadoFlujoTipoDocPA = "validacionDocPA";
              console.log(estadoFlujoTipoDocPA);

            }
          }

          if (estadoFlujoTipoDocPA == "validacionDocPA") {
            if (text.trim().match(/([^a-zA-Z])/g)) {
              //Consultar el servicio
              console.log("Entró a conslar el servicio");
              numDocumento = text.trim();

              utilities.utilities.functionWithCallBack(consultarServicio(abreviatura, numDocumento), 4000).then(res => {
                if (JSON.parse(datos).responseMessageOut.body.response.consultaAfiliadoResponse.afiliado != undefined) {
                  let afiliado = JSON.parse(datos).responseMessageOut.body.response.consultaAfiliadoResponse.afiliado;
                  let calidadAfiliado = afiliado.calidadAfiliado;
                  let fechaAfiliacion = afiliado.fechaAfiliacionSistema;
                  let tipoAfiliado = afiliado.tipoAfiliado;
                  let correos = afiliado.email;

                  let mensajeAfilaido = "<b>" + usuario + "</b> se ha verificado exitosamente tu número de documento." +
                    "</br> Tu calidad de afiliado es:</br> <b>" + calidadAfiliado + "</b>" +
                    "</br> La fecha de tu afiliación es:</br> <b>" + fechaAfiliacion + "</b>" +
                    "</br> IPS de atención:</br> <b>" + tipoAfiliado + "</b>" +
                    "</br> Tu correo es:</br> <b>" + correos + ".</b>" +
                    "</br> Que desear hacer ahora :" + usuario + "?</b>" +
                    "</br>" +
                    "</br> 1. Volver al menú" +
                    "</br> 2. Nada";
                  socket.emit('ai response', mensajeAfilaido);
                  estadoFlujo = "deseo";
                } else {
                  let userNoFound = "Número de cédula no registrado";
                  socket.emit('ai response', userNoFound);
                }
              });
            }
          }
        }
      } else if (estadoFlujo == "deseo") {
        console.log("Entró a deseo");

        opcion = "inicial"
        if (text.trim() == 1 || text.trim() == 'Volver al menu') {
          socket.emit('ai response', mensajeHola);
          estadoFlujo = "tipoDoc";
          console.log(estadoFlujo);

        } else if (text.trim() == 2 || text.trim() == 'Nada') {
          let adios = "Adios " + usuario + ", hasta la próxima."
          socket.emit('ai response', adios);
          estadoFlujo = "menu";
        }
      }
    });
    aiReq.on('error', (error) => {
      console.log(error);
    });
    aiReq.end();
  });
});


function consultarServicio(tipo, cedula) {
  servicioAfiliadoEPS.servicioAfiliadoEPS.armaObjetos(tipo, cedula, (x) => {
    console.log('RESPONSE: ', x);
    datos = x;
  });
  return datos;
}
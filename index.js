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


const servicioAfiliadoEPS = require('./services/consultaAfiliadoEPS');
const utilities = require('./public/js/utilities');
var arregloDias = [];
var fechaActual = new Date();
var dia = fechaActual.getDate();
var mes = fechaActual.getMonth();
var anio = fechaActual.getFullYear();
var mesString;

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
      
      
      if (intentId == '26cf2070-fed7-4bff-b1db-6ba04b5d8f25') {
        consultarServicio("CC", text);
        availableDates();
        let promise = new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(datos);
          }, 2000);
        });

        promise.then((res) => {

          console.log('res', res);
          var availableDate = '';

          arregloDias.forEach((element, index) => {
            console.log('heyy', index, element);
            index = index + 1;
            availableDate +=  index + '.' + element.text;
          });


          if (JSON.parse(res).responseMessageOut.body.response.consultaAfiliadoResponse.afiliado != undefined) {
            let afiliado = JSON.parse(res).responseMessageOut.body.response.consultaAfiliadoResponse.afiliado;
            let calidadAfiliado = afiliado.calidadAfiliado;
            let fechaAfiliacion = afiliado.fechaAfiliacionSistema;
            let tipoAfiliado = afiliado.tipoAfiliado;
            let correos = afiliado.email;
            console.log("Calidad afiliado: " + calidadAfiliado + "  Fecha afiliación: " + fechaAfiliacion);
            let mensaje = "Tu calidad es de: " + calidadAfiliado + ", estás afiliado desde: " + fechaAfiliacion + " y tu tipo de afiliación es: " + tipoAfiliado + " y los días disponibles para citas son: " + availableDate;
            socket.emit('ai response', mensaje);
          }
        });
      } else {
        socket.emit('ai response', aiResponse);
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
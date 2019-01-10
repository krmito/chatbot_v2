"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var servicioAfiliadoEPS = /** @class */ (function () {
    function servicioAfiliadoEPS() {
    }
    servicioAfiliadoEPS.armaObjetos = function (tipo, cedula, callback) {
        console.log("Tipo: ", tipo, " cédula: ", cedula);
        this.cuerpo = {
            "requestMessageOut": {
                "header": {
                    "invokerDateTime": "2017-11-11 08:49:45",
                    "moduleId": "TAQUILLA1",
                    "systemId": "PEEWAH",
                    "messageId": "PEEWAH|TAQUILLA1|CC901097473",
                    "logginData": {
                        "sourceSystemId": "",
                        "destinationSystemId": ""
                    },
                    "destination": {
                        "namespace": "http://co/com/comfenalcovalle/esb/ws/ValidadorConsultaAfiliadosCaja",
                        "name": "ValidadorConsultaAfiliadosCaja",
                        "operation": "execute"
                    },
                    "securityCredential": {
                        "userName": "",
                        "userToken": ""
                    },
                    "classification": { "classification": "" }
                },
                "body": {
                    "request": {
                        "consultaAfiliadoRequest": {
                            "abreviatura": tipo,
                            "identificacion": cedula
                        }
                    }
                }
            }
        };
        console.log("Cuerpo: " + JSON.stringify(this.cuerpo));
        this.request.post({
            "headers": { "content-type": "application/json" },
            "url": this.servicio,
            "body": JSON.stringify(this.cuerpo)
        }, function (error, response, body) {
            console.log('THIS IS THE BODY: ', body);
            if (!error && response.statusCode == 200) {
                callback(body);
            }
            else {
                console.log(error);
            }
        });
    };

    servicioAfiliadoEPS.servicio = "https://virtual.comfenalcovalle.com.co/esb/RESTJSONChannelAdapter/Afiliado";
    servicioAfiliadoEPS.cuerpo = {};
    servicioAfiliadoEPS.request = require('request');
    servicioAfiliadoEPS.tipoDocumento = "";
    servicioAfiliadoEPS.fechaExpedicion = "";
    return servicioAfiliadoEPS;
}());

exports.servicioAfiliadoEPS = servicioAfiliadoEPS;

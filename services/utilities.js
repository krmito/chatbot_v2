let utilities = {
    functionWithCallBack: function (functionX, timeout) {
        let promise = new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(functionX);
            }, timeout);
        });

        return promise;
    },
    isContain: function (input, value) {
        if (input.includes(value)) {
            return value;
        }
    },
    diaSemana: function (dia, mes, anio) {
        let dias = ["dom", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sabado"];
        let dt = new Date(mes + ' ' + dia + ', ' + anio + ' 12:00:00');
        console.log('DIA DE LA SEMANA QUE QUIERO OBTENER ' + dias[dt.getUTCDay()]);
        return dias[dt.getUTCDay()];
    }
}



module.exports = utilities;
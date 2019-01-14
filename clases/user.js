"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var User = /** @class */ (function () {
    function User(chatId, body, state) {
        this.chatId = '';
        this.estado = '';
        this.sesion = '';
    }
    Object.defineProperty(User.prototype, "getChatId", {
        get: function () {
            return this.chatId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "getestado", {
        get: function () {
            return this.estado;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "getsesion", {
        get: function () {
            return this.sesion;
        },
        enumerable: true,
        configurable: true
    });
    return User;
}());
exports.User = User;

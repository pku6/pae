"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECLIT = exports.emitter = void 0;
const events_1 = require("events");
const cli_tools_1 = require("@ddu6/cli-tools");
exports.emitter = new events_1.EventEmitter();
class ECLIT extends cli_tools_1.CLIT {
    out(msg, level) {
        exports.emitter.emit('out', this.log(msg, level));
    }
}
exports.ECLIT = ECLIT;

import {EventEmitter} from 'events'
import {CLIT} from '@ddu6/cli-tools'
export const emitter = new EventEmitter()
export class ECLIT extends CLIT {
    out(msg: string | number | Error, level?: number) {
        emitter.emit('out', this.log(msg, level))
    }
}
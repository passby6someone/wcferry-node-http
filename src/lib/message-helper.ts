import { EventEmitter } from "events";
import debug from "debug";
import { Message } from "./message";
import { wcf } from "../proto/wcf";
import SocketHelper from "./socket-helper";
import { WcferryOptions } from "./client";

const logger = debug('wcferry:MessageHelper')

class MessageHelper {
    readonly EVENT_KEY = 'wxmsg';

    private msgEventSub: EventEmitter;

    private removeMessageListener: (() => void) | null = null;

    public recvPyq = false;
    
    public socketHelper: SocketHelper;

    public isReceiving = false;

    constructor(option: Required<WcferryOptions>) {
        this.recvPyq = option.recvPyq;

        this.msgEventSub = new EventEmitter();
        this.msgEventSub.setMaxListeners(0);

        this.socketHelper = new SocketHelper(option);
    }

    get listenerCount() {
        return this.msgEventSub.listenerCount(this.EVENT_KEY);
    }

    public init = () => {
        logger('init message helper');

        this.socketHelper.connect('cmd');
    }

    public close = () => {
        this.disableMsgReceiving();

        this.socketHelper.close();
    }

    public on = (callback: (msg: Message) => void) => {
        this.msgEventSub.on(this.EVENT_KEY, callback);
        if (this.socketHelper.connected && this.listenerCount === 1) {
            this.enableMsgReceiving();
        }
        return () => {
            if (this.socketHelper.connected && this.listenerCount === 1) {
                this.disableMsgReceiving();
            }
            this.msgEventSub.off(this.EVENT_KEY, callback);
        };
    }

    private handleMsg = (err: unknown | undefined, buf: Buffer) => {
        if (err) {
            logger("error while receiving message: %O", err);
            return;
        }
        const rsp = wcf.Response.deserialize(buf);
        this.msgEventSub.emit("wxmsg", new Message(rsp.wxmsg));
    }

    private enableMsgReceiving = () => {
        if (this.isReceiving) {
            return true;
        }
        const req = new wcf.Request({
            func: wcf.Functions.FUNC_ENABLE_RECV_TXT,
            flag: this.recvPyq,
        });

        const rsp = this.sendMessage(req);
        if (rsp.status !== 0) {
            logger('send receive request error')
            this.isReceiving = false;
            return false;
        }
        try {
            this.removeMessageListener = this.addMessageListener();
            this.isReceiving = true;
            return true;
        } catch (err) {
            this.removeMessageListener?.();
            this.isReceiving = false;
            logger("enable message receiving error: %O", err);
            return false;
        }
    }

    private addMessageListener() {
        const disposable = this.socketHelper.recvMessage(
            this.socketHelper.getUrl("msg"),
            null,
            this.handleMsg
        );

        return () => disposable.dispose();
    }

    private disableMsgReceiving(force = false): number {
        if (!force && !this.isReceiving) {
            return 0;
        }
        const req = new wcf.Request({
            func: wcf.Functions.FUNC_DISABLE_RECV_TXT,
        });
        const rsp = this.sendMessage(req);
        this.isReceiving = false;
        this.removeMessageListener?.();
        this.removeMessageListener = null;
        return rsp.status;
    }

    public sendMessage = (req: wcf.Request): wcf.Response => {
        const data = req.serialize();
        const buf = this.socketHelper.send(Buffer.from(data));
        const res = wcf.Response.deserialize(buf);
        return res;
    }

    /**
     * 设置是否接受朋友圈消息
     */
    public setRecvPyq = (recvPyq: boolean) => {
        if (this.recvPyq === recvPyq) return;

        if (this.isReceiving || this.socketHelper.connected) {
            this.disableMsgReceiving();
            this.enableMsgReceiving();
        }
    }
}

export default MessageHelper;

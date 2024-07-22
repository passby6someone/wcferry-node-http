import { Socket, SocketOptions } from "@rustup/nng";
import debug from "debug";

const logger = debug('wcferry:SocketHelper');

class SocketHelper {
    private socket: Socket;

    private cmdChannelUrl = '';

    private msgChannelUrl = '';

    constructor(options: {
        host: string,
        port: number,
        socketOptions?: SocketOptions
    }) {
        this.socket = new Socket(options.socketOptions);

        this.cmdChannelUrl = `tcp://${options.host}:${options.port + 0}`;

        logger('cmd channel url:', this.cmdChannelUrl);

        this.msgChannelUrl = `tcp://${options.host}:${options.port + 1}`;

        logger('msg channel url:', this.msgChannelUrl);
    }

    get connected() {
        return this.socket.connected();
    }

    close = () => {
        return this.socket.close();
    }

    send = (buffer: Buffer) => {
        return this.socket.send(buffer);
    }

    connect = (type: 'cmd' | 'msg') => {
        try {
            if (type === 'cmd') {
                return this.socket.connect(this.cmdChannelUrl);
            } else {
                return this.socket.connect(this.msgChannelUrl);
            }
        } catch (error) {
            logger('socket helper connect error', error);
        }
    }

    getUrl = (type: 'cmd' | 'msg') => {
        if (type === 'cmd') {
            return this.cmdChannelUrl;
        } else {
            return this.msgChannelUrl;
        }
    }

    recvMessage = (...args: Parameters<typeof Socket.recvMessage>) => {
        return Socket.recvMessage(...args);
    }
}

export default SocketHelper;

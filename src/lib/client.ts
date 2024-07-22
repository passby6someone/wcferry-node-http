import { SocketOptions } from "@rustup/nng";
import debug from "debug";
import { EventEmitter } from "events";
import {
  createTmpDir,
  ensureDirSync,
} from "./utils";
import { Message } from "./message";
import SDKHelper from "./sdk-helper";
import MessageHelper from "./message-helper";
import WXHelper from "./wx-helper";
import { DEFAULT_TMP_DIR } from "static";

export interface WcferryOptions {
  mode?: "local" | "remote";
  port?: number;
  /** if host is empty, the program will try to load wcferry.exe and *.dll */
  host?: string;
  socketOptions?: SocketOptions;
  /** the cache dir to hold temp files, defaults to `DEFAULT_TMP_DIR`  */
  cacheDir?: string;
  // 当使用wcferry.on(...)监听消息时，是否接受朋友圈消息
  recvPyq?: boolean;
}

const logger = debug("wcferry:client");

export class Wcferry {
  private readonly msgEventSub = new EventEmitter();

  private options: Required<WcferryOptions>;

  private sdkHelper: SDKHelper | null = null;

  private messageHelper: MessageHelper;

  private wxHelper: WXHelper;

  constructor(options?: WcferryOptions) {
    this.options = {
      mode: options?.mode || "local",
      port: options?.port || 10086,
      host: options?.host || "127.0.0.1",
      socketOptions: options?.socketOptions ?? {},
      cacheDir: options?.cacheDir || DEFAULT_TMP_DIR,
      recvPyq: !!options?.recvPyq,
    };

    logger("options", this.options);

    if (this.options.mode === "local") {
      this.sdkHelper = new SDKHelper(this.options.port);
    }

    this.messageHelper = new MessageHelper(this.options);

    this.wxHelper = new WXHelper({
      cacheDir: this.options.cacheDir,
      messageHelper: this.messageHelper,
    });

    ensureDirSync(this.options.cacheDir);

    this.msgEventSub.setMaxListeners(0);
  }

  private trapOnExit() {
    process.on('SIGINT', () => process.exit());
    process.on("exit", () => this.stop());
  }

  start() {
    try {
      this.sdkHelper && this.sdkHelper.init();
      this.messageHelper.init();
      this.trapOnExit();
    } catch (err) {
      logger("cannot connect to wcf RPC server, did wcf.exe started?");
      throw err;
    }
  }

  stop() {
    logger("Closing conneciton...");
    this.messageHelper.close();
    this.sdkHelper && this.sdkHelper.close();
  }

  get wx() {
    return this.wxHelper;
  }

  /**
   * 注册消息回调监听函数(listener), 通过call返回的函数注销
   * 当注册的监听函数数量大于0是自动调用enableMsgReceiving,否则自动调用disableMsgReceiving
   * 设置wcferry.recvPyq = true/false 来开启关闭接受朋友圈消息
   * @param callback 监听函数
   * @returns 注销监听函数
   */
  on(callback: (msg: Message) => void): () => void {
    return this.messageHelper.on(callback);
  }
}

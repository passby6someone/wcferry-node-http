import path from "path";
import koffi from "koffi";
import debug from "debug";

const logger = debug('wcferry:SDKHelper');

class SDKHelper {
    public isRun: boolean = false;
    private port: number = 10086;
    private InitWCFSDK: (debug: boolean, port: number) => number
    private DestroyWCFSDK: () => void

    constructor(port = 10086) {
        this.port = port;

        const dll_path = path.join(__dirname, "../wcf-sdk/sdk.dll");

        const wcf_sdk = koffi.load(dll_path);
        // @ts-ignore
        this.InitWCFSDK = wcf_sdk.func("int WxInitSDK(bool, int)", "stdcall");

        // @ts-ignore
        this.DestroyWCFSDK = wcf_sdk.func("void WxDestroySDK()", "stdcall");
    }

    init = () => {
        logger('SDK init');

        if (this.isRun) {
            logger('error SDK is running');
        }

        const initResult = this.InitWCFSDK(false, this.port);

        if (initResult == 0) {
            logger("wcf====>success");
            this.isRun = true;
        } else {
            logger("wcf=====>faild");
        }
    }

    close = () => {
        logger('SDK close');

        this.DestroyWCFSDK();

        this.isRun = false;

        logger("wcf======>close");
    }
}

export default SDKHelper

import http from "http"
import SDKHelper from "lib/sdk-helper";

const port = parseInt(process.env.WCF_DEV_SERVICE_PORT || '62345')

export const start_service = () => {
    const sdkHelper = new SDKHelper();

    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Hello, World!\n');
    })

    server.listen(port, '0.0.0.0', () => {
        sdkHelper.init();
        console.log(`Server is running at http://0.0.0.0:${port}`);
    });

    const stop = () => {
        server.close(() => {
            console.log('Server closed.');
        });
        sdkHelper.close();
        process.exit(0); // 退出进程
    }


    process.on('SIGINT', () => {
        process.exit(0)
    });
    process.on("exit", () => {
        console.log('wcf===>close')
        stop()
    });
}
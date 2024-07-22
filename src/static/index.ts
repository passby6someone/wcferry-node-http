import path from "path";
import os from "os";

export const NOT_FRIEND_WX_ID = {
    fmessage: "朋友推荐消息",
    medianote: "语音记事本",
    floatbottle: "漂流瓶",
    filehelper: "文件传输助手",
    newsapp: "新闻",
}

// 默认的临时文件夹
export const DEFAULT_TMP_DIR = process.env.DOWNLOAD_PATH
    ? path.resolve(process.env.DOWNLOAD_PATH.replace('{__dirname}', __dirname))
    : path.join(__dirname, 'TMP');

// 默认的缓存文件夹
export const DEFAULT_CACHE_DIR = process.env.CACHE_PATH
    ? path.resolve(process.env.CACHE_PATH.replace('{__dirname}', __dirname))
    : path.join(__dirname, 'CACHE');

// 微信文件路径
export const WX_FILES_PATH = process.env.WX_ROOT_PATH
    ? path.join(
        path.resolve(process.env.WX_ROOT_PATH),
        "WeChat Files"
    )
    : path.join(
        path.resolve(os.homedir()),
        "Documents",
        "WeChat Files"
    );

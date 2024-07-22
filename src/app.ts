import Koa from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import WebSocket from 'ws';
import { Wcferry, WcferryOptions } from "lib/client";
import debug from "debug";
import path from "path";
import { ensureDirSync } from "lib/utils";

const logger = debug('wcferry:app');

logger('Wcferry init');

const client = new Wcferry({
  mode: process.env.WCF_CLIENT_MODE as WcferryOptions["mode"] || 'local',
  port: parseInt(process.env.WCF_CLIENT_PORT || '10086'),
  host: process.env.WCF_CLIENT_HOST || '127.0.0.1',
});
client.start();

const isLogin = client.wx.isLogin();
const userinfo = client.wx.getUserInfo();

logger({
  isLogin, userinfo
});

const app = new Koa();
const router = new Router();

app.use(cors());
app.use(bodyParser());
app.use(router.routes());

const resultMaker = ({
  code = 0,
  msg = 'success',
  data = {}
}: {
  code?: number,
  msg?: string,
  data?: Record<string, any>
}) => {
  return {
    code,
    msg,
    data
  }
}

/**
 * 创建一个websocket服务，用于发送收到的消息
 * 
 * @param {string} callback_url
 * @returns {void}
 */
router.post('/api/message-callback-ws-url', (ctx) => {
  try {
    const { callback_url } = ctx.request.body as { callback_url?: string };

    if (!callback_url) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'callback_url is required'
      });

      return;
    }

    logger('callback_url:', callback_url);

    const ws = new WebSocket(callback_url);

    client.on(async (msg) => {
      ws.send(JSON.stringify(msg.raw));
    });

    ctx.body = resultMaker({});
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 获取消息类型
 * 
 * @returns { types: string[] }
 */
router.get('/api/msg-types', (ctx) => {
  try {
    const types = client.wx.getMsgTypes();

    ctx.body = resultMaker({
      data: {
        types
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 获取自己的wxid
 * 
 * @returns { wxid: string }
 */
router.get('/api/self/wxid', (ctx) => {
  try {
    const wxid = client.wx.getSelfWxid();

    ctx.body = resultMaker({
      data: {
        wxid
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 获取自己的用户信息
 * 
 * @returns { userInfo: Record<string, any> }
 */
router.get('/api/self/user-info', (ctx) => {
  try {
    const userInfo = client.wx.getUserInfo();

    ctx.body = resultMaker({
      data: {
        userInfo
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 获取自己的联系人
 * 
 * @returns { contacts: Record<string, any>[] }
 */
router.get('/api/self/contacts', (ctx) => {
  try {
    const contacts = client.wx.getContacts();

    ctx.body = resultMaker({
      data: {
        contacts
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 获取群聊中所有成员
 * 
 * @returns { chats: Record<string, any>[] }
 */
router.get('/api/room/:roomId/members', async (ctx) => {
  try {
    const roomId = ctx.params.roomId;
    
    logger('roomId:', roomId);

    if (!roomId) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'roomid is required'
      });

      return;
    }

    const members = await client.wx.getChatRoomMembers(roomId);

    ctx.body = resultMaker({
      data: {
        members
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 获取群聊中wxid对应成员的信息
 * 
 * @returns { member: Record<string, any> }
 */
router.get('/api/room/:roomId/:wxId', (ctx) => {
  try {
    const roomId = ctx.params.roomId;
    const wxId = ctx.params.wxId;

    if (!roomId || !wxId) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'roomId and wxId are required'
      });

      return;
    }

    const member = client.wx.getAliasInChatRoom(wxId, roomId);

    ctx.body = resultMaker({
      data: {
        member
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 获取所有数据库名称
 * 
 * @returns { names: string[] }
 */
router.get('/api/db/db-names', (ctx) => {
  try {
    const names = client.wx.getDbNames();

    ctx.body = resultMaker({
      data: {
        names
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 获取数据库中所有表名称
 * 
 * @returns { tables: string[] }
 */
router.get('/api/db/:DBName/tables', (ctx) => {
  try {
    const DBName = ctx.params.DBName;

    if (!DBName) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'DBName is required'
      });

      return;
    }

    const tables = client.wx.getDbTables(DBName);

    ctx.body = resultMaker({
      data: {
        tables
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 执行数据库查询
 * 
 * @param { DBName: string, query: string }
 * @returns { result: Record<string, any>[] }
 */
router.post('/api/db/exec-query', (ctx) => {
  try {
    const { DBName, query } = ctx.request.body as { DBName?: string, query?: string };

    if (!DBName || !query) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'DBName and query are required'
      });

      return;
    }

    const result = client.wx.dbSqlQuery(DBName, query);

    ctx.body = resultMaker({
      data: {
        result
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 获取消息附件
 * 
 * @returns { messages: Record<string, any>[] }
 */
router.get('/api/:messageId/attachment', (ctx) => {
  try {
    const messageId = ctx.params.messageId;

    logger('get attachment messageId:', messageId);

    if (!messageId) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'messageId is required'
      });

      return;
    }

    const result = client.wx.getMsgAttachments(messageId);

    ctx.body = resultMaker({
      data: {
        result
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 下载消息图片
 * 
 * @returns { result: number }
 */
router.get('/api/:messageId/image', async (ctx) => {
  try {
    const messageId = ctx.params.messageId;

    if (!messageId) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'messageId is required'
      });

      return;
    }

    ensureDirSync(path.join(__dirname, 'download', 'images'));

    const result = await client.wx.downloadImage(messageId, path.join(__dirname, 'download', 'images'));

    ctx.body = resultMaker({
      data: {
        result
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 发送文本消息
 * 
 * @param {
 *  msg: string
 *  receiver: string
 *  aters: string  // 要 @ 的 wxid，多个用逗号分隔；`@所有人` 只需要 `notify@all`
 * }
 * @returns { result: number }
 */
router.post('/api/send/txt', (ctx) => {
  try {
    const { msg, receiver, aters } = ctx.request.body as { msg?: string, receiver?: string, aters?: string };

    if (!msg || !receiver) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'msg and receiver are required'
      });

      return;
    }

    const result = client.wx.sendTxt(msg, receiver, aters || '');

    ctx.body = resultMaker({
      code: result === 0 ? 0 : 500,
      data: {
        result
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 发送图片消息
 * 
 * @param {
 *  path: string
 *  receiver: string
 * }
 * @returns { result: number }
 */
router.post('/api/send/img', async (ctx) => {
  try {
    const { path, receiver } = ctx.request.body as { path?: string, receiver?: string, suffix?: string };

    if (!path || !receiver) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'path and receiver are required'
      });

      return;
    }

    const result = await client.wx.sendImage(path, receiver);

    ctx.body = resultMaker({
      code: result === 0 ? 0 : 500,
      data: {
        result
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 发送文件消息
 * 
 * @param {
 *  path: string
 *  receiver: string
 * }
 * @returns { result: number }
 */
router.post('/api/send/file', async (ctx) => {
  try {
    const { path, receiver } = ctx.request.body as { path?: string, receiver?: string };

    if (!path || !receiver) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'path and receiver are required'
      });

      return;
    }

    const result = await client.wx.sendFile(path, receiver);

    ctx.body = resultMaker({
      code: result === 0 ? 0 : 500,
      data: {
        result
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 发送拍一拍消息
 * 
 * @param {
 *  roomId: string
 *  wxId: string
 * }
 * @returns { result: number }
 */
router.post('/api/send/pat', (ctx) => {
  try {
    const { roomId, wxId } = ctx.request.body as { roomId?: string, wxId?: string };

    if (!roomId || !wxId) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'path and receiver are required'
      });

      return;
    }

    const result = client.wx.sendPat(roomId, wxId);

    ctx.body = resultMaker({
      code: result === 0 ? 0 : 500,
      data: {
        result
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 发送名片消息
 * 
 * @param {
 *  description: string
 *  receiver: string
 * }
 * @returns { result: number }
 */
router.post('/api/send/rich-text', (ctx) => {
  try {
    const { description, receiver } = ctx.request.body as {
      description?: {
        name: string,
        account: string,
        title: string,
        digest: string,
        url: string,
        thumb_url: string
      },
      receiver?: string
    };

    if (!description || !receiver) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'description and receiver are required'
      });

      return;
    }

    if (!description.name || !description.account || !description.title || !description.digest || !description.url || !description.thumb_url) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'description.name, description.account, description.title, description.digest, description.url and description.thumb_url are required'
      });

      return;
    }

    const result = client.wx.sendRichText(description, receiver);

    ctx.body = resultMaker({
      code: result === 0 ? 0 : 500,
      data: {
        result
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

/**
 * 转发消息
 * 
 * @param {
 *  messageId: string
 *  receiver: string
 * }
 * @returns { result: number }
 */
router.post('/api/send/forward', (ctx) => {
  try {
    const { messageId, receiver } = ctx.request.body as { messageId?: string, receiver?: string };

    if (!messageId || !receiver) {
      ctx.body = resultMaker({
        code: 500,
        msg: 'messageId and receiver are required'
      });

      return;
    }

    const result = client.wx.forwardMsg(messageId, receiver);

    ctx.body = resultMaker({
      code: result === 0 ? 0 : 500,
      data: {
        result
      }
    });
  } catch (error: any) {
    logger('error:', error);

    ctx.body = resultMaker({
      code: 500,
      msg: error?.message || 'unknow error'
    });
  }
});

app.listen(parseInt(process.env.SERVER_PORT || '3000'), () => {
  logger('server is running at http://localhost:3000');
});

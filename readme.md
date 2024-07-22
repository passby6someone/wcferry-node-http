# Wcferry Node.js Client HTTP Server

本项目基于 [node-wcferry](https://github.com/stkevintan/node-wcferry) 和 [wcferry-node](https://github.com/dr-forget/wcferry-node) 改造而来，主要改动如下

1. 增加基于 koa 框架的 http 服务
2. 加入ws协议的消息回调
3. 对核心脚本 client.js 进行了拆分，重写了一部分代码
4. **修改了proto，MsgTypes会反序列化失败，临时做了替换（加载proto的脚本也做了处理）**
5. 修复了dbSqlQuery方法整数溢出问题（转为字符串，BigInt JSON.stringify时会报错）

## 致谢

特别感谢 GitHub 用户 [stkevintan](https://github.com/stkevintan), [dr-forget
](https://github.com/dr-forget)

对原开源项目做出的贡献。

## 注意事项

1. ```.env``` 文件中的 ```WX_ROOT_PATH``` 是微信的根目录路径，如果你是默认安装则不用改，如果安装到了非C盘位置需要改成微信安装的根目录，**否则下载图片/附件失效**

2. **注意（Windows 用户）**：编译需要特定的环境设置。如果遇到 `3221225781` 错误代码，请安装 Visual Studio 2022 及必要的工具：

```bash
choco install visualstudio2022-workload-vctools --package-parameters "--includeRecommended"
```

请确保提前安装了 Chocolatey (`choco`)。

## 使用步骤

### 运行服务

```bash
# 拉取最新proto
npm run build-proto
# 拉取最新dll
npm run get-wcf
# 运行
npm run start 
```

### 调试

调试建议先单独运行```service.ts```唤起客户端注入DLL启动nanomsg服务

然后修改```.env```中的```WCF_CLIENT_MODE```，并设置```WCF_CLIENT_HOST```，```WCF_CLIENT_PORT```http服务链接nanomsg服务的host和port

然后再运行http服务，通过监听文件更新重启服务

```bash
# 运行service
node dist/service.js
# 运行http服务
npm run dev
```

## 接口文档

Apifox 的 API Hub 审核中

可以先用[项目地址](https://1p36y38gnl.apifox.cn/)，可能需要申请之类的，看到就会同意，~~虽然我觉得没人会用~~

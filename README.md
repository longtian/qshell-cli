# qshell-cli
> 自动安装七牛命令行工具 `qshell` 到 `Node.js` 项目的依赖里

## 安装

```
npm install qshell-cli --save-dev
```

## 使用

#### 第 1 种：直接使用原始的 `qshell` 可执行文件

```
./node_modules/qshell-cli/vendor/qshell -h
```

#### 第 2 种：推荐在 `NPM Scripts` 中使用，因为 `NPM` 会自动修改 `PATH` 环境变量

要用 `npm run deploy` 的方式上传文件到七牛，可以修改 `package.json` 

```
{
  "scripts":{
    "deploy":"qshell qupload qiniu.config.js" 
  }
}
```

`qiniu.config.js` 是 `qshell` 上传文件的配置文件

## 关于

#### 为什么把 qshell 当成一个 NPM 的依赖

像 `qshell` 这样的部署工具一般只有运维人员才会用到，但对于提倡 `DevOps` 文化的团队来说，把部署工具也放进项目依赖里会非常方便。
这一点也是受到了 [12factor](https://12factor.net/zh_cn/) 里 `显式声明依赖关系` 这一条的启发。

#### 可选使用其它 CDN 地址

默认会从 `http://devtools.qiniu.com/qshell-{version}.zip` 来下载，你也可以使用其它的地址：

```
npm config qshell_cdnurl='http://10.0.0.1/path/qshell-{version}.zip'
```

不过 `qshell-cli` 为了保障安全和完整性，压缩包下载完成后会强制做 `md5` 校验，所以请确保使用从七牛官方下载的原始压缩包。

## Inspired by

https://github.com/Medium/phantomjs/blob/master/install.js

## Lincense

MIT

--------

We <3 Qiniu

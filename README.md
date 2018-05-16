

# cos-cdn

本项目封装了腾讯云的cos上传服务。

## 使用方法

```json
npm install cos-cdn -S -D
```


## 命令行demo
```json
"cdn:stage": "cos-cdn-upload --Directory='xxx-stage' --Filepath='dist'",
"cdn:prod": "cos-cdn-upload --Directory='xxx' --Filepath='dist'"
```

### 参数
|    Property    |    Description   | 	Default	|
| -------------- | ---------------- | -------- |
| Directory      | cdn子路径(https://static-alpha.xxx.com/xxx/) | default（一般设为项目名称，如juicy） |
| Filepath       | 你需要上传文件夹 | dist(从项目根路径开始) |
| AppId          | AppId      | process.env.COS_APP_ID |
| SecretId       | SecretId   | process.env.COS_SECRET_ID |
| SecretKey      | SecretKey  | process.env.COS_SECRET_KEY |
| Recursive      | Recursive  | true |
| Bucket         | Bucket     | static |
| Region         | Region     | cn-east |


> 本项目支持读取命令行参数或者读取根目录下`cos/config.js`的配置文件。

优先级：根目录下 `cos/config.js`的配置文件 > 命令行参数 > 内置配置


### 内置Config
```js
const config = {
  Directory: 'default',
  Filepath: 'dist',
  AppId: process.env.COS_APP_ID,
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
  Recursive: true,
  Bucket: 'static',
  Region: 'cn-east'
}
```

# 面霸后端 · 架构展示版

这是面霸后端的公开展示仓库，保留模块分层、部分数据契约、接口示例和通用组件。
学习规划、练习出题与判分、模型调用、知识锻造、持久化和生产部署实现由维护者私有维护。

**此目录不能运行完整产品。** 示例应用可以启动，但学习和练习入口固定返回 HTTP 501，
不会生成题目、执行判分、读取生产数据或调用模型。

## 保留内容

- Java 21 / Spring Boot 4 的多模块 Gradle 工程结构。
- `studyplan`、`drill`、`corpus`、`knowledge`、`interview`、`resume`、`project`、`user` 的分层边界。
- 原有统一响应、业务异常、文本工具、文件哈希与文本清洗代码，以及部分资料 DTO。
- 学习和练习的接口契约与明确不可用的占位实现。
- 使用固定假数据的资料接口和展示状态接口。

完整产品的 AI 适配基于 Spring AI 2；本公开版不包含模型适配器、提示词或编排规则。

## 本地查看示例

需要 JDK 21，不需要数据库、Redis 或模型密钥：

```bash
./gradlew :app:test
./gradlew :app:bootRun
```

Windows 使用 `gradlew.bat`。默认只监听 `127.0.0.1:8080`。

| 入口 | 行为 |
| --- | --- |
| `GET /api/showcase` | 返回展示范围，`coreAvailable=false` |
| `GET /api/corpus/examples` | 返回固定假数据 |
| `POST /api/study-plans` | HTTP 501，核心学习实现未公开 |
| `POST /api/drill/runs` | HTTP 501，核心练习实现未公开 |

## 架构与边界

- [模块架构](docs/architecture.md)
- [公开范围与历史说明](docs/public-scope.md)
- [接口示例](docs/interfaces.md)

真实部署配置、基础设施地址、数据文件、数据库迁移、核心业务实现及内部测试不在公开版中。
不要将完整开发分支合并或推送到本仓库。新增公开文件需要更新 `public-files.txt`，并通过边界检查。

## 安装包与更新

桌面产品由独立的私有流水线构建，本仓库仅接收安装包和版本说明标签。
[下载正式版本](https://github.com/mianba-vip/mianba-backend/releases/latest)。
新版本标签的 Source code 压缩包只包含发布说明与版本元数据；此展示工程不参与生产打包。

## 提交历史

为保护核心实现和部署信息，公开历史已经裁剪，受影响的提交标识会改变。
保留原有作者、时间和开发事件；部分提交不再包含公开代码差异。
`Public history record` 序号用于防止不同真实事件在裁剪后因内容相同而折叠。

本仓库公开代码沿用 [GNU GPL v3](LICENSE)。

# 接口示例

展示服务默认运行于本地。以下请求只用于验证公开边界：

```bash
curl http://127.0.0.1:8080/api/showcase
curl http://127.0.0.1:8080/api/corpus/examples
curl -i -H 'Content-Type: application/json' -d '{"goal":"示例目标"}' http://127.0.0.1:8080/api/study-plans
curl -i -H 'Content-Type: application/json' -d '{"topic":"示例主题"}' http://127.0.0.1:8080/api/drill/runs
```

后两项固定返回 HTTP 501 和统一错误响应，表示相关实现未包含在公开版中。
资料示例的标识、名称、时间和说明均为固定假数据，不连接真实资料库。
